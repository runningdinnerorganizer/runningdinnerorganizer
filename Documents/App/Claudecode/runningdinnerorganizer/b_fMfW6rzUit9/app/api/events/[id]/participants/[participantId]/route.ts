import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string; participantId: string }> }

// --- DELETE /api/events/[id]/participants/[participantId] ---
// Removes a participant from an event. Organizer-only.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id, participantId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the caller owns the dinner that this participant belongs to
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete the participant (also verifying dinner_id to prevent cross-event deletions)
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('dinner_id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
