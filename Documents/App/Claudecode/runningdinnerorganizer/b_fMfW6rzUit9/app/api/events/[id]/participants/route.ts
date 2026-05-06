import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

type RouteContext = { params: Promise<{ id: string }> }

// --- GET /api/events/[id]/participants ---
// Returns all participants for an event. Organizer-only.
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

    // Verify the caller owns this dinner
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .eq('dinner_id', id)
      .order('registered_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ participants: (participants ?? []).map(mapParticipant) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- POST /api/events/[id]/participants ---
// Public registration endpoint — no auth required.
// Uses the service-role client so it can bypass RLS.
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // Service-role client — bypasses RLS so unauthenticated users can insert
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    // Look up the dinner and check it is open for registration
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id, registration_active, registration_deadline')
      .eq('id', id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!dinner.registration_active) {
      return NextResponse.json({ error: 'Registration is not active for this event' }, { status: 400 })
    }

    if (dinner.registration_deadline && new Date(dinner.registration_deadline) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 })
    }

    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      lat,
      lng,
      dietaryRestrictions,
      hasPartner,
      partnerName,
      partnerEmail,
      partnerPhone,
      canHostSolo,
    } = body

    // Validate required fields (address is optional if lat/lng are provided)
    const missing = (['firstName', 'lastName', 'email', 'phone'] as const).filter(
      (field) => !body[field]
    )
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    if (!address && (lat == null || lng == null)) {
      return NextResponse.json(
        { error: 'Please provide either an address or set your location on the map.' },
        { status: 400 }
      )
    }

    const { data: participant, error: insertError } = await supabase
      .from('participants')
      .insert({
        dinner_id: id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address: address ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        dietary_restrictions: dietaryRestrictions ?? [],
        has_partner: hasPartner ?? false,
        partner_name: partnerName ?? null,
        partner_email: partnerEmail ?? null,
        partner_phone: partnerPhone ?? null,
        can_host_solo: canHostSolo ?? true,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ participant: mapParticipant(participant) }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helper: map DB row (snake_case) → API response (camelCase) ---
function mapParticipant(row: Record<string, unknown>) {
  return {
    id: row.id,
    dinnerId: row.dinner_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    dietaryRestrictions: row.dietary_restrictions,
    hasPartner: row.has_partner,
    partnerName: row.partner_name,
    partnerEmail: row.partner_email,
    partnerPhone: row.partner_phone,
    canHostSolo: row.can_host_solo,
    teamId: row.team_id,
    registeredAt: row.registered_at,
  }
}
