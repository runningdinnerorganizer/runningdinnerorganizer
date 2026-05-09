'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  MoreVertical,
  Play,
  Pause,
  CheckCircle2,
  Link2,
  Copy,
  Trash2,
  ExternalLink,
  UtensilsCrossed,
  ArrowLeft,
  Mail,
  Sparkles,
  ChefHat,
  PartyPopper,
  Loader2,
  Check,
  Pencil,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

type EventStatus = 'draft' | 'registration_open' | 'registration_closed' | 'teams_assigned' | 'completed'

interface ApiEvent {
  id: string
  title: string
  publicTitle: string | null
  publicDescription: string | null
  city: string
  date: string
  status: EventStatus
  registrationDeadline: string
  appetizerTime: string
  mainTime: string
  dessertTime: string
  contactName: string | null
  contactEmail: string | null
  inviteToken: string | null
  registrationActive: boolean
}

function fmt(time: string) {
  return time?.slice(0, 5) ?? time
}

const statusConfig: Record<EventStatus, { label: string; color: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'Event is not yet visible to participants', icon: Clock },
  registration_open: { label: 'Registration Open', color: 'bg-green-100 text-green-700 border-green-300', description: 'Participants can register for this event', icon: Sparkles },
  registration_closed: { label: 'Registration Closed', color: 'bg-amber-100 text-amber-700 border-amber-300', description: 'No new registrations accepted', icon: Clock },
  teams_assigned: { label: 'Teams Ready', color: 'bg-blue-100 text-blue-700 border-blue-300', description: 'Teams have been formed and assigned', icon: PartyPopper },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-300', description: 'Event has finished', icon: CheckCircle2 },
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<ApiEvent | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineValue, setDeadlineValue] = useState('')
  const [isSavingDeadline, setIsSavingDeadline] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to load event')
        }
        const data = await res.json()
        setEvent(data.event)
        setParticipantCount(data.participantCount ?? 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
            <UtensilsCrossed className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900">Event not found</h1>
          <p className="mt-2 text-amber-600">{error || 'This event does not exist or has been deleted.'}</p>
          <Link href="/events">
            <Button className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500">Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const deadlinePassed = new Date(event.registrationDeadline) < new Date()
  const effectiveStatus = (event.status === 'registration_open' && deadlinePassed)
    ? 'registration_closed'
    : event.status
  const status = statusConfig[effectiveStatus] ?? statusConfig.draft
  const StatusIcon = status.icon

  const inviteLink = event.inviteToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${event.inviteToken}`
    : null

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStatusChange = async (newStatus: EventStatus) => {
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      const data = await res.json()
      setEvent(data.event)
    } catch {
      // silently fail — user can retry via dropdown
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const saveDeadline = async () => {
    if (!deadlineValue) return
    setIsSavingDeadline(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationDeadline: deadlineValue }),
      })
      if (!res.ok) throw new Error('Failed to update deadline')
      const data = await res.json()
      setEvent(data.event)
      setEditingDeadline(false)
    } catch {
      // silently fail
    } finally {
      setIsSavingDeadline(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      router.push('/events')
    } catch {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const daysUntilEvent = Math.max(
    0,
    Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  const whatsappMessage = inviteLink
    ? `You're invited to a Running Dinner! Register here: ${inviteLink}`
    : ''

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

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl border-amber-200 gap-2">
                  <Users className="h-4 w-4" />
                  <span>Manage</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/events/${eventId}/participants`} className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/events/${eventId}/teams`} className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/events/${eventId}/emails`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-amber-200" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {event.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('registration_open')}>
                  <Play className="mr-2 h-4 w-4" />
                  Open Registration
                </DropdownMenuItem>
              )}
              {event.status === 'registration_open' && (
                <DropdownMenuItem onClick={() => handleStatusChange('registration_closed')}>
                  <Pause className="mr-2 h-4 w-4" />
                  Close Registration
                </DropdownMenuItem>
              )}
              {event.status === 'registration_closed' && (
                <DropdownMenuItem onClick={() => handleStatusChange('registration_open')}>
                  <Play className="mr-2 h-4 w-4" />
                  Re-open Registration
                </DropdownMenuItem>
              )}
              {event.status === 'teams_assigned' && (
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 text-amber-700 transition-colors hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events</span>
        </Link>

        {/* Event Header */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-amber-900">{event.publicTitle || event.title}</h1>
            <Badge className={`flex items-center gap-1 border ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <p className="text-amber-600">{status.description}</p>
        </div>

        {/* Quick Action Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/events/${eventId}/participants`} className="group">
            <Card className="h-full overflow-hidden rounded-2xl border-2 border-blue-200/50 bg-white/80 transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg transition-transform group-hover:scale-110">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{participantCount}</p>
                <p className="text-sm text-blue-700">Participants</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/events/${eventId}/teams`} className="group">
            <Card className="h-full overflow-hidden rounded-2xl border-2 border-emerald-200/50 bg-white/80 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg transition-transform group-hover:scale-110">
                  <ChefHat className="h-7 w-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">Teams</p>
                <p className="text-sm text-emerald-700">Manage teams</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/events/${eventId}/emails`} className="group">
            <Card className="h-full overflow-hidden rounded-2xl border-2 border-purple-200/50 bg-white/80 transition-all duration-300 hover:scale-[1.02] hover:border-purple-300 hover:shadow-xl">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 shadow-lg transition-transform group-hover:scale-110">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-purple-600">Emails</p>
                <p className="text-sm text-purple-700">Send updates</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg">
                <PartyPopper className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold text-amber-600">{daysUntilEvent}</p>
              <p className="text-sm text-amber-700">Days to go!</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite Link */}
        {inviteLink && (event.status === 'registration_open' || event.status === 'draft') && (
          <Card className="mb-8 overflow-hidden rounded-2xl border-2 border-green-200/50 bg-white/80">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Link2 className="h-5 w-5" />
                Registration Link
              </CardTitle>
              <CardDescription className="text-green-600">
                Share this link with participants to let them register!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
                  {inviteLink}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteLink}
                  className="shrink-0 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Link href={inviteLink} target="_blank">
                  <Button variant="outline" size="icon" className="rounded-xl border-green-200 text-green-700 hover:bg-green-50">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-600"
              >
                Share via WhatsApp
              </a>
            </CardContent>
          </Card>
        )}

        {/* Event Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />
            <CardHeader>
              <CardTitle className="text-amber-900">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200">
                  <Calendar className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Date</p>
                  <p className="text-sm text-amber-700">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-200">
                  <MapPin className="h-5 w-5 text-orange-700" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">Location</p>
                  <p className="text-sm text-orange-700">{event.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200">
                  <Clock className="h-5 w-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-purple-900">Registration Deadline</p>
                  {editingDeadline ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="date"
                        value={deadlineValue}
                        onChange={(e) => setDeadlineValue(e.target.value)}
                        className="h-7 w-40 text-sm"
                      />
                      <button onClick={saveDeadline} disabled={isSavingDeadline} className="text-green-600 hover:text-green-800">
                        {isSavingDeadline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setEditingDeadline(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-purple-700">{format(new Date(event.registrationDeadline), 'MMMM d, yyyy')}</p>
                      <button onClick={() => { setDeadlineValue(event.registrationDeadline.slice(0, 10)); setEditingDeadline(true) }} className="text-purple-400 hover:text-purple-700">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(event.contactName || event.contactEmail) && (
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200">
                    <Mail className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Contact</p>
                    {event.contactName && <p className="text-sm text-blue-700">{event.contactName}</p>}
                    {event.contactEmail && <p className="text-sm text-blue-700">{event.contactEmail}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-yellow-400" />
            <CardHeader>
              <CardTitle className="text-amber-900">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-200">
                    <span className="text-lg">🥗</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Appetizer</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-800">{fmt(event.appetizerTime)}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-200">
                    <span className="text-lg">🍝</span>
                  </div>
                  <div>
                    <p className="font-medium text-orange-900">Main Course</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-orange-800">{fmt(event.mainTime)}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-pink-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-200">
                    <span className="text-lg">🍰</span>
                  </div>
                  <div>
                    <p className="font-medium text-pink-900">Dessert</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-pink-800">{fmt(event.dessertTime)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Checklist */}
        <Card className="mt-6 overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
          <CardHeader>
            <CardTitle className="text-amber-900">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Event created', done: true },
              { label: 'Registration open', done: event.status !== 'draft' },
              { label: 'Teams assigned', done: event.status === 'teams_assigned' || event.status === 'completed' },
              { label: 'Event completed', done: event.status === 'completed' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.done ? 'bg-green-500' : 'bg-amber-100'}`}>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-amber-300" />
                  )}
                </div>
                <span className={item.done ? 'font-medium text-amber-900' : 'text-amber-500'}>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {event.publicDescription && (
          <Card className="mt-6 overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
            <CardHeader>
              <CardTitle className="text-amber-900">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700">{event.publicDescription}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event.publicTitle || event.title}&quot;? This action cannot be undone.
              All participants, teams, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
