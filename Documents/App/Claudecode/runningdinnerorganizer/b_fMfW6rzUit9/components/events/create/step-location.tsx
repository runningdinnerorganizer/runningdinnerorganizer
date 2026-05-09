'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormData } from '@/lib/types'
import { MapPin } from 'lucide-react'

interface StepLocationProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

export function StepLocation({ formData, updateFormData }: StepLocationProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="city">City *</Label>
        <Input
          id="city"
          placeholder="e.g., Amsterdam"
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          The city where the running dinner will take place.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="centerAddress">Center Point Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="centerAddress"
            className="pl-10"
            placeholder="e.g., Dam Square, Amsterdam"
            value={formData.centerAddress}
            onChange={(e) => updateFormData({ centerAddress: e.target.value })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          The central point of your event area. This helps optimize team routes.
        </p>
      </div>
      
    </div>
  )
}
