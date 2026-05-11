'use client'

import type { EventFormData } from '@/lib/types'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, CheckCircle2 } from 'lucide-react'

interface StepReviewProps {
  formData: EventFormData
}

export function StepReview({ formData }: StepReviewProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Almost there! Review your event details.</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{formData.name || 'Untitled Event'}</h3>
        
        {formData.description && (
          <p className="text-muted-foreground">{formData.description}</p>
        )}
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Event Date</p>
              <p className="text-sm text-muted-foreground">
                {formData.date ? format(formData.date, 'EEEE, MMMM d, yyyy') : 'Not set'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {formData.city || 'Not set'}
                {formData.centerAddress && ` - ${formData.centerAddress}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Registration Deadline</p>
              <p className="text-sm text-muted-foreground">
                {formData.registrationDeadline 
                  ? format(formData.registrationDeadline, 'MMMM d, yyyy') 
                  : 'Not set'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <p className="font-medium">Schedule</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Appetizer</span>
              <span>{formatTime(formData.schedule.appetizer.start)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Main Course</span>
              <span>{formatTime(formData.schedule.main.start)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dessert</span>
              <span>{formatTime(formData.schedule.dessert.start)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
