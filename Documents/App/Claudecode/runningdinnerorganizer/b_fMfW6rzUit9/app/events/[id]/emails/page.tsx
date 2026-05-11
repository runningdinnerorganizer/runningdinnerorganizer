'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { TemplateSelector } from '@/components/emails/template-selector'
import { TemplateEditor } from '@/components/emails/template-editor'
import { RecipientSelector } from '@/components/emails/recipient-selector'
import { EmailPreview } from '@/components/emails/email-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EmailTemplate } from '@/components/emails/template-selector'
import type { RealParticipant } from '@/components/emails/recipient-selector'
import type { RealEvent } from '@/components/emails/email-preview'
import { Send, Mail, FileText, Users, Eye, Inbox, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ---------------------------------------------------------------------------
// Hardcoded email templates (no DB table)
// ---------------------------------------------------------------------------
const CONTACT_FOOTER = `\n\n---\nQuestions? Reach out to {{contactName}}:\n✉️ {{contactEmail}}\n📞 {{contactPhone}}`

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    type: 'welcome',
    subject: '🍽️ You\'re in! Welcome to {{eventTitle}}!',
    body: `Hey {{firstName}}! 🎉\n\nThank you for registering for the Running Dinner event "{{eventTitle}}" on {{date}} in {{city}}!\n\nGet ready for an unforgettable evening full of delicious food, great company, and a little adventure. Here's a sneak peek at the schedule:\n\n🥗 Appetizer: {{appetizerTime}}\n🍝 Main Course: {{mainTime}}\n🍰 Dessert: {{dessertTime}}\n\nRegistration deadline: {{registrationDeadline}}\n\nYour personal team assignment and dinner route will follow soon.\n\nCurious about how a Running Dinner works? Scroll down! 👇\n\nWarm regards,\n{{contactName}}${CONTACT_FOOTER}\n\n\n---------------------------------------------------\n🍽️ HOW DOES A RUNNING DINNER WORK?\n---------------------------------------------------\n\nA Running Dinner is a social dining experience where participants share a multi-course meal — but each course takes place at a different home!\n\nHere's how your evening will unfold:\n\n1️⃣ APPETIZER\nYou start the evening at your first hosts' home together with one other couple. Enjoy the starter, get to know your fellow guests, and warm up for the night ahead.\n\n2️⃣ MAIN COURSE\nAfter appetizers, everyone moves on — you'll head to a completely different home with a brand new group of people. Fresh conversations, new faces, and a delicious main dish await.\n\n3️⃣ DESSERT\nFor the grand finale, you move once more to yet another home for dessert. By this point you'll have met a whole new circle of people from your community!\n\n🏠 YOUR ROLE AS HOST\nEvery team hosts exactly one course at their own home — so you'll be a guest for two courses and a host for one. As a host, you prepare and serve one dish for 6 people (including yourself). Simple and homemade is absolutely perfect!\n\n🤝 THE MAGIC OF IT\nBy the end of the evening, you will have shared a meal with up to 12 different people — all from your neighbourhood or community. A wonderful way to connect, discover new homes, and make lasting friendships.\n\nYou'll receive your exact route closer to the event. Until then — start thinking about what you'd like to cook! 🍳`,
  },
  {
    id: 'team_info',
    name: 'Team Assignment',
    type: 'team_info',
    subject: '🎉 Your team is set — {{eventTitle}} is getting real!',
    body: `Hey {{firstName}}! 🙌\n\nThe moment you've been waiting for — your team assignment for "{{eventTitle}}" is here!\n\nYour dinner partner: {{partnerName}} 🤝\n✉️ {{partnerEmail}}\n📞 {{partnerPhone}}\n\nYou are hosting the {{hostingCourse}} course!\n🕐 Time: {{hostingTime}}\n📍 At your place: {{hostingAddress}}\n\n📋 Dietary notes from your incoming guests:\n{{dietaryNotes}}\n\nPlease keep these in mind when preparing your dish — it means a lot to your guests!\n\nYour full dinner route will follow in a separate email very soon.\n\nWarm regards,\n{{contactName}}${CONTACT_FOOTER}`,
  },
  {
    id: 'route',
    name: 'Dinner Route',
    type: 'route',
    subject: '🗺️ Your dinner route for {{eventTitle}}!',
    body: `Hey {{firstName}}! 🚀\n\nYour personal dinner route for "{{eventTitle}}" on {{date}} is ready!\n\nHere's where your evening will take you:\n\n🥗 APPETIZER — {{appetizerTime}}\nHosts: {{appetizerHostNames}}\n📍 {{appetizerAddress}}\n📞 {{appetizerHostPhone}} / {{appetizerHostPhone2}}\n\n🍝 MAIN COURSE — {{mainTime}}\nHosts: {{mainHostNames}}\n📍 {{mainAddress}}\n📞 {{mainHostPhone}} / {{mainHostPhone2}}\n\n🍰 DESSERT — {{dessertTime}}\nHosts: {{dessertHostNames}}\n📍 {{dessertAddress}}\n📞 {{dessertHostPhone}} / {{dessertHostPhone2}}\n\n💡 A few tips:\n→ Arrive on time — your hosts have prepared everything for you!\n→ If you're running late, give your hosts a quick call.\n→ Most importantly: be open, be curious, and enjoy every bite!\n\nHave a wonderful evening! 🥂\n\nWarm regards,\n{{contactName}}${CONTACT_FOOTER}`,
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    type: 'reminder',
    subject: '⏰ Tomorrow is the big day — {{eventTitle}} is almost here!',
    body: `Hey {{firstName}}! 🌟\n\nJust one more sleep — {{eventTitle}} is TOMORROW!\n\nHere's your schedule one more time:\n\n🥗 Appetizer at {{appetizerTime}}\n{{appetizerHostNames}} — {{appetizerAddress}}\n📞 {{appetizerHostPhone}} / {{appetizerHostPhone2}}\n\n🍝 Main Course at {{mainTime}}\n{{mainHostNames}} — {{mainAddress}}\n📞 {{mainHostPhone}} / {{mainHostPhone2}}\n\n🍰 Dessert at {{dessertTime}}\n{{dessertHostNames}} — {{dessertAddress}}\n📞 {{dessertHostPhone}} / {{dessertHostPhone2}}\n\nSee you at the table! 🍽️✨\n\nWarm regards,\n{{contactName}}${CONTACT_FOOTER}`,
  },
  {
    id: 'no_team',
    name: 'No Team — Waitlist',
    type: 'no_team',
    subject: '😔 Unfortunately no spot for {{eventTitle}} this round',
    body: `Hey {{firstName}},\n\nThank you so much for signing up for "{{eventTitle}}" — we really appreciate your enthusiasm!\n\nUnfortunately, the number of participants for this event must be a multiple of 6 so that everyone can enjoy the full Running Dinner experience. With the current registrations, we were not able to assign you to a team for this round.\n\nYou are on our waitlist! As soon as a few more people sign up, you will be included and we will let you know straight away.\n\nWe are sorry for the inconvenience and hope to see you at a future Running Dinner very soon!\n\nWarm regards,\n{{contactName}}${CONTACT_FOOTER}`,
  },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EmailLog {
  id: string
  dinnerId: string
  emailType: string
  subject: string
  recipientId: string
  recipientEmail: string
  recipientName: string
  status: string
  sentAt: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EmailsPage() {
  const params = useParams()
  const eventId = params.id as string

  // Data state
  const [event, setEvent] = useState<RealEvent | null>(null)
  const [participants, setParticipants] = useState<RealParticipant[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Compose state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<RealParticipant[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sendComplete, setSendComplete] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------
  const fetchEmailLogs = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/emails`)
    if (res.ok) {
      const data = await res.json()
      setEmailLogs(data.logs ?? [])
    }
  }, [eventId])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [eventRes, participantsRes, logsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/participants`),
          fetch(`/api/events/${eventId}/emails`),
        ])

        if (!eventRes.ok) {
          const d = await eventRes.json()
          throw new Error(d.error ?? 'Failed to load event')
        }
        if (!participantsRes.ok) {
          const d = await participantsRes.json()
          throw new Error(d.error ?? 'Failed to load participants')
        }

        const eventData = await eventRes.json()
        const participantsData = await participantsRes.json()
        const logsData = logsRes.ok ? await logsRes.json() : { logs: [] }

        setEvent(eventData.event)
        setParticipants(participantsData.participants ?? [])
        setEmailLogs(logsData.logs ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [eventId])

  // ---------------------------------------------------------------------------
  // Email Preview section state
  // ---------------------------------------------------------------------------
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)
  const [previewSendingId, setPreviewSendingId] = useState<string | null>(null)
  const [previewLoggedId, setPreviewLoggedId] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Wizard handlers
  // ---------------------------------------------------------------------------
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedSubject(template.subject)
    setEditedBody(template.body)
    setSendComplete(false)
    setSendError(null)
    // Auto-pre-select recipients based on template type
    if (template.type === 'team_info' || template.type === 'route' || template.type === 'reminder') {
      setSelectedRecipients(participants.filter(p => p.teamId))
    } else if (template.type === 'no_team') {
      setSelectedRecipients(participants.filter(p => !p.teamId))
    } else {
      setSelectedRecipients([...participants])
    }
  }

  const handleSend = async () => {
    if (!selectedTemplate) return
    setIsSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          subject: editedSubject,
          body: editedBody,
          recipientIds: selectedRecipients.map(p => p.id),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to send emails')
      }

      setIsSending(false)
      setSendComplete(true)
      await fetchEmailLogs()
    } catch (err) {
      setIsSending(false)
      setSendError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleReset = () => {
    setSelectedTemplate(null)
    setEditedSubject('')
    setEditedBody('')
    setSelectedRecipients([])
    setSendComplete(false)
    setSendError(null)
  }

  // ---------------------------------------------------------------------------
  // Preview helper — replaces template placeholders with real participant data
  // ---------------------------------------------------------------------------
  function renderPreview(body: string, evt: RealEvent | null, participant?: RealParticipant): string {
    if (!evt) return body
    const firstName = participant?.firstName || participants[0]?.firstName || 'Max'
    const lastName = participant?.lastName || participants[0]?.lastName || 'Mustermann'
    const email = participant?.email || participants[0]?.email || 'participant@example.com'
    const address = participant?.address || participants[0]?.address || 'Musterstraße 1, 12345 Berlin'
    const phone = participant?.phone || participants[0]?.phone || '—'

    return body
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{eventTitle\}\}/g, evt.publicTitle || evt.title)
      .replace(/\{\{date\}\}/g, evt.date ? new Date(evt.date).toLocaleDateString('en-GB') : '—')
      .replace(/\{\{city\}\}/g, evt.city || '—')
      .replace(/\{\{appetizerTime\}\}/g, (evt.appetizerTime || '18:00').slice(0, 5))
      .replace(/\{\{mainTime\}\}/g, (evt.mainTime || '19:00').slice(0, 5))
      .replace(/\{\{dessertTime\}\}/g, (evt.dessertTime || '20:00').slice(0, 5))
      .replace(/\{\{registrationDeadline\}\}/g, (evt as unknown as Record<string, string>).registrationDeadline ? new Date((evt as unknown as Record<string, string>).registrationDeadline).toLocaleDateString('en-GB') : '—')
      .replace(/\{\{contactName\}\}/g, evt.contactName || '—')
      .replace(/\{\{contactEmail\}\}/g, evt.contactEmail || '—')
      .replace(/\{\{contactPhone\}\}/g, evt.contactPhone || '—')
      .replace(/\{\{partnerName\}\}/g, participants[1] ? `${participants[1].firstName} ${participants[1].lastName}` : 'Your Partner')
      .replace(/\{\{partnerEmail\}\}/g, participants[1]?.email || 'partner@example.com')
      .replace(/\{\{partnerPhone\}\}/g, participants[1]?.phone || '—')
      .replace(/\{\{hostingCourse\}\}/g, 'Appetizer')
      .replace(/\{\{hostingTime\}\}/g, (evt.appetizerTime || '18:00').slice(0, 5))
      .replace(/\{\{hostingAddress\}\}/g, address)
      .replace(/\{\{dietaryNotes\}\}/g, `${firstName}: ${participant?.dietaryRestrictions?.join(', ') || 'None'}`)
      .replace(/\{\{appetizerHostNames\}\}/g, participants[0] ? `${participants[0].firstName} & ${participants[1]?.firstName || 'Partner'}` : 'Host Team A')
      .replace(/\{\{appetizerAddress\}\}/g, participants[0]?.address || address)
      .replace(/\{\{appetizerHostPhone\}\}/g, participants[0]?.phone || phone)
      .replace(/\{\{appetizerHostPhone2\}\}/g, participants[1]?.phone || '—')
      .replace(/\{\{mainHostNames\}\}/g, participants[2] ? `${participants[2].firstName} & ${participants[3]?.firstName || 'Partner'}` : 'Host Team B')
      .replace(/\{\{mainAddress\}\}/g, participants[2]?.address || 'Hauptstraße 5, Berlin')
      .replace(/\{\{mainHostPhone\}\}/g, participants[2]?.phone || '—')
      .replace(/\{\{mainHostPhone2\}\}/g, participants[3]?.phone || '—')
      .replace(/\{\{dessertHostNames\}\}/g, participants[4] ? `${participants[4].firstName} & ${participants[5]?.firstName || 'Partner'}` : 'Host Team C')
      .replace(/\{\{dessertAddress\}\}/g, participants[4]?.address || 'Gartenweg 9, Berlin')
      .replace(/\{\{dessertHostPhone\}\}/g, participants[4]?.phone || '—')
      .replace(/\{\{dessertHostPhone2\}\}/g, participants[5]?.phone || '—')
  }

  async function handleSendToSelf(template: EmailTemplate) {
    setPreviewSendingId(template.id)
    setPreviewLoggedId(null)
    try {
      const res = await fetch(`/api/events/${eventId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          subject: renderPreview(template.subject, event),
          body: renderPreview(template.body, event),
          recipientIds: [],
          sendToSelf: true,
        }),
      })
      if (res.ok) {
        setPreviewLoggedId(template.id)
        setTimeout(() => setPreviewLoggedId(null), 3000)
      }
    } finally {
      setPreviewSendingId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Render: loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event not found</h1>
            <p className="mt-2 text-muted-foreground">{error ?? 'This event does not exist or has been deleted.'}</p>
            <Link href="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const typeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    welcome: 'default',
    team_info: 'secondary',
    route: 'outline',
    reminder: 'outline',
    no_team: 'destructive',
  }

  const sentEmailTypes = new Set(emailLogs.map(l => l.emailType))

  const uniqueSentBatches = emailLogs.reduce<{ key: string; type: string; subject: string; count: number; status: string; sentAt: string }[]>((acc, log) => {
    const minute = log.sentAt ? log.sentAt.slice(0, 16) : log.createdAt.slice(0, 16)
    const key = `${log.emailType}-${minute}`
    const existing = acc.find(b => b.key === key)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ key, type: log.emailType, subject: log.subject, count: 1, status: log.status, sentAt: log.sentAt ?? log.createdAt })
    }
    return acc
  }, [])

  const canSend = selectedTemplate && editedSubject.trim() && editedBody.trim() && selectedRecipients.length > 0

  // ---------------------------------------------------------------------------
  // Main render — single scrollable page
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar eventId={eventId} />

        <main className="flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">

            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Send Emails</h1>
              <p className="text-muted-foreground">
                Communicate with participants about {event.title || event.publicTitle}
              </p>
            </div>

            {/* ---- Section 1: Template ---- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> 1. Choose Template</CardTitle>
                <CardDescription>Select the type of email you want to send</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector
                  templates={EMAIL_TEMPLATES}
                  selectedTemplate={selectedTemplate}
                  onSelect={handleSelectTemplate}
                />
              </CardContent>
            </Card>

            {selectedTemplate && selectedTemplate.id === 'welcome' && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Automatically sent on registration</p>
                      <p className="mt-0.5 text-blue-700">Every participant receives this email immediately when they sign up. No manual action needed.</p>
                    </div>
                  </div>

                  {sendComplete && (
                    <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Sent successfully!</p>
                        <p className="text-sm text-green-700">{participants.length} participant{participants.length !== 1 ? 's' : ''} received the welcome email again.</p>
                      </div>
                    </div>
                  )}

                  {sendError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sendError}</p>
                  )}

                  {!sendComplete && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setIsSending(true)
                        setSendError(null)
                        try {
                          const res = await fetch(`/api/events/${eventId}/emails`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              templateId: 'welcome',
                              subject: editedSubject,
                              body: editedBody,
                              recipientIds: participants.map(p => p.id),
                            }),
                          })
                          if (!res.ok) {
                            const d = await res.json()
                            throw new Error(d.error ?? 'Failed to send')
                          }
                          setSendComplete(true)
                          await fetchEmailLogs()
                        } catch (err) {
                          setSendError(err instanceof Error ? err.message : 'Something went wrong')
                        } finally {
                          setIsSending(false)
                        }
                      }}
                      disabled={isSending || participants.length === 0}
                      className="gap-2"
                    >
                      {isSending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        <><Send className="h-4 w-4" /> Send again to all registered ({participants.length})</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedTemplate && selectedTemplate.id !== 'welcome' && (
              <>
                {/* ---- Section 2: Edit Content ---- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> 2. Customize Content</CardTitle>
                    <CardDescription>Edit the subject and body — placeholders like {'{{firstName}}'} will be replaced automatically</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplateEditor
                      subject={editedSubject}
                      body={editedBody}
                      onSubjectChange={setEditedSubject}
                      onBodyChange={setEditedBody}
                    />
                  </CardContent>
                </Card>

                {/* ---- Section 3: Recipients ---- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> 3. Choose Recipients</CardTitle>
                    <CardDescription>
                      {selectedTemplate.type === 'team_info' || selectedTemplate.type === 'route' || selectedTemplate.type === 'reminder'
                        ? 'Pre-selected: all participants with a team assigned'
                        : selectedTemplate.type === 'no_team'
                        ? 'Pre-selected: participants without a team (waitlisted)'
                        : 'Pre-selected: all participants'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecipientSelector
                      participants={participants}
                      selectedRecipients={selectedRecipients}
                      onSelectionChange={setSelectedRecipients}
                    />
                  </CardContent>
                </Card>

                {/* ---- Section 4: Preview & Send ---- */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> 4. Preview & Send</CardTitle>
                    <CardDescription>Review how the email will look, then send</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <EmailPreview
                      subject={renderPreview(editedSubject, event, selectedRecipients[0])}
                      body={renderPreview(editedBody, event, selectedRecipients[0])}
                      recipientCount={selectedRecipients.length}
                      sampleRecipient={selectedRecipients[0]}
                      event={event}
                    />

                    {sendComplete && (
                      <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Emails sent successfully!</p>
                          <p className="text-sm text-green-700">{selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} received this email.</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={handleReset}>
                          Send another
                        </Button>
                      </div>
                    )}

                    {sendError && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sendError}</p>
                    )}

                    {!sendComplete && (
                      <Button
                        onClick={handleSend}
                        disabled={!canSend || isSending}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {isSending ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                        ) : (
                          <><Send className="h-4 w-4" /> Send to {selectedRecipients.length} Recipient{selectedRecipients.length !== 1 ? 's' : ''}</>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ----------------------------------------------------------------
                Email Previews
            ---------------------------------------------------------------- */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Email Previews</h2>
                <p className="text-sm text-muted-foreground">See how each email looks before sending</p>
              </div>

              <div className="space-y-3">
                {EMAIL_TEMPLATES.map((template) => {
                  const isExpanded = expandedPreview === template.id
                  const isSendingThis = previewSendingId === template.id
                  const isLoggedThis = previewLoggedId === template.id
                  const renderedSubject = renderPreview(template.subject, event)
                  const renderedBody = renderPreview(template.body, event)

                  const wasSent = sentEmailTypes.has(template.id)

                  return (
                    <div key={template.id}>
                    <Card className={cn("overflow-hidden", wasSent && "border-green-300")}>
                      {wasSent && <div className="h-1 bg-green-400" />}
                      {/* Header — always visible */}
                      <div
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedPreview(isExpanded ? null : template.id)}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <Mail className={cn("h-4 w-4 shrink-0", wasSent ? "text-green-500" : "text-muted-foreground")} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{template.name}</p>
                            {template.id === 'welcome' && (
                              <span className="text-xs text-muted-foreground">(automatically sent on registration)</span>
                            )}
                            {wasSent && (
                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3 w-3" /> Sent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{renderedSubject}</p>
                        </div>

                        {/* Send to myself button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={isSendingThis}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendToSelf(template)
                          }}
                        >
                          {isLoggedThis ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              Logged
                            </>
                          ) : isSendingThis ? (
                            'Sending…'
                          ) : (
                            'Send to myself'
                          )}
                        </Button>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </div>

                      {/* Body — collapsible */}
                      {isExpanded && (
                        <div className="border-t px-4 py-4">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Preview with example data
                          </p>
                          <div className="rounded-md border bg-white px-4 py-3 text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                            {renderedBody}
                          </div>
                        </div>
                      )}
                    </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ----------------------------------------------------------------
                Email History
            ---------------------------------------------------------------- */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Email History</h2>

              {uniqueSentBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">No emails sent yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a template above and send your first email.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Recipients</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueSentBatches.map((batch) => (
                        <TableRow key={batch.key}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {batch.sentAt
                              ? format(new Date(batch.sentAt), 'MMM d, yyyy HH:mm')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeVariant[batch.type] ?? 'outline'} className="text-xs capitalize">
                              {batch.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[240px] truncate">
                            {batch.subject}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {batch.count}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                batch.status === 'sent'
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : "border-red-300 bg-red-50 text-red-700"
                              )}
                            >
                              {batch.status === 'sent' ? '✓ sent' : batch.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
