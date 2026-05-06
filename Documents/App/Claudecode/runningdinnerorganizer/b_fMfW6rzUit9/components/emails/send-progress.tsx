'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Mail, ArrowRight } from 'lucide-react'

interface SendProgressProps {
  isSending: boolean
  sendComplete: boolean
  recipientCount: number
  onReset: () => void
}

export function SendProgress({ isSending, sendComplete, recipientCount, onReset }: SendProgressProps) {
  if (isSending) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <CardTitle>Sending Emails...</CardTitle>
          <CardDescription>
            Please wait while we send {recipientCount} emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: '60%' }} />
            </div>
            <p className="text-sm text-muted-foreground">
              This may take a few moments...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (sendComplete) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle>Emails Sent Successfully!</CardTitle>
          <CardDescription>
            {recipientCount} emails have been delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{recipientCount} participants notified</span>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
            <p className="text-sm text-muted-foreground">
              <strong>Demo Mode:</strong> In production, these emails would be sent via Resend. 
              No actual emails were sent in this demo.
            </p>
          </div>
          
          <Button onClick={onReset} className="w-full">
            Send Another Email
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return null
}
