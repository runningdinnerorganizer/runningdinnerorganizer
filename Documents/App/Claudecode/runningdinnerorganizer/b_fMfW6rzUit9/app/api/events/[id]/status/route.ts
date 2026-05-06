import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type EventStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'teams_assigned'
  | 'completed'

const VALID_STATUSES: EventStatus[] = [
  'draft',
  'registration_open',
  'registration_closed',
  'teams_assigned',
  'completed',
]

// ---------------------------------------------------------------------------
// PUT /api/events/[id]/status
// Manually updates the status of a running dinner event.
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
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

    // Parse and validate body
    let body: { status?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { status } = body

    if (!status || !VALID_STATUSES.includes(status as EventStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
        },
        { status: 400 },
      )
    }

    const newStatus = status as EventStatus

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

    // Build update payload — sync registration_active with status
    const updatePayload: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'registration_open') {
      updatePayload.registration_active = true
    } else if (newStatus === 'registration_closed') {
      updatePayload.registration_active = false
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('running_dinners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ event: updatedEvent })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}
