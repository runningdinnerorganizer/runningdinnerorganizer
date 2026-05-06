'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { Event, Participant } from '@/lib/types'
import { Calendar, Users, CheckCircle2, Clock } from 'lucide-react'

interface StatsOverviewProps {
  events: Event[]
  participants: Participant[]
}

export function StatsOverview({ events, participants }: StatsOverviewProps) {
  const totalEvents = events.length
  const activeEvents = events.filter(e => e.status === 'registration_open' || e.status === 'teams_assigned').length
  const totalParticipants = participants.length
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length
  
  const stats = [
    {
      label: 'Total Events',
      value: totalEvents,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Events',
      value: activeEvents,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: 'Total Participants',
      value: totalParticipants,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ]
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
