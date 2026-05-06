'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { ArrowRight, MapPin, Users, Sparkles, PartyPopper, Clock } from 'lucide-react'

type EventStatus = 'draft' | 'registration_open' | 'registration_closed' | 'teams_assigned' | 'completed'

interface ApiEvent {
  id: string
  title: string
  publicTitle: string | null
  city: string
  date: string
  status: EventStatus
  registrationDeadline: string
  inviteToken: string | null
}

const statusConfig: Record<EventStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  registration_open: { label: 'Registration Open', color: 'bg-green-100 text-green-700 border-green-300', icon: Sparkles },
  registration_closed: { label: 'Registration Closed', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
  teams_assigned: { label: 'Teams Ready', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: PartyPopper },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: PartyPopper },
}

export default function DashboardPage() {
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Page Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Manage your running dinner events.</p>
              </div>
              <Link href="/events/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Button>
              </Link>
            </div>

            {/* Events List */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">Your Events</h2>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
                  <p className="font-medium text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setError(null); setLoading(true); fetch('/api/events').then(r => r.json()).then(d => { setEvents(d.events ?? []); setLoading(false) }).catch(() => setLoading(false)) }}
                  >
                    Try again
                  </Button>
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No events yet</h3>
                  <p className="mb-6 text-muted-foreground">
                    Create your first running dinner event to get started.
                  </p>
                  <Link href="/events/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
