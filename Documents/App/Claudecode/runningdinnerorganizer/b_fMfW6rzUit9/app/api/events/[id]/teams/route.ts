import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ---------------------------------------------------------------------------
// GET /api/events/[id]/teams
// Returns all teams (with member details) and course assignments for an event.
// ---------------------------------------------------------------------------
export async function GET(
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
      .select('id, organizer_id')
      .eq('id', id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (dinner.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS for data reads (ownership already verified above)
    const admin = createAdminClient()

    // Fetch teams
    const { data: teamsRaw, error: teamsError } = await admin
      .from('teams')
      .select('id, hosting_course, host_address, host_lat, host_lng, member1_id, member2_id')
      .eq('dinner_id', id)

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    // Fetch participant details for all team members
    const memberIds = (teamsRaw ?? []).flatMap((t: any) => [t.member1_id, t.member2_id])
    const { data: members } = await admin
      .from('participants')
      .select('id, first_name, last_name, email')
      .in('id', memberIds.length > 0 ? memberIds : ['00000000-0000-0000-0000-000000000000'])

    const memberMap = Object.fromEntries((members ?? []).map((m: any) => [m.id, m]))

    // Fetch course assignments
    const { data: assignmentsRaw, error: assignmentsError } = await admin
      .from('course_assignments')
      .select('id, course, host_team_id, guest_team1_id, guest_team2_id')
      .eq('dinner_id', id)

    if (assignmentsError) {
      return NextResponse.json(
        { error: assignmentsError.message },
        { status: 500 },
      )
    }

    // Shape teams response
    const teams = (teamsRaw ?? []).map((t: any) => {
      const m1 = memberMap[t.member1_id] ?? {}
      const m2 = memberMap[t.member2_id] ?? {}
      return {
        id: t.id,
        hostingCourse: t.hosting_course,
        hostAddress: t.host_address,
        hostLat: t.host_lat,
        hostLng: t.host_lng,
        member1: { id: m1.id, firstName: m1.first_name, lastName: m1.last_name, email: m1.email },
        member2: { id: m2.id, firstName: m2.first_name, lastName: m2.last_name, email: m2.email },
      }
    })

    // Shape assignments response
    const assignments = (assignmentsRaw ?? []).map((a: any) => ({
      id: a.id,
      course: a.course,
      hostTeamId: a.host_team_id,
      guestTeam1Id: a.guest_team1_id,
      guestTeam2Id: a.guest_team2_id,
    }))

    return NextResponse.json({ teams, assignments })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/events/[id]/teams
// Resets all teams, course assignments, and participant team_id for an event.
// ---------------------------------------------------------------------------
export async function DELETE(
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
      .select('id, organizer_id')
      .eq('id', id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (dinner.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Delete course_assignments first (references teams)
    const { error: caError } = await supabase
      .from('course_assignments')
      .delete()
      .eq('dinner_id', id)

    if (caError) {
      return NextResponse.json({ error: caError.message }, { status: 500 })
    }

    // 2. Reset participants.team_id → NULL
    const { error: participantsError } = await supabase
      .from('participants')
      .update({ team_id: null })
      .eq('dinner_id', id)

    if (participantsError) {
      return NextResponse.json(
        { error: participantsError.message },
        { status: 500 },
      )
    }

    // 3. Delete teams
    const { error: teamsError } = await supabase
      .from('teams')
      .delete()
      .eq('dinner_id', id)

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    // 4. Reset dinner status
    const { error: statusError } = await supabase
      .from('running_dinners')
      .update({ status: 'registration_closed' })
      .eq('id', id)

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}
