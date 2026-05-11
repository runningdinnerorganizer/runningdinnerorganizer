'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormData, Course } from '@/lib/types'
import { UtensilsCrossed, Soup, IceCream } from 'lucide-react'

interface StepScheduleProps {
  formData: EventFormData
  updateFormData: (updates: Partial<EventFormData>) => void
}

const courseConfig: Record<Course, { label: string; icon: React.ElementType; description: string }> = {
  appetizer: { 
    label: 'Appetizer', 
    icon: Soup,
    description: 'First course - participants meet their first group'
  },
  main: { 
    label: 'Main Course', 
    icon: UtensilsCrossed,
    description: 'Second course - new location, new group'
  },
  dessert: { 
    label: 'Dessert', 
    icon: IceCream,
    description: 'Final course - finish the evening with sweets'
  },
}

export function StepSchedule({ formData, updateFormData }: StepScheduleProps) {
  const updateCourseTime = (course: Course, value: string) => {
    updateFormData({
      schedule: {
        ...formData.schedule,
        [course]: { ...formData.schedule[course], start: value },
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Set the start time for each course. Defaults are 18:00, 19:00, and 20:00.
          Allow 15–30 minutes travel time between courses.
        </p>
      </div>

      {(Object.keys(courseConfig) as Course[]).map((course) => {
        const config = courseConfig[course]
        const Icon = config.icon

        return (
          <div key={course} className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{config.label}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${course}-start`}>Start Time</Label>
              <Input
                id={`${course}-start`}
                type="time"
                value={formData.schedule[course].start}
                onChange={(e) => updateCourseTime(course, e.target.value)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
