'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormData } from '@/lib/types'
import { MapPin, Info } from 'lucide-react'

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
      
      {/* Map Preview Placeholder */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 font-medium">Google Maps Preview</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Add a Google Maps API key to enable address autocomplete and map preview.
          </p>
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-left text-xs">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Demo Mode</p>
              <p className="text-muted-foreground">
                In the full version, you would see an interactive map here with address autocomplete powered by Google Maps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
