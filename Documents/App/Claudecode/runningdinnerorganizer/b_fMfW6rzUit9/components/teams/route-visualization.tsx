'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Team, Participant, Event, Course } from '@/lib/types'
import { MapPin, ArrowRight, Info, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface RouteVisualizationProps {
  teams: Team[]
  participants: Participant[]
  event: Event
}

const courseColors: Record<Course, string> = {
  appetizer: 'bg-blue-500',
  main: 'bg-emerald-500',
  dessert: 'bg-amber-500',
}

export function RouteVisualization({ teams, participants, event }: RouteVisualizationProps) {
  const getParticipant = (id: string) => participants.find(p => p.id === id)
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }
  
  // Create groups of 3 teams that rotate together
  const numGroups = Math.floor(teams.length / 3)
  const groups = []
  
  for (let g = 0; g < numGroups; g++) {
    const groupTeams = teams.slice(g * 3, g * 3 + 3)
    if (groupTeams.length === 3) {
      groups.push({
        id: g + 1,
        teams: groupTeams,
        appetizer: groupTeams.find(t => t.hostingCourse === 'appetizer'),
        main: groupTeams.find(t => t.hostingCourse === 'main'),
        dessert: groupTeams.find(t => t.hostingCourse === 'dessert'),
      })
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Map
          </CardTitle>
          <CardDescription>
            Visual representation of all dinner routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">Google Maps Integration</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Add a Google Maps API key to visualize all routes on an interactive map with 
                markers for each location and colored paths between courses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Route Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <span className="text-sm font-medium">Course Legend:</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm">Appetizer ({formatTime(event.schedule.appetizer.start)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm">Main ({formatTime(event.schedule.main.start)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-sm">Dessert ({formatTime(event.schedule.dessert.start)})</span>
        </div>
      </div>
      
      {/* Dinner Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dinner Groups</h3>
        <p className="text-sm text-muted-foreground">
          Each group of 6 participants rotates together through the evening, meeting at different homes for each course.
        </p>
        
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dinner Group {group.id}</CardTitle>
                <CardDescription>6 participants, 3 locations</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Route Timeline */}
                <div className="space-y-4">
                  {(['appetizer', 'main', 'dessert'] as Course[]).map((course, index) => {
                    const hostTeam = group[course]
                    if (!hostTeam) return null
                    
                    const host1 = getParticipant(hostTeam.member1Id)
                    const host2 = getParticipant(hostTeam.member2Id)
                    const time = event.schedule[course]
                    
                    return (
                      <div key={course} className="relative">
                        {index < 2 && (
                          <div className="absolute left-4 top-10 h-full w-0.5 bg-border" />
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${courseColors[course]} text-white`}>
                            {index + 1}
                          </div>
                          
                          <div className="flex-1 rounded-lg border border-border bg-card p-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize">
                                {course}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTime(time.start)} - {formatTime(time.end)}
                              </div>
                            </div>
                            
                            <p className="mt-2 text-sm font-medium">
                              Hosted by {host1?.name} & {host2?.name}
                            </p>
                            
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{hostTeam.address}</span>
                            </div>
                          </div>
                        </div>
                        
                        {index < 2 && (
                          <div className="ml-4 flex items-center gap-2 py-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Travel to next location</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* All Participants in Group */}
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">PARTICIPANTS</p>
                  <div className="flex flex-wrap gap-1">
                    {group.teams.flatMap(t => [t.member1Id, t.member2Id]).map((pId) => {
                      const p = getParticipant(pId)
                      return p ? (
                        <Badge key={pId} variant="secondary" className="text-xs">
                          {p.name.split(' ')[0]}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Info Box */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">About Running Dinner Routes</p>
            <p className="mt-1 text-muted-foreground">
              Each participant visits 3 homes during the evening: their own (where they host one course) 
              and 2 others. By the end of the night, they have met 10 different people across all courses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
