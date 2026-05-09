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
import { SendProgress } from '@/components/emails/send-progress'
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
import { ArrowLeft, ArrowRight, Send, Mail, FileText, Users, Eye, Inbox, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ---------------------------------------------------------------------------
// Hardcoded email templates (no DB table)
// ---------------------------------------------------------------------------
const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to {{eventTitle}}!',
    body: `Hi {{firstName}},\n\nThank you for registering for the Running Dinner event "{{eventTitle}}" on {{date}} in {{city}}!\n\nThe evening starts with appetizers at {{appetizerTime}}, followed by the main course at {{mainTime}}, and dessert at {{dessertTime}}.\n\nRegistration deadline: {{registrationDeadline}}\n\nYou will receive your team and route information soon.\n\nBest regards,\n{{contactName}}`,
  },
  {
    id: 'team_info',
    name: 'Team Assignment',
    type: 'team_info',
    subject: 'Your Team for {{eventTitle}}',
    body: `Hi {{firstName}},\n\nYour teams have been assigned for {{eventTitle}}!\n\nYour partner: {{partnerName}}\nYou are hosting: {{hostingCourse}} at {{hostingTime}}\nHosting address: {{hostingAddress}}\n\nDietary notes from your guests:\n{{dietaryNotes}}\n\nBest regards,\n{{contactName}}`,
  },
  {
    id: 'route',
    name: 'Dinner Route',
    type: 'route',
    subject: 'Your Dinner Route for {{eventTitle}}',
    body: `Hi {{firstName}},\n\nHere is your dinner route for {{eventTitle}} on {{date}}:\n\nAppetizer at {{appetizerTime}}:\n{{appetizerHostNames}} — {{appetizerAddress}}\nContact: {{appetizerHostPhone}}\n\nMain course at {{mainTime}}:\n{{mainHostNames}} — {{mainAddress}}\nContact: {{mainHostPhone}}\n\nDessert at {{dessertTime}}:\n{{dessertHostNames}} — {{dessertAddress}}\nContact: {{dessertHostPhone}}\n\nBest regards,\n{{contactName}}`,
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    type: 'reminder',
    subject: 'Reminder: {{eventTitle}} is Tomorrow!',
    body: `Hi {{firstName}},\n\nJust a reminder that {{eventTitle}} is tomorrow!\n\nYour schedule:\n- Appetizer at {{appetizerTime}}: {{appetizerHostNames}} — {{appetizerAddress}} ({{appetizerHostPhone}})\n- Main course at {{mainTime}}: {{mainHostNames}} — {{mainAddress}} ({{mainHostPhone}})\n- Dessert at {{dessertTime}}: {{dessertHostNames}} — {{dessertAddress}} ({{dessertHostPhone}})\n\nSee you there!\n\n{{contactName}}`,
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

const steps = [
  { id: 1, name: 'Select Template', icon: FileText },
  { id: 2, name: 'Edit Content', icon: Mail },
  { id: 3, name: 'Choose Recipients', icon: Users },
  { id: 4, name: 'Preview & Send', icon: Eye },
]

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

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
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
    setCurrentStep(2)
  }

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
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
    setCurrentStep(1)
    setSelectedTemplate(null)
    setEditedSubject('')
    setEditedBody('')
    setSelectedRecipients([])
    setSendComplete(false)
    setSendError(null)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedTemplate !== null
      case 2: return editedSubject.trim() !== '' && editedBody.trim() !== ''
      case 3: return selectedRecipients.length > 0
      case 4: return true
      default: return false
    }
  }

  // ---------------------------------------------------------------------------
  // Preview helper — replaces template placeholders with example / real data
  // ---------------------------------------------------------------------------
  function renderPreview(body: string, evt: RealEvent | null): string {
    if (!evt) return body
    return body
      .replace(/\{\{firstName\}\}/g, 'Max')
      .replace(/\{\{eventTitle\}\}/g, evt.publicTitle || evt.title)
      .replace(/\{\{date\}\}/g, evt.date ? new Date(evt.date).toLocaleDateString('en-GB') : '—')
      .replace(/\{\{city\}\}/g, evt.city || '—')
      .replace(/\{\{appetizerTime\}\}/g, (evt.appetizerTime || '19:00').slice(0, 5))
      .replace(/\{\{mainTime\}\}/g, (evt.mainTime || '20:00').slice(0, 5))
      .replace(/\{\{dessertTime\}\}/g, (evt.dessertTime || '21:00').slice(0, 5))
      .replace(/\{\{registrationDeadline\}\}/g, evt.registrationDeadline ? new Date(evt.registrationDeadline).toLocaleDateString('en-GB') : '—')
      .replace(/\{\{contactName\}\}/g, evt.contactName || '—')
      .replace(/\{\{partnerName\}\}/g, 'Anna Müller')
      .replace(/\{\{hostingCourse\}\}/g, 'Appetizer')
      .replace(/\{\{hostingTime\}\}/g, (evt.appetizerTime || '19:00').slice(0, 5))
      .replace(/\{\{hostingAddress\}\}/g, 'Musterstraße 1, 12345 Berlin')
      .replace(/\{\{dietaryNotes\}\}/g, 'Guest 1: Vegetarian\nGuest 2: Gluten-free')
      .replace(/\{\{appetizerHostNames\}\}/g, 'Lisa & Tom Müller')
      .replace(/\{\{appetizerAddress\}\}/g, 'Musterstraße 1, 12345 Berlin')
      .replace(/\{\{appetizerHostPhone\}\}/g, '+49 151 12345678')
      .replace(/\{\{mainHostNames\}\}/g, 'Julia & Peter Schmidt')
      .replace(/\{\{mainAddress\}\}/g, 'Beispielweg 5, 12345 Berlin')
      .replace(/\{\{mainHostPhone\}\}/g, '+49 152 87654321')
      .replace(/\{\{dessertHostNames\}\}/g, 'Sara & Klaus Weber')
      .replace(/\{\{dessertAddress\}\}/g, 'Testgasse 9, 12345 Berlin')
      .replace(/\{\{dessertHostPhone\}\}/g, '+49 160 11223344')
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
          <p className="text-muted-foreground">Loading...</p>
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
  // Render: sending / done overlay
  // ---------------------------------------------------------------------------
  if (isSending || sendComplete) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar eventId={eventId} />
          <main className="flex flex-1 items-center justify-center px-4 py-8">
            <SendProgress
              isSending={isSending}
              sendComplete={sendComplete}
              recipientCount={selectedRecipients.length}
              onReset={handleReset}
            />
          </main>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: email type badge color helper
  // ---------------------------------------------------------------------------
  const typeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    welcome: 'default',
    team_info: 'secondary',
    route: 'outline',
    reminder: 'outline',
  }

  // Group logs by batch: same emailType + same minute
  // Show flat list ordered by date desc
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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar eventId={eventId} />

        <main className="flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-10">

            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Send Emails</h1>
              <p className="text-muted-foreground">
                Communicate with participants about {event.title || event.publicTitle}
              </p>
            </div>

            {/* ----------------------------------------------------------------
                Wizard
            ---------------------------------------------------------------- */}

            {/* Progress Steps */}
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <li key={step.id} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                            currentStep > step.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : currentStep === step.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={cn(
                          "mt-2 text-xs font-medium",
                          currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.name}
                        </span>
                      </div>
                      {index !== steps.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1",
                            currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].name}</CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Choose a template for your email'}
                  {currentStep === 2 && 'Customize the email content'}
                  {currentStep === 3 && 'Select who should receive this email'}
                  {currentStep === 4 && 'Review and send your email'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 1 && (
                  <TemplateSelector
                    templates={EMAIL_TEMPLATES}
                    selectedTemplate={selectedTemplate}
                    onSelect={handleSelectTemplate}
                  />
                )}
                {currentStep === 2 && (
                  <TemplateEditor
                    subject={editedSubject}
                    body={editedBody}
                    onSubjectChange={setEditedSubject}
                    onBodyChange={setEditedBody}
                  />
                )}
                {currentStep === 3 && (
                  <RecipientSelector
                    participants={participants}
                    selectedRecipients={selectedRecipients}
                    onSelectionChange={setSelectedRecipients}
                  />
                )}
                {currentStep === 4 && selectedTemplate && (
                  <EmailPreview
                    subject={editedSubject}
                    body={editedBody}
                    recipientCount={selectedRecipients.length}
                    sampleRecipient={selectedRecipients[0]}
                    event={event}
                  />
                )}
              </CardContent>
            </Card>

            {sendError && (
              <p className="text-sm text-destructive">{sendError}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={handleNext} disabled={!isStepValid()}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!isStepValid()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send {selectedRecipients.length} Emails
                </Button>
              )}
            </div>

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

                  return (
                    <Card key={template.id} className="overflow-hidden">
                      {/* Header — always visible */}
                      <div
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedPreview(isExpanded ? null : template.id)}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{template.name}</p>
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
                    Use the wizard above to send your first email.
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
                              variant={batch.status === 'sent' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {batch.status}
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
