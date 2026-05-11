import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

type RouteContext = { params: Promise<{ id: string }> }

// Service-role client — bypasses RLS for inserts
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// --- GET /api/events/[id]/emails ---
// Returns email logs for an event. Organizer-only.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('dinner_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ logs: (logs ?? []).map(mapEmailLog) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- POST /api/events/[id]/emails ---
// Logs emails to DB (no actual sending yet). Organizer-only.
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check — fetch full dinner details for variable substitution
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id, title, public_title, city, date, appetizer_time, main_time, dessert_time, registration_deadline, contact_name, contact_email, contact_phone')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const { templateId, subject, body: emailBody, recipientIds, sendToSelf } = body as {
      templateId: string
      subject: string
      body: string
      recipientIds: string[]
      sendToSelf?: boolean
    }

    if (!templateId || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    let participants: { id: string; first_name: string; last_name: string; email: string; phone?: string }[] = []

    if (sendToSelf) {
      participants = [{ id: user.id, first_name: 'Organizer', last_name: '', email: user.email! }]
    } else {
      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const { data, error: participantError } = await adminClient
        .from('participants')
        .select('id, first_name, last_name, email, phone')
        .eq('dinner_id', id)
        .in('id', recipientIds)
      if (participantError) throw participantError
      participants = data ?? []
    }

    if (participants.length === 0) {
      return NextResponse.json({ sent: 0, logs: [] })
    }

    // ------------------------------------------------------------------
    // Build per-participant personalization maps for team/route templates
    // ------------------------------------------------------------------
    const needsTeamData = ['team_info', 'route', 'reminder'].includes(templateId)
    const personalizationMaps = new Map<string, Record<string, string>>()

    if (needsTeamData && !sendToSelf) {
      const [{ data: allTeams }, { data: allAssignments }, { data: allParticipants }] = await Promise.all([
        adminClient.from('teams').select('id, hosting_course, host_address, host_lat, host_lng, member1_id, member2_id').eq('dinner_id', id),
        adminClient.from('course_assignments').select('course, host_team_id, guest_team1_id, guest_team2_id').eq('dinner_id', id),
        adminClient.from('participants').select('id, first_name, last_name, email, phone, dietary_restrictions').eq('dinner_id', id),
      ])

      const teamById = new Map((allTeams ?? []).map((t: any) => [t.id, t]))
      const participantById = new Map((allParticipants ?? []).map((p: any) => [p.id, p]))

      const courseLabels: Record<string, string> = { appetizer: 'Appetizer', main: 'Main Course', dessert: 'Dessert' }
      const courseTimes: Record<string, string> = {
        appetizer: (dinner.appetizer_time ?? '').slice(0, 5),
        main: (dinner.main_time ?? '').slice(0, 5),
        dessert: (dinner.dessert_time ?? '').slice(0, 5),
      }

      for (const p of participants) {
        const team: any = (allTeams ?? []).find((t: any) => t.member1_id === p.id || t.member2_id === p.id)
        const vars: Record<string, string> = {}

        if (team) {
          const partnerId = team.member1_id === p.id ? team.member2_id : team.member1_id
          const partner: any = participantById.get(partnerId)

          vars.partnerName = partner ? `${partner.first_name} ${partner.last_name}` : '—'
          vars.partnerEmail = partner?.email ?? '—'
          vars.partnerPhone = partner?.phone ?? '—'
          vars.hostingCourse = courseLabels[team.hosting_course] ?? team.hosting_course
          vars.hostingTime = courseTimes[team.hosting_course] ?? '—'
          vars.hostingAddress = team.host_address ?? '—'

          // Dietary notes: members of both guest teams visiting this team's table
          const hostAssignment: any = (allAssignments ?? []).find((a: any) => a.host_team_id === team.id)
          if (hostAssignment) {
            const guestMemberIds = [
              (teamById.get(hostAssignment.guest_team1_id) as any)?.member1_id,
              (teamById.get(hostAssignment.guest_team1_id) as any)?.member2_id,
              (teamById.get(hostAssignment.guest_team2_id) as any)?.member1_id,
              (teamById.get(hostAssignment.guest_team2_id) as any)?.member2_id,
            ].filter(Boolean)

            const dietaryLines = guestMemberIds
              .map((mid: string) => participantById.get(mid) as any)
              .filter((m: any) => m?.dietary_restrictions?.length > 0)
              .map((m: any) => `${m.first_name} ${m.last_name}: ${m.dietary_restrictions.join(', ')}`)

            vars.dietaryNotes = dietaryLines.length > 0 ? dietaryLines.join('\n') : 'No special dietary requirements'
          } else {
            vars.dietaryNotes = 'No special dietary requirements'
          }

          // Route info: where this team goes for each course
          for (const course of ['appetizer', 'main', 'dessert'] as const) {
            const slot: any = (allAssignments ?? []).find((a: any) =>
              a.course === course && (a.host_team_id === team.id || a.guest_team1_id === team.id || a.guest_team2_id === team.id)
            )
            if (slot) {
              const hostTeam: any = teamById.get(slot.host_team_id)
              const hm1: any = hostTeam ? participantById.get(hostTeam.member1_id) : null
              const hm2: any = hostTeam ? participantById.get(hostTeam.member2_id) : null
              vars[`${course}HostNames`] = [hm1, hm2].filter(Boolean).map((m: any) => `${m.first_name} ${m.last_name}`).join(' & ')
              vars[`${course}Address`] = hostTeam?.host_address ?? '—'
              vars[`${course}HostPhone`] = hm1?.phone ?? '—'
              vars[`${course}HostPhone2`] = hm2?.phone ?? '—'
              // Google Maps link — prefer exact pin coordinates, fall back to address search
              if (hostTeam?.host_lat != null && hostTeam?.host_lng != null) {
                vars[`${course}MapLink`] = `https://www.google.com/maps?q=${hostTeam.host_lat},${hostTeam.host_lng}`
              } else if (hostTeam?.host_address) {
                vars[`${course}MapLink`] = `https://www.google.com/maps/search/${encodeURIComponent(hostTeam.host_address)}`
              } else {
                vars[`${course}MapLink`] = '—'
              }
            }
          }
        }

        personalizationMaps.set(p.id, vars)
      }
    }

    // ------------------------------------------------------------------
    // Global dinner variables (same for every recipient)
    // ------------------------------------------------------------------
    const dinnerVars: Record<string, string> = {
      eventTitle: dinner.public_title || dinner.title || '',
      date: dinner.date ? new Date(dinner.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—',
      city: dinner.city ?? '—',
      appetizerTime: (dinner.appetizer_time ?? '').slice(0, 5) || '—',
      mainTime: (dinner.main_time ?? '').slice(0, 5) || '—',
      dessertTime: (dinner.dessert_time ?? '').slice(0, 5) || '—',
      registrationDeadline: dinner.registration_deadline ? new Date(dinner.registration_deadline).toLocaleDateString('en-GB') : '—',
      contactName: dinner.contact_name ?? '—',
      contactEmail: dinner.contact_email ?? '—',
      contactPhone: dinner.contact_phone ?? '—',
    }

    function applyVars(text: string, vars: Record<string, string>): string {
      return Object.entries(vars).reduce(
        (t, [key, val]) => t.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val),
        text,
      )
    }

    const fromAddress = process.env.EMAIL_FROM ?? 'runningdinnerorganizer@gmail.com'
    const now = new Date().toISOString()
    const rows: Record<string, unknown>[] = []

    for (const p of participants) {
      const perParticipant: Record<string, string> = {
        firstName: p.first_name,
        ...(personalizationMaps.get(p.id) ?? {}),
      }

      const personalizedBody = applyVars(applyVars(emailBody, dinnerVars), perParticipant)
      const personalizedSubject = applyVars(applyVars(subject, dinnerVars), perParticipant)

      let status = 'sent'
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: p.email,
          subject: personalizedSubject,
          text: personalizedBody,
        })
      } catch {
        status = 'failed'
      }

      rows.push({
        dinner_id: id,
        email_type: templateId,
        subject: personalizedSubject,
        recipient_email: p.email,
        recipient_name: `${p.first_name} ${p.last_name}`,
        status,
        sent_at: status === 'sent' ? now : null,
      })
    }

    const { data: logs, error: insertError } = await adminClient
      .from('email_logs')
      .insert(rows)
      .select()

    if (insertError) throw insertError

    const sentCount = rows.filter(r => r.status === 'sent').length
    return NextResponse.json({ sent: sentCount, total: rows.length, logs: (logs ?? []).map(mapEmailLog) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helper: map DB row (snake_case) → API response (camelCase) ---
function mapEmailLog(row: Record<string, unknown>) {
  return {
    id: row.id,
    dinnerId: row.dinner_id,
    emailType: row.email_type,
    subject: row.subject,
    recipientId: row.recipient_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    status: row.status,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }
}
