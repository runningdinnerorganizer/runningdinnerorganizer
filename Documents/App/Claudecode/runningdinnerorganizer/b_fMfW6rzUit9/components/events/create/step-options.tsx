'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormData } from '@/lib/types'
import { format, subDays } from 'date-fns'
import { Calendar, Info, User, Mail, Phone } from 'lucide-react'

interface StepOptionsProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export function StepOptions({ formData, updateFormData }: StepOptionsProps) {
  // Suggest registration deadline 5 days before event
  const suggestedDeadline = formData.date ? subDays(formData.date, 5) : null
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="registrationDeadline"
            type="date"
            className="pl-10"
            value={formData.registrationDeadline ? format(formData.registrationDeadline, 'yyyy-MM-dd') : ''}
            onChange={(e) => updateFormData({ 
              registrationDeadline: e.target.value ? new Date(e.target.value) : null 
            })}
            min={format(new Date(), 'yyyy-MM-dd')}
            max={formData.date ? format(formData.date, 'yyyy-MM-dd') : undefined}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          No new registrations after this date. This gives you time to assign teams.
        </p>
        {suggestedDeadline && !formData.registrationDeadline && (
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => updateFormData({ registrationDeadline: suggestedDeadline })}
          >
            Suggest: {format(suggestedDeadline, 'MMMM d, yyyy')} (5 days before event)
          </button>
        )}
      </div>
      
      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="font-medium">Contact Person</h3>
        <p className="text-sm text-muted-foreground">This will appear in emails so participants can reach you.</p>
        <div className="space-y-2">
          <Label htmlFor="contactName">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="contactName" className="pl-10" placeholder="e.g. Max Mustermann" value={formData.contactName} onChange={(e) => updateFormData({ contactName: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="contactEmail" type="email" className="pl-10" placeholder="e.g. max@example.com" value={formData.contactEmail} onChange={(e) => updateFormData({ contactEmail: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="contactPhone" type="tel" className="pl-10" placeholder="e.g. +49 151 12345678" value={formData.contactPhone} onChange={(e) => updateFormData({ contactPhone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <h4 className="font-medium">Team Formation Tips</h4>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>- Allow at least 3-5 days between registration deadline and event</li>
              <li>- This gives you time to form teams and send out assignments</li>
              <li>- Participants need time to prepare their course and plan their evening</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
