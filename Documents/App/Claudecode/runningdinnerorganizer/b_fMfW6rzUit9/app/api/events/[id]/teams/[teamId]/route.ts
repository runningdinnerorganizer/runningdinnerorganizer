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

type RouteContext = { params: Promise<{ id: string; teamId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, teamId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ownership check
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id, organizer_id')
      .eq('id', id)
      .single()

    if (dinnerError || !dinner) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (dinner.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { lat, lng } = body as { lat: number; lng: number }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required numbers' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('teams')
      .update({ host_lat: lat, host_lng: lng })
      .eq('id', teamId)
      .eq('dinner_id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
