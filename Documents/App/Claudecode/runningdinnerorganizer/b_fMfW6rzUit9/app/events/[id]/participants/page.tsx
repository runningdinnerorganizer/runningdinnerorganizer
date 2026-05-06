'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
  Search,
  Users,
  Loader2,
  Trash2,
  ArrowLeft,
  UtensilsCrossed,
  Copy,
  Check,
  Link2,
} from 'lucide-react'
import { format } from 'date-fns'

interface ApiParticipant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  dietaryRestrictions: string[]
  hasPartner: boolean
  partnerName: string | null
  partnerEmail: string | null
  partnerPhone: string | null
  canHostSolo: boolean
  teamId: string | null
  registeredAt: string
}

interface ApiEvent {
  id: string
  title: string
  publicTitle: string | null
  inviteToken: string | null
  status: string
}

const dietaryColors: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-700 border-green-300',
  vegan: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  no_pork: 'bg-rose-100 text-rose-700 border-rose-300',
  no_beef: 'bg-red-100 text-red-700 border-red-300',
  no_chicken: 'bg-orange-100 text-orange-700 border-orange-300',
  gluten_free: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  gluten_free_strict: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  lactose_free: 'bg-blue-100 text-blue-700 border-blue-300',
  nut_allergy: 'bg-amber-100 text-amber-700 border-amber-300',
  shellfish_allergy: 'bg-cyan-100 text-cyan-700 border-cyan-300',
}

export default function ParticipantsPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<ApiEvent | null>(null)
  const [participants, setParticipants] = useState<ApiParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, participantsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/participants`),
        ])
        if (!eventRes.ok) throw new Error('Failed to load event')
        if (!participantsRes.ok) throw new Error('Failed to load participants')
        const eventData = await eventRes.json()
        const participantsData = await participantsRes.json()
        setEvent(eventData.event)
        setParticipants(participantsData.participants ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/participants/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete participant')
      setParticipants(prev => prev.filter(p => p.id !== deleteId))
      setDeleteId(null)
    } catch {
      // keep dialog open on error
    } finally {
      setIsDeleting(false)
    }
  }

  const inviteLink = event?.inviteToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${event.inviteToken}`
    : null

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappMessage = inviteLink
    ? `You're invited to a Running Dinner! Register here: ${inviteLink}`
    : ''

  // Expand partner registrations into two display rows
  const expandedParticipants = participants.flatMap(p => {
    const rows = [p]
    if (p.hasPartner && p.partnerName) {
      rows.push({
        id: `${p.id}-partner`,
        firstName: p.partnerName.split(' ')[0] ?? p.partnerName,
        lastName: p.partnerName.split(' ').slice(1).join(' ') ?? '',
        email: p.partnerEmail ?? '—',
        phone: p.partnerPhone ?? '—',
        address: p.address,
        dietaryRestrictions: [],
        hasPartner: true,
        partnerName: `${p.firstName} ${p.lastName}`,
        partnerEmail: p.email,
        partnerPhone: p.phone,
        canHostSolo: p.canHostSolo,
        teamId: p.teamId,
        registeredAt: p.registeredAt,
        isPartnerRow: true,
      } as any)
    }
    return rows
  })

  const filteredParticipants = expandedParticipants.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4">
        <p className="font-medium text-red-700">{error}</p>
        <Link href="/events">
          <Button className="mt-4">Back to Events</Button>
        </Link>
      </div>
    )
  }

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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/events/${eventId}`}
          className="mb-6 inline-flex items-center gap-2 text-amber-700 transition-colors hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Event</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Participants</h1>
            <p className="text-amber-600">
              {expandedParticipants.length} participants ({participants.length} registration{participants.length !== 1 ? 's' : ''}) for {event?.publicTitle || event?.title}
            </p>
          </div>
        </div>

        {/* Invite Link */}
        {inviteLink && (
          <Card className="mb-8 overflow-hidden rounded-2xl border-2 border-green-200/50 bg-white/80">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Link2 className="h-5 w-5" />
                Registration Link
              </CardTitle>
              <CardDescription className="text-green-600">
                Share this link so more participants can register.
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

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-amber-200 bg-white/80"
          />
        </div>

        {/* Participants */}
        {participants.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/60 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <Users className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">No participants yet</h3>
            <p className="text-amber-600">Share the registration link to get people to sign up.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 text-left">
                  <th className="px-4 py-3 font-semibold text-amber-900">Name</th>
                  <th className="hidden px-4 py-3 font-semibold text-amber-900 md:table-cell">Email</th>
                  <th className="hidden px-4 py-3 font-semibold text-amber-900 lg:table-cell">Phone</th>
                  <th className="hidden px-4 py-3 font-semibold text-amber-900 xl:table-cell">Address</th>
                  <th className="px-4 py-3 font-semibold text-amber-900">Dietary</th>
                  <th className="hidden px-4 py-3 font-semibold text-amber-900 md:table-cell">Partner</th>
                  <th className="hidden px-4 py-3 font-semibold text-amber-900 lg:table-cell">Registered</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className={`transition-colors hover:bg-amber-50/40 ${(p as any).isPartnerRow ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-amber-900">
                      <div className="flex items-center gap-2">
                        {p.firstName} {p.lastName}
                        {(p as any).isPartnerRow && (
                          <Badge className="border border-amber-300 bg-amber-100 text-xs text-amber-700">Partner</Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-amber-700 md:table-cell">{p.email}</td>
                    <td className="hidden px-4 py-3 text-amber-700 lg:table-cell">{p.phone}</td>
                    <td className="hidden max-w-[180px] truncate px-4 py-3 text-amber-700 xl:table-cell">{p.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.dietaryRestrictions ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          (p.dietaryRestrictions ?? []).map((d) => (
                            <Badge
                              key={d}
                              className={`border text-xs ${dietaryColors[d] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}
                            >
                              {d.replace(/_/g, ' ')}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {p.hasPartner ? (
                        <span className="text-xs text-amber-700">
                          Yes{p.partnerName ? ` — ${p.partnerName}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {format(new Date(p.registeredAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {!(p as any).isPartnerRow && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredParticipants.length === 0 && searchQuery && (
              <div className="py-8 text-center text-amber-600">
                No participants match &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}

        {/* Total count */}
        {participants.length > 0 && (
          <p className="mt-4 text-right text-sm text-amber-600">
            Showing {filteredParticipants.length} of {participants.length} participants
          </p>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
