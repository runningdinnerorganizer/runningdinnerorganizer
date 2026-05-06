'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Mail, Users, Calendar, Info } from 'lucide-react'
import type { RealParticipant } from '@/components/emails/recipient-selector'

export interface RealEvent {
  id: string
  title: string
  publicTitle: string
  city: string
  date: string
  appetizerTime: string
  mainTime: string
  dessertTime: string
  contactName: string
  contactEmail: string
  status: string
}

interface EmailPreviewProps {
  subject: string
  body: string
  recipientCount: number
  sampleRecipient?: RealParticipant
  event: RealEvent
}

export function EmailPreview({ subject, body, recipientCount, sampleRecipient, event }: EmailPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Emails to Send</p>
            <p className="text-lg font-semibold">{recipientCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Recipients</p>
            <p className="text-lg font-semibold">{recipientCount} participants</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Event Date</p>
            <p className="text-lg font-semibold">
              {event.date ? format(new Date(event.date), 'MMM d') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Email Preview */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Email Preview</CardTitle>
            {sampleRecipient && (
              <Badge variant="outline">
                Preview for: {sampleRecipient.firstName} {sampleRecipient.lastName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-border bg-muted/30 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground">To:</span>
                <span>{sampleRecipient?.email || 'recipient@example.com'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground">Subject:</span>
                <span className="font-medium">{subject}</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">{body}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-medium">Ready to Send</p>
          <p className="mt-1 text-muted-foreground">
            Each recipient will receive a personalized email with their specific information filled in.
            Make sure all the details look correct before sending.
          </p>
        </div>
      </div>
    </div>
  )
}
