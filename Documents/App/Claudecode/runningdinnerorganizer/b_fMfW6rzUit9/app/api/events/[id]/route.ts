import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// --- GET /api/events/[id] ---
// Returns a single event (ownership verified) plus a live participant count.
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

    // Fetch the event — the organizer_id filter doubles as the ownership check
    const { data: event, error: eventError } = await supabase
      .from('running_dinners')
      .select('*')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch participants to count actual people (each registration can be 1 or 2 persons)
    const { data: participants, error: countError } = await supabase
      .from('participants')
      .select('has_partner')
      .eq('dinner_id', id)

    if (countError) throw countError

    const participantCount = (participants ?? []).reduce(
      (sum, p) => sum + (p.has_partner ? 2 : 1),
      0
    )

    return NextResponse.json({
      event: mapEvent(event),
      participantCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- PUT /api/events/[id] ---
// Updates allowed fields on an event (ownership verified).
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership check before attempting the update
    const { data: existing, error: fetchError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build the update object only from fields that were actually provided
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.publicTitle !== undefined) updates.public_title = body.publicTitle
    if (body.publicDescription !== undefined) updates.public_description = body.publicDescription
    if (body.city !== undefined) updates.city = body.city
    if (body.date !== undefined) updates.date = body.date
    if (body.registrationDeadline !== undefined) updates.registration_deadline = body.registrationDeadline
    if (body.appetizerTime !== undefined) updates.appetizer_time = body.appetizerTime
    if (body.mainTime !== undefined) updates.main_time = body.mainTime
    if (body.dessertTime !== undefined) updates.dessert_time = body.dessertTime
    if (body.contactName !== undefined) updates.contact_name = body.contactName
    if (body.contactEmail !== undefined) updates.contact_email = body.contactEmail
    if (body.contactPhone !== undefined) updates.contact_phone = body.contactPhone
    if (body.registrationActive !== undefined) updates.registration_active = body.registrationActive
    if (body.status !== undefined) updates.status = body.status

    const { data: event, error: updateError } = await supabase
      .from('running_dinners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ event: mapEvent(event) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- DELETE /api/events/[id] ---
// Deletes an event (ownership verified). Cascade handles related rows.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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
    const { data: existing, error: fetchError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('running_dinners')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helper: map DB row (snake_case) → API response (camelCase) ---
function mapEvent(row: Record<string, unknown>) {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    publicTitle: row.public_title,
    publicDescription: row.public_description,
    city: row.city,
    date: row.date,
    registrationDeadline: row.registration_deadline,
    appetizerTime: row.appetizer_time,
    mainTime: row.main_time,
    dessertTime: row.dessert_time,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    registrationActive: row.registration_active,
    status: row.status,
    inviteToken: row.invite_token,
    createdAt: row.created_at,
  }
}
