'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useMockData } from '@/lib/mock-context'
import type { AlgorithmConfig as AlgorithmConfigType, Course, Team, CourseAssignment } from '@/lib/types'
import { Loader2, Sparkles, Info } from 'lucide-react'

interface AlgorithmConfigProps {
  eventId: string
  participantCount: number
  canCreateTeams: boolean
}

export function AlgorithmConfig({ eventId, participantCount, canCreateTeams }: AlgorithmConfigProps) {
  const router = useRouter()
  const { 
    getEventParticipants, 
    createTeams, 
    createAssignments, 
    updateParticipant,
    updateEvent 
  } = useMockData()
  
  const [config, setConfig] = useState<AlgorithmConfigType>({
    optimizeDistance: true,
    respectDietaryRestrictions: true,
    maxDistanceKm: 5,
  })
  const [isRunning, setIsRunning] = useState(false)
  
  const runAlgorithm = async () => {
    setIsRunning(true)
    
    // Simulate algorithm processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const participants = getEventParticipants(eventId)
    const courses: Course[] = ['appetizer', 'main', 'dessert']
    
    // Simple algorithm: pair participants and assign courses
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const teamsData: Omit<Team, 'id'>[] = []
    
    for (let i = 0; i < shuffled.length; i += 2) {
      const member1 = shuffled[i]
      const member2 = shuffled[i + 1]
      if (!member2) break
      
      const courseIndex = Math.floor(teamsData.length % 3)
      const course = courses[courseIndex]
      
      teamsData.push({
        eventId,
        member1Id: member1.id,
        member2Id: member2.id,
        hostingCourse: course,
        address: member1.address,
        location: member1.location,
      })
    }
    
    const createdTeams = createTeams(eventId, teamsData)
    
    // Update participants with their team assignments
    createdTeams.forEach((team) => {
      updateParticipant(team.member1Id, { teamId: team.id, hostingCourse: team.hostingCourse })
      updateParticipant(team.member2Id, { teamId: team.id, hostingCourse: team.hostingCourse })
    })
    
    // Create course assignments (groups of 3 teams that meet at each course)
    const teamsByCourse = {
      appetizer: createdTeams.filter(t => t.hostingCourse === 'appetizer'),
      main: createdTeams.filter(t => t.hostingCourse === 'main'),
      dessert: createdTeams.filter(t => t.hostingCourse === 'dessert'),
    }
    
    const assignmentsData: Omit<CourseAssignment, 'id'>[] = []
    
    // Simple assignment: each team hosts their course with 2 guest teams
    const allTeams = [...createdTeams]
    const numGroups = Math.floor(createdTeams.length / 3)
    
    for (let g = 0; g < numGroups; g++) {
      const groupTeams = allTeams.slice(g * 3, g * 3 + 3)
      if (groupTeams.length < 3) break
      
      for (const course of courses) {
        const hostTeam = groupTeams.find(t => t.hostingCourse === course)
        if (hostTeam) {
          const guestTeams = groupTeams.filter(t => t.id !== hostTeam.id)
          assignmentsData.push({
            eventId,
            course,
            hostTeamId: hostTeam.id,
            guestTeam1Id: guestTeams[0]?.id || '',
            guestTeam2Id: guestTeams[1]?.id || '',
          })
        }
      }
    }
    
    createAssignments(eventId, assignmentsData)
    updateEvent(eventId, { status: 'teams_assigned' })
    
    setIsRunning(false)
    router.refresh()
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">How the algorithm works</p>
            <p className="mt-1 text-muted-foreground">
              The algorithm will pair participants into teams of 2, assign each team a course to host, 
              and then create groups of 3 teams (6 people) that will rotate together through the evening.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="optimize-distance">Optimize for Distance</Label>
            <p className="text-sm text-muted-foreground">
              Minimize travel distance between courses
            </p>
          </div>
          <Switch
            id="optimize-distance"
            checked={config.optimizeDistance}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, optimizeDistance: checked }))}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="respect-dietary">Respect Dietary Restrictions</Label>
            <p className="text-sm text-muted-foreground">
              Group participants with similar dietary needs
            </p>
          </div>
          <Switch
            id="respect-dietary"
            checked={config.respectDietaryRestrictions}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, respectDietaryRestrictions: checked }))}
          />
        </div>
        
        {config.optimizeDistance && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Maximum Distance: {config.maxDistanceKm} km</Label>
            </div>
            <Slider
              value={[config.maxDistanceKm]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, maxDistanceKm: value }))}
              min={1}
              max={15}
              step={1}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              Maximum allowed distance between consecutive courses
            </p>
          </div>
        )}
      </div>
      
      <div className="border-t border-border pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Ready to create teams</p>
            <p className="text-sm text-muted-foreground">
              {participantCount} participants will be assigned to {Math.floor(participantCount / 2)} teams
            </p>
          </div>
          <Button 
            onClick={runAlgorithm} 
            disabled={!canCreateTeams || isRunning}
            className="min-w-[160px]"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Teams...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Algorithm
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
