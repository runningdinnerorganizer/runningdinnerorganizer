import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

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
      .select('id, registration_active, registration_deadline, title, public_title, city, date, appetizer_time, main_time, dessert_time, contact_name, contact_email, contact_phone')
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

    // If this is a couple registration, immediately create a DB row for the partner too.
    // This ensures the algorithm always receives one row per person, not one row per registration.
    if (hasPartner && partnerName && partnerEmail) {
      const nameParts = (partnerName as string).trim().split(/\s+/)
      const partnerFirstName = nameParts[0] || 'Partner'
      const partnerLastName = nameParts.slice(1).join(' ') || ''

      // Only insert if the partner hasn't already registered independently
      const { data: existingPartner } = await supabase
        .from('participants')
        .select('id')
        .eq('dinner_id', id)
        .eq('email', partnerEmail)
        .maybeSingle()

      if (!existingPartner) {
        await supabase.from('participants').insert({
          dinner_id: id,
          first_name: partnerFirstName,
          last_name: partnerLastName,
          email: partnerEmail,
          phone: partnerPhone ?? null,
          address: address ?? null,
          lat: lat ?? null,
          lng: lng ?? null,
          dietary_restrictions: [],
          has_partner: false,
          can_host_solo: canHostSolo ?? true,
        })
      }
    }

    // Send welcome email
    try {
      const eventTitle = dinner.public_title || dinner.title
      const eventDate = dinner.date ? new Date(dinner.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'
      const fmt = (t: string) => (t || '').slice(0, 5)
      const body = `Hey ${firstName}! 🎉\n\nThank you for registering for the Running Dinner event "${eventTitle}" on ${eventDate} in ${dinner.city}!\n\nGet ready for an unforgettable evening full of delicious food and great company. Here's a sneak peek at the schedule:\n\n🥗 Appetizer: ${fmt(dinner.appetizer_time)}\n🍝 Main Course: ${fmt(dinner.main_time)}\n🍰 Dessert: ${fmt(dinner.dessert_time)}\n\nYour personal team assignment and dinner route will follow soon.\n\nCurious about how a Running Dinner works? Scroll to the bottom of this email! 👇\n\nWarm regards,\n${dinner.contact_name || 'The Organizer'}\n\n---\nQuestions? Reach out to ${dinner.contact_name || 'the organizer'}:\n✉️ ${dinner.contact_email || '—'}\n📞 ${dinner.contact_phone || '—'}\n\n\n---------------------------------------------------\n🍽️ HOW DOES A RUNNING DINNER WORK?\n---------------------------------------------------\n\nA Running Dinner is a social dining experience where participants share a multi-course meal — but each course takes place at a different home!\n\n1️⃣ APPETIZER\nYou start the evening at your first hosts' home together with one other couple.\n\n2️⃣ MAIN COURSE\nYou move to a completely different home with a brand new group of people.\n\n3️⃣ DESSERT\nFor the grand finale, you move once more to yet another home for dessert.\n\n🏠 YOUR ROLE AS HOST\nEvery team hosts exactly one course — so you'll be a guest for two courses and a host for one. Simple and homemade is absolutely perfect!\n\n🤝 THE MAGIC\nBy the end of the evening, you will have shared a meal with up to 12 different people from your community. A wonderful way to connect and make lasting friendships. 🌟\n\nFeedback about this platform → lukasweick@gmail.com`

      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'runningdinnerorganizer@gmail.com',
        to: email,
        subject: `🍽️ You're in! Welcome to ${eventTitle}!`,
        text: body,
      })
    } catch {
      // Don't fail registration if email fails
    }

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
