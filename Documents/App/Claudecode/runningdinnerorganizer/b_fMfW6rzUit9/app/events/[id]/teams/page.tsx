'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Loader2,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  Trash2,
  AlertTriangle,
  Users2,
  ChefHat,
} from 'lucide-react'
import dynamic from 'next/dynamic'
const TeamMap = dynamic(() => import('@/components/TeamMap'), { ssr: false })

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ApiTeam {
  id: string
  hostingCourse: 'appetizer' | 'main' | 'dessert'
  hostAddress: string
  hostLat?: number | null
  hostLng?: number | null
  member1: TeamMember
  member2: TeamMember
}

interface ApiAssignment {
  id: string
  course: 'appetizer' | 'main' | 'dessert'
  hostTeamId: string
  guestTeam1Id: string
  guestTeam2Id: string
}

const courseConfig: Record<string, { label: string; emoji: string; bg: string; border: string; text: string }> = {
  appetizer: { label: 'Appetizer', emoji: '🥗', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  main: { label: 'Main Course', emoji: '🍝', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  dessert: { label: 'Dessert', emoji: '🍰', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
}

export default function TeamsPage() {
  const params = useParams()
  const eventId = params.id as string

  const [teams, setTeams] = useState<ApiTeam[]>([])
  const [assignments, setAssignments] = useState<ApiAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  async function fetchTeams() {
    try {
      const res = await fetch(`/api/events/${eventId}/teams`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load teams')
      }
      const data = await res.json()
      setTeams(data.teams ?? [])
      setAssignments(data.assignments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeams() }, [eventId])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/teams/generate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate teams')
      setTeams(data.teams ?? [])
      setAssignments(data.assignments ?? [])
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate teams')
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/teams`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to reset teams')
      setTeams([])
      setAssignments([])
      setShowResetDialog(false)
    } catch {
      // keep dialog open
    } finally {
      setResetting(false)
    }
  }

  const handlePinMove = async (teamId: string, lat: number, lng: number) => {
    // Optimistic update
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, hostLat: lat, hostLng: lng } : t))
    try {
      await fetch(`/api/events/${eventId}/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      })
    } catch {
      // silent — pin position is a best-effort improvement
    }
  }

  const teamById = (id: string) => teams.find(t => t.id === id)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4 text-center">
        <p className="font-medium text-red-700">{error}</p>
        <Link href={`/events/${eventId}`}><Button className="mt-4">Back to Event</Button></Link>
      </div>
    )
  }

  const hasTeams = teams.length > 0
  const courseOrder: Array<'appetizer' | 'main' | 'dessert'> = ['appetizer', 'main', 'dessert']

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

          {hasTeams && (
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              className="gap-2 border-red-200 text-destructive hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Reset Teams
            </Button>
          )}
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
            <h1 className="text-3xl font-bold text-amber-900">Team Assignment</h1>
            <p className="text-amber-600">
              {hasTeams
                ? `${teams.length} teams created`
                : 'Generate teams for your participants'}
            </p>
          </div>
        </div>

        {!hasTeams ? (
          /* No teams yet — show Generate button */
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                <ChefHat className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-amber-900">No teams yet</h2>
              <p className="mb-8 max-w-md text-amber-600">
                Ready to assign participants to teams? The algorithm will balance dietary restrictions
                and hosting assignments across all three courses.
              </p>

              {generateError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {generateError}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating teams...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Teams
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Teams exist — show by course */
          <div className="space-y-10">
            {courseOrder.map((course) => {
              const config = courseConfig[course]
              const courseTeams = teams.filter(t => t.hostingCourse === course)
              if (courseTeams.length === 0) return null

              return (
                <div key={course}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-3xl">{config.emoji}</span>
                    <h2 className="text-xl font-bold text-amber-900">{config.label}</h2>
                    <Badge className={`border ${config.bg} ${config.border} ${config.text}`}>
                      {courseTeams.length} team{courseTeams.length !== 1 ? 's' : ''} hosting
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courseTeams.map((team) => {
                      // Find this team's course assignment as host
                      const hostAssignment = assignments.find(a => a.hostTeamId === team.id)
                      // Find assignments where this team is a guest
                      const guestAssignments = assignments.filter(
                        a => a.guestTeam1Id === team.id || a.guestTeam2Id === team.id
                      )

                      return (
                        <Card
                          key={team.id}
                          className={`overflow-hidden rounded-2xl border-2 ${config.border} bg-white/80`}
                        >
                          <div className={`h-1.5 bg-gradient-to-r ${course === 'appetizer' ? 'from-green-400 to-emerald-400' : course === 'main' ? 'from-orange-400 to-amber-400' : 'from-pink-400 to-rose-400'}`} />
                          <CardHeader className="pb-2">
                            <CardTitle className={`flex items-center gap-2 text-base ${config.text}`}>
                              <Users2 className="h-4 w-4" />
                              Team
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Members */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members</p>
                              <p className="font-medium text-amber-900">
                                {team.member1.firstName} {team.member1.lastName}
                              </p>
                              <p className="font-medium text-amber-900">
                                {team.member2.firstName} {team.member2.lastName}
                              </p>
                            </div>

                            {/* Hosting */}
                            <div className="rounded-lg bg-amber-50 p-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">You host</p>
                              <p className="font-semibold text-amber-900">{config.label}</p>
                              {team.hostAddress && (
                                <p className="mt-0.5 text-xs text-amber-700">{team.hostAddress}</p>
                              )}
                            </div>

                            {/* Visiting */}
                            {guestAssignments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You visit</p>
                                {guestAssignments.map((a) => {
                                  const hostTeam = teamById(a.hostTeamId)
                                  const c = courseConfig[a.course]
                                  return (
                                    <div key={a.id} className={`rounded-lg border ${c.border} ${c.bg} p-2`}>
                                      <p className={`text-xs font-medium ${c.text}`}>{c.emoji} {c.label}</p>
                                      {hostTeam?.hostAddress && (
                                        <p className="text-xs text-muted-foreground">{hostTeam.hostAddress}</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl border-2 border-amber-200/50 bg-white/80">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teams.length}</p>
                    <p className="text-sm text-muted-foreground">Teams</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-amber-200/50 bg-white/80">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teams.length * 2}</p>
                    <p className="text-sm text-muted-foreground">Participants</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-amber-200/50 bg-white/80">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                    <ChefHat className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                    <p className="text-sm text-muted-foreground">Course Assignments</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            {teams.some(t => t.hostLat != null && t.hostLng != null) && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-amber-900">Host Locations</h2>
                <p className="mb-3 text-sm text-amber-600">Drag a pin to adjust its position and save it to the database.</p>
                <TeamMap teams={teams} onPinMove={handlePinMove} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Teams</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all teams? This will remove all team assignments and
              course assignments. You can generate new teams afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
