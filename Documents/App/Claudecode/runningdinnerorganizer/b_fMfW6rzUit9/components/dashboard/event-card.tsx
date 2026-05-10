'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Event, EventStatus } from '@/lib/types'
import { Calendar, MapPin, Users, ArrowRight, Sparkles, PartyPopper, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface EventCardProps {
  event: Event
  participantCount: number
}

const statusConfig: Record<EventStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  registration_open: { label: 'Registration Open', color: 'bg-green-100 text-green-700 border-green-300', icon: Sparkles },
  registration_closed: { label: 'Registration Closed', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
  teams_assigned: { label: 'Teams Ready', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: PartyPopper },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: PartyPopper },
}

export function EventCard({ event, participantCount }: EventCardProps) {
  const status = statusConfig[event.status]
  const StatusIcon = status.icon
  const eventDate = new Date(event.date)
  const isPast = eventDate < new Date()
  const progressPercent = Math.min((participantCount / event.maxParticipants) * 100, 100)
  
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="h-full overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100">
        {/* Colorful top bar */}
        <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-bold text-amber-900 transition-colors group-hover:text-orange-600">
              {event.name}
            </h3>
            <Badge className={`flex items-center gap-1 border ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-3 pb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <span className={isPast ? 'text-muted-foreground' : 'font-medium text-amber-800'}>
              {format(eventDate, 'EEE, MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-amber-700">{event.city}</span>
          </div>
          
          {/* Participant progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                  <Users className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-amber-700">Participants</span>
              </div>
              <span className="font-semibold text-amber-900">
                {participantCount} / {event.maxParticipants}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Show how many more needed for a valid round (multiple of 6) */}
            {(() => {
              const missing = participantCount % 6 === 0 ? 0 : 6 - (participantCount % 6)
              if (missing === 0) return (
                <p className="text-xs font-medium text-emerald-600">✓ Ready to generate teams</p>
              )
              return (
                <p className="text-xs text-orange-600">
                  {missing} more needed for next valid round
                </p>
              )
            })()}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            className="w-full justify-between rounded-xl bg-amber-50 text-amber-700 transition-all group-hover:bg-amber-100 group-hover:text-amber-900"
          >
            <span>View Details</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
