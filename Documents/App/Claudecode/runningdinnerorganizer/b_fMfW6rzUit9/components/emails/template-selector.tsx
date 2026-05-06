'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, Mail, Users2, Bell, MapPin } from 'lucide-react'

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

const templateConfig: Record<string, { icon: React.ElementType; description: string; color: string }> = {
  welcome: {
    icon: Mail,
    description: 'Welcome new participants',
    color: 'text-blue-600',
  },
  team_info: {
    icon: Users2,
    description: 'Share team and schedule info',
    color: 'text-emerald-600',
  },
  route: {
    icon: MapPin,
    description: 'Send the full dinner route',
    color: 'text-violet-600',
  },
  reminder: {
    icon: Bell,
    description: 'Day-before reminder',
    color: 'text-amber-600',
  },
}

const fallbackConfig = { icon: Mail, description: '', color: 'text-muted-foreground' }

export function TemplateSelector({ templates, selectedTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {templates.map((template) => {
        const config = templateConfig[template.type] ?? fallbackConfig
        const Icon = config.icon
        const isSelected = selectedTemplate?.id === template.id

        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
              isSelected && "border-primary ring-1 ring-primary"
            )}
            onClick={() => onSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs">{config.description}</CardDescription>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                Subject: {template.subject}
              </p>
              <Badge variant="outline" className="text-xs">
                {template.type.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
