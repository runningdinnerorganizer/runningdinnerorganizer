'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormData } from '@/lib/types'
import { format, subDays } from 'date-fns'
import { Calendar, Info } from 'lucide-react'

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
