import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// --- GET /api/events ---
// Returns all running dinners owned by the authenticated user.
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: events, error } = await supabase
      .from('running_dinners')
      .select('*')
      .eq('organizer_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error

    // Map snake_case DB fields to camelCase for the API response
    const mapped = (events ?? []).map(mapEvent)

    return NextResponse.json({ events: mapped })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- POST /api/events ---
// Creates a new running dinner for the authenticated user.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      title,
      publicTitle,
      publicDescription,
      city,
      date,
      registrationDeadline,
      appetizerTime,
      mainTime,
      dessertTime,
      contactName,
      contactEmail,
      contactPhone,
    } = body

    const { data: event, error } = await supabase
      .from('running_dinners')
      .insert({
        organizer_id: user.id,
        title,
        public_title: publicTitle,
        public_description: publicDescription,
        city,
        date,
        registration_deadline: registrationDeadline,
        appetizer_time: appetizerTime,
        main_time: mainTime,
        dessert_time: dessertTime,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status: 'registration_open',
        registration_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ event: mapEvent(event) }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helper: map DB row (snake_case) → API response (camelCase) ---
// invite_token is included so the frontend can construct the public registration link.
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
    inviteToken: row.invite_token, // included so frontend can build the registration URL
    createdAt: row.created_at,
  }
}
