'use client'

import { cn } from '@/lib/utils'

export interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
}

interface TemplateSelectorProps {
  templates: EmailTemplate[]
  selectedTemplate: EmailTemplate | null
  onSelect: (template: EmailTemplate) => void
}

export function TemplateSelector({ templates, selectedTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            selectedTemplate?.id === template.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
          )}
        >
          {template.name}
        </button>
      ))}
    </div>
  )
}
