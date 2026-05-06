import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type RouteContext = { params: Promise<{ token: string }> }

// --- GET /api/join/[token] ---
// Public endpoint — no auth required.
// Returns basic dinner info so the registration page can display it.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params

    // Use service-role client to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const { data: dinner, error } = await supabase
      .from('running_dinners')
      .select(
        'id, public_title, public_description, city, date, appetizer_time, main_time, dessert_time, contact_name, contact_email, registration_deadline, registration_active, status'
      )
      .eq('invite_token', token)
      .single()

    if (error || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Only expose active/open events
    if (!dinner.registration_active) {
      return NextResponse.json({ error: 'Registration is closed for this event' }, { status: 404 })
    }

    return NextResponse.json({
      dinner: {
        id: dinner.id,
        publicTitle: dinner.public_title,
        publicDescription: dinner.public_description,
        city: dinner.city,
        date: dinner.date,
        appetizerTime: dinner.appetizer_time,
        mainTime: dinner.main_time,
        dessertTime: dinner.dessert_time,
        contactName: dinner.contact_name,
        contactEmail: dinner.contact_email,
        registrationDeadline: dinner.registration_deadline,
        status: dinner.status,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
