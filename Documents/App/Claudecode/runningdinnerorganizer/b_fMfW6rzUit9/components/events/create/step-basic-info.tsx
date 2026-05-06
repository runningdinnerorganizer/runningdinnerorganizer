'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EventFormData } from '@/lib/types'
import { format } from 'date-fns'

interface StepBasicInfoProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Amsterdam Spring Dinner 2024"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Choose a memorable name for your running dinner event.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Event Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
          onChange={(e) => updateFormData({ 
            date: e.target.value ? new Date(e.target.value) : null 
          })}
          min={format(new Date(), 'yyyy-MM-dd')}
        />
        <p className="text-sm text-muted-foreground">
          The date when your running dinner will take place.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your event, what makes it special, any theme or dress code..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          This will be shown to participants when they register.
        </p>
      </div>
    </div>
  )
}
