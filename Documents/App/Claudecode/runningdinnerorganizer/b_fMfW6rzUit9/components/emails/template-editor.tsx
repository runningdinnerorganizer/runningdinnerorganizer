'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Info } from 'lucide-react'

interface TemplateEditorProps {
  subject: string
  body: string
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
}

const availableVariables = [
  { name: '{{firstName}}', description: 'Recipient first name' },
  { name: '{{eventTitle}}', description: 'Event name' },
  { name: '{{date}}', description: 'Event date' },
  { name: '{{city}}', description: 'Event city' },
  { name: '{{appetizerTime}}', description: 'Appetizer start time' },
  { name: '{{mainTime}}', description: 'Main course start time' },
  { name: '{{dessertTime}}', description: 'Dessert start time' },
  { name: '{{registrationDeadline}}', description: 'Registration deadline' },
  { name: '{{partnerName}}', description: 'Team partner name' },
  { name: '{{partnerEmail}}', description: 'Team partner email' },
  { name: '{{partnerPhone}}', description: 'Team partner phone' },
  { name: '{{hostingCourse}}', description: 'Course they host' },
  { name: '{{hostingTime}}', description: 'Hosting time' },
  { name: '{{hostingAddress}}', description: 'Their hosting address' },
  { name: '{{dietaryNotes}}', description: 'Guests dietary restrictions' },
  { name: '{{appetizerHostNames}}', description: 'Appetizer host names' },
  { name: '{{appetizerAddress}}', description: 'Appetizer address' },
  { name: '{{appetizerMapLink}}', description: 'Appetizer Google Maps link' },
  { name: '{{appetizerHostPhone}}', description: 'Appetizer host phone 1' },
  { name: '{{appetizerHostPhone2}}', description: 'Appetizer host phone 2' },
  { name: '{{mainHostNames}}', description: 'Main course host names' },
  { name: '{{mainAddress}}', description: 'Main course address' },
  { name: '{{mainMapLink}}', description: 'Main course Google Maps link' },
  { name: '{{mainHostPhone}}', description: 'Main course host phone 1' },
  { name: '{{mainHostPhone2}}', description: 'Main course host phone 2' },
  { name: '{{dessertHostNames}}', description: 'Dessert host names' },
  { name: '{{dessertAddress}}', description: 'Dessert address' },
  { name: '{{dessertMapLink}}', description: 'Dessert Google Maps link' },
  { name: '{{dessertHostPhone}}', description: 'Dessert host phone 1' },
  { name: '{{dessertHostPhone2}}', description: 'Dessert host phone 2' },
  { name: '{{contactName}}', description: 'Organizer name' },
  { name: '{{contactEmail}}', description: 'Organizer email' },
  { name: '{{contactPhone}}', description: 'Organizer phone' },
]

export function TemplateEditor({ subject, body, onSubjectChange, onBodyChange }: TemplateEditorProps) {
  const insertVariable = (variable: string) => {
    onBodyChange(body + variable)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Enter email subject..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Email Body</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Enter email content..."
          className="font-mono text-sm min-h-[500px] resize-y"
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Available Variables</span>
          <span className="text-xs text-muted-foreground">(click to insert)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableVariables.map((variable) => (
            <button
              key={variable.name}
              onClick={() => insertVariable(variable.name)}
              title={variable.description}
              className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors"
            >
              {variable.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
