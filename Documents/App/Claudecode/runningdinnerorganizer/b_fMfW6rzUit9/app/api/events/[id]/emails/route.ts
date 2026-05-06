import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const body = await request.json()
    const { templateId, subject, body: emailBody, recipientIds } = body as {
      templateId: string
      subject: string
      body: string
      recipientIds: string[]
    }

    if (!templateId || !subject || !emailBody || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch each participant to get their email address
    const { data: participants, error: participantError } = await supabase
      .from('participants')
      .select('id, first_name, last_name, email')
      .eq('dinner_id', id)
      .in('id', recipientIds)

    if (participantError) throw participantError

    if (!participants || participants.length === 0) {
      return NextResponse.json({ sent: 0, logs: [] })
    }

    const fromAddress = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const rows: Record<string, unknown>[] = []

    // Send each email via Resend
    for (const p of participants) {
      const personalizedBody = emailBody.replace(/\{\{firstName\}\}/g, p.first_name)
      let status = 'sent'

      try {
        await resend.emails.send({
          from: fromAddress,
          to: p.email,
          subject,
          text: personalizedBody,
        })
      } catch {
        status = 'failed'
      }

      rows.push({
        dinner_id: id,
        email_type: templateId,
        subject,
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
