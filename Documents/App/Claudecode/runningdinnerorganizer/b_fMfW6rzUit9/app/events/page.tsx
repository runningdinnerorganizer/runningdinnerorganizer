'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Plus,
  Calendar,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  PartyPopper,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'

type EventStatus = 'draft' | 'registration_open' | 'registration_closed' | 'teams_assigned' | 'completed'

interface ApiEvent {
  id: string
  title: string
  publicTitle: string | null
  city: string
  date: string
  status: EventStatus
}

const statusConfig: Record<EventStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  registration_open: { label: 'Registration Open', color: 'bg-green-100 text-green-700 border-green-300', icon: Sparkles },
  registration_closed: { label: 'Registration Closed', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
  teams_assigned: { label: 'Teams Ready', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: PartyPopper },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: PartyPopper },
}

export default function EventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to load events')
        }
        const data = await res.json()
        setEvents(data.events ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-md">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-amber-900">Running Dinner</span>
          </Link>

          <Link href="/events/new">
            <Button className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md transition-all hover:scale-105 hover:shadow-lg">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-amber-700 transition-colors hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Page Title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
            <Calendar className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Your Events</h1>
            <p className="text-amber-600">Manage and view all your running dinner events</p>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/60 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
              <PartyPopper className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">No events yet!</h3>
            <p className="mb-6 text-amber-600">Time to create your first running dinner adventure!</p>
            <Link href="/events/new">
              <Button className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md transition-all hover:scale-105">
                <Sparkles className="h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const status = statusConfig[event.status] ?? statusConfig.draft
              const StatusIcon = status.icon
              const eventDate = new Date(event.date)
              const isPast = eventDate < new Date()
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="group block">
                  <Card className="h-full overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100">
                    <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-lg font-bold text-amber-900 transition-colors group-hover:text-orange-600">
                          {event.publicTitle || event.title}
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
            })}

            {/* Add New Event Card */}
            <Link href="/events/new" className="group">
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-white/40 p-6 transition-all hover:border-amber-400 hover:bg-white/60">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 transition-transform group-hover:scale-110">
                  <Plus className="h-8 w-8 text-amber-600" />
                </div>
                <span className="font-semibold text-amber-900">Create New Event</span>
                <span className="text-sm text-amber-600">Start another dinner adventure</span>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
