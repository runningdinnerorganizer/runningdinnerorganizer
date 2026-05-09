import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
})

type RouteContext = { params: Promise<{ id: string }> }

// Service-role client — bypasses RLS for inserts
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// --- GET /api/events/[id]/emails ---
// Returns email logs for an event. Organizer-only.
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

    // Ownership check
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('dinner_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ logs: (logs ?? []).map(mapEmailLog) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- POST /api/events/[id]/emails ---
// Logs emails to DB (no actual sending yet). Organizer-only.
export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const { data: dinner, error: dinnerError } = await supabase
      .from('running_dinners')
      .select('id')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single()

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await request.json()
    const { templateId, subject, body: emailBody, recipientIds, sendToSelf } = body as {
      templateId: string
      subject: string
      body: string
      recipientIds: string[]
      sendToSelf?: boolean
    }

    if (!templateId || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let participants: { id: string; first_name: string; last_name: string; email: string }[] = []

    if (sendToSelf) {
      // Send to the organizer's own email
      participants = [{ id: user.id, first_name: 'Organizer', last_name: '', email: user.email! }]
    } else {
      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const { data, error: participantError } = await supabase
        .from('participants')
        .select('id, first_name, last_name, email')
        .eq('dinner_id', id)
        .in('id', recipientIds)
      if (participantError) throw participantError
      participants = data ?? []
    }

    if (participants.length === 0) {
      return NextResponse.json({ sent: 0, logs: [] })
    }

    const fromAddress = process.env.EMAIL_FROM ?? 'runningdinnerorganizer@gmail.com'
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const rows: Record<string, unknown>[] = []

    // Send each email via Brevo SMTP
    for (const p of participants) {
      const personalizedBody = emailBody.replace(/\{\{firstName\}\}/g, p.first_name)
      let status = 'sent'

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: p.email,
          subject,
          text: personalizedBody,
        })
      } catch {
        status = 'failed'
      }

      rows.push({
        dinner_id: id,
        email_type: templateId,
        subject,
        recipient_email: p.email,
        recipient_name: `${p.first_name} ${p.last_name}`,
        status,
        sent_at: status === 'sent' ? now : null,
      })
    }

    const { data: logs, error: insertError } = await adminClient
      .from('email_logs')
      .insert(rows)
      .select()

    if (insertError) throw insertError

    const sentCount = rows.filter(r => r.status === 'sent').length
    return NextResponse.json({ sent: sentCount, total: rows.length, logs: (logs ?? []).map(mapEmailLog) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helper: map DB row (snake_case) → API response (camelCase) ---
function mapEmailLog(row: Record<string, unknown>) {
  return {
    id: row.id,
    dinnerId: row.dinner_id,
    emailType: row.email_type,
    subject: row.subject,
    recipientId: row.recipient_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    status: row.status,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }
}
