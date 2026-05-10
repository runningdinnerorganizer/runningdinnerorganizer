import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import {
  assignTeams,
  type ParticipantInput,
  type DietaryRestriction,
} from '@/lib/algorithm'
import { geocodeAddress, sleep } from '@/lib/geocoding'

// ---------------------------------------------------------------------------
// POST /api/events/[id]/teams/generate
// Runs the team assignment algorithm and persists the results to the database.
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id, organizer_id, status')
      .eq('id', id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (dinner.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Status check — must have participants before generating
    if (
      dinner.status !== 'registration_closed' &&
      dinner.status !== 'registration_open'
    ) {
      return NextResponse.json(
        {
          error: `Cannot generate teams for an event with status "${dinner.status}". Status must be "registration_open" or "registration_closed".`,
        },
        { status: 400 },
      )
    }

    // Fetch all participants for this dinner
    const { data: rawParticipants, error: participantsError } = await supabase
      .from('participants')
      .select(
        'id, first_name, last_name, email, address, lat, lng, dietary_restrictions, has_partner, partner_name, partner_email, partner_phone, can_host_solo',
      )
      .eq('dinner_id', id)

    if (participantsError) {
      return NextResponse.json(
        { error: participantsError.message },
        { status: 500 },
      )
    }

    if (!rawParticipants || rawParticipants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found for this event.' },
        { status: 400 },
      )
    }

    // Service-role client to bypass RLS for bulk inserts (also used for geocoding persistence)
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    )

    // Ensure every couple registration has a matching participant row for the partner.
    // A couple registers as one row (has_partner = true, partner_email set); the partner
    // needs their own DB row so the algorithm can pair them and teams can reference them.
    const existingEmails = new Set(rawParticipants.map((p) => p.email))
    for (const p of rawParticipants) {
      if (!p.has_partner || !p.partner_email) continue
      if (existingEmails.has(p.partner_email)) continue // partner already has a row

      const nameParts = (p.partner_name ?? '').trim().split(/\s+/)
      const partnerFirstName = nameParts[0] || 'Partner'
      const partnerLastName = nameParts.slice(1).join(' ') || ''

      const { data: inserted } = await adminClient
        .from('participants')
        .insert({
          dinner_id: id,
          first_name: partnerFirstName,
          last_name: partnerLastName,
          email: p.partner_email,
          phone: p.partner_phone ?? null,
          address: p.address,
          lat: p.lat ?? null,
          lng: p.lng ?? null,
          dietary_restrictions: [],
          has_partner: false,
        })
        .select('id, first_name, last_name, email, address, lat, lng, dietary_restrictions, has_partner, partner_name, partner_email, partner_phone, can_host_solo')
        .single()

      if (inserted) {
        rawParticipants.push(inserted)
        existingEmails.add(inserted.email)
      }
    }

    const participants = rawParticipants

    // Map DB rows → ParticipantInput[]
    const inputs: ParticipantInput[] = participants.map((p) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      address: p.address,
      lat: p.lat ?? undefined,
      lng: p.lng ?? undefined,
      dietaryRestrictions: (p.dietary_restrictions ?? []) as DietaryRestriction[],
      hasPartner: p.has_partner,
      partnerId: p.has_partner
        ? participants.find((other) => other.email === p.partner_email)?.id
        : undefined,
      canHostSolo: p.can_host_solo ?? undefined,
    }))

    // Geocode participants that have no lat/lng yet
    for (const input of inputs) {
      if ((input.lat == null || input.lng == null) && input.address) {
        const geo = await geocodeAddress(input.address)
        if (geo) {
          input.lat = geo.lat
          input.lng = geo.lng
          // Also persist to DB so future runs skip geocoding
          await adminClient
            .from('participants')
            .update({ lat: geo.lat, lng: geo.lng })
            .eq('id', input.id)
        }
        await sleep(1100) // Nominatim rate limit: 1 req/s
      }
    }

    // Run the algorithm
    const result = assignTeams(inputs)

    // Return errors early — do not persist invalid results
    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: result.errors[0], warnings: result.warnings },
        { status: 400 },
      )
    }

    // 1. Insert teams — algorithm ids are temporary; DB generates real UUIDs
    //    Build a mapping: algorithmTeamId → dbTeamId
    const algorithmToDbId = new Map<string, string>()

    for (const team of result.teams) {
      const { data: inserted, error: insertError } = await adminClient
        .from('teams')
        .insert({
          dinner_id: id,
          member1_id: team.member1Id,
          member2_id: team.member2Id,
          hosting_course: team.hostingCourse,
          host_address: team.hostAddress,
          host_lat: team.hostLat ?? null,
          host_lng: team.hostLng ?? null,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        return NextResponse.json(
          { error: insertError?.message ?? 'Failed to insert team.' },
          { status: 500 },
        )
      }

      algorithmToDbId.set(team.id, inserted.id)
    }

    // 2. Insert course_assignments using real DB team ids
    for (const assignment of result.assignments) {
      const hostTeamId = algorithmToDbId.get(assignment.hostTeamId)
      const guestTeam1Id = algorithmToDbId.get(assignment.guestTeam1Id)
      const guestTeam2Id = algorithmToDbId.get(assignment.guestTeam2Id)

      if (!hostTeamId || !guestTeam1Id || !guestTeam2Id) {
        return NextResponse.json(
          { error: 'Internal error: could not resolve team ids for course assignment.' },
          { status: 500 },
        )
      }

      const { error: caError } = await adminClient
        .from('course_assignments')
        .insert({
          dinner_id: id,
          course: assignment.course,
          host_team_id: hostTeamId,
          guest_team1_id: guestTeam1Id,
          guest_team2_id: guestTeam2Id,
        })

      if (caError) {
        return NextResponse.json({ error: caError.message }, { status: 500 })
      }
    }

    // 3. Update each participant's team_id
    for (const team of result.teams) {
      const dbTeamId = algorithmToDbId.get(team.id)
      if (!dbTeamId) continue

      const { error: updateError } = await adminClient
        .from('participants')
        .update({ team_id: dbTeamId })
        .in('id', [team.member1Id, team.member2Id])

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        )
      }
    }

    // 4. Update dinner status
    const { error: statusError } = await adminClient
      .from('running_dinners')
      .update({ status: 'teams_assigned' })
      .eq('id', id)

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    // Build response teams/assignments with real DB ids
    const responseTeams = result.teams.map((t) => ({
      id: algorithmToDbId.get(t.id),
      member1Id: t.member1Id,
      member2Id: t.member2Id,
      hostingCourse: t.hostingCourse,
      hostAddress: t.hostAddress,
      hostLat: t.hostLat,
      hostLng: t.hostLng,
    }))

    const responseAssignments = result.assignments.map((a) => ({
      course: a.course,
      hostTeamId: algorithmToDbId.get(a.hostTeamId),
      guestTeam1Id: algorithmToDbId.get(a.guestTeam1Id),
      guestTeam2Id: algorithmToDbId.get(a.guestTeam2Id),
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalTeams: result.stats.totalTeams,
        tablesPerCourse: result.stats.tablesPerCourse,
        oddPersonOut: result.stats.oddPersonOut ?? null,
      },
      warnings: result.warnings,
      teams: responseTeams,
      assignments: responseAssignments,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}
