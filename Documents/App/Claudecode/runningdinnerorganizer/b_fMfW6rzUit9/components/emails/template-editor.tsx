'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

interface TemplateEditorProps {
  subject: string
  body: string
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
}

const availableVariables = [
  { name: '{{participant_name}}', description: 'Recipient name' },
  { name: '{{event_name}}', description: 'Event name' },
  { name: '{{event_date}}', description: 'Event date' },
  { name: '{{event_city}}', description: 'Event city' },
  { name: '{{team_partner_name}}', description: 'Team partner name' },
  { name: '{{hosting_course}}', description: 'Course they host' },
  { name: '{{hosting_time}}', description: 'Hosting time' },
  { name: '{{appetizer_address}}', description: 'Appetizer location' },
  { name: '{{appetizer_time}}', description: 'Appetizer time' },
  { name: '{{main_address}}', description: 'Main course location' },
  { name: '{{main_time}}', description: 'Main course time' },
  { name: '{{dessert_address}}', description: 'Dessert location' },
  { name: '{{dessert_time}}', description: 'Dessert time' },
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
      
      {/* Variable Reference */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Available Variables</span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Click a variable to insert it at the end of the email body. Variables will be replaced with actual data when sending.
        </p>
        <div className="flex flex-wrap gap-2">
          {availableVariables.map((variable) => (
            <Button
              key={variable.name}
              variant="outline"
              size="sm"
              onClick={() => insertVariable(variable.name)}
              className="h-auto px-2 py-1 text-xs"
              title={variable.description}
            >
              <code>{variable.name}</code>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Preview hint */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
        <Badge variant="outline" className="text-primary">Tip</Badge>
        <span className="text-sm text-muted-foreground">
          You can preview how the email will look in the next step.
        </span>
      </div>
    </div>
  )
}
