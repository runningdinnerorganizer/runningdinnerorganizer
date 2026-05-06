'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Team, Participant, Course } from '@/lib/types'
import { UtensilsCrossed, Soup, IceCream, MapPin, User } from 'lucide-react'

interface TeamGridProps {
  teams: Team[]
  participants: Participant[]
  eventId: string
}

const courseConfig: Record<Course, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  appetizer: { label: 'Appetizer', icon: Soup, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  main: { label: 'Main Course', icon: UtensilsCrossed, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  dessert: { label: 'Dessert', icon: IceCream, color: 'text-amber-600', bgColor: 'bg-amber-100' },
}

export function TeamGrid({ teams, participants }: TeamGridProps) {
  const getParticipant = (id: string) => participants.find(p => p.id === id)
  
  const teamsByCourse = {
    appetizer: teams.filter(t => t.hostingCourse === 'appetizer'),
    main: teams.filter(t => t.hostingCourse === 'main'),
    dessert: teams.filter(t => t.hostingCourse === 'dessert'),
  }
  
  return (
    <div className="space-y-8">
      {(Object.keys(courseConfig) as Course[]).map((course) => {
        const config = courseConfig[course]
        const Icon = config.icon
        const courseTeams = teamsByCourse[course]
        
        return (
          <div key={course}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{config.label} Teams</h2>
                <p className="text-sm text-muted-foreground">
                  {courseTeams.length} teams hosting this course
                </p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseTeams.map((team, index) => {
                const member1 = getParticipant(team.member1Id)
                const member2 = getParticipant(team.member2Id)
                
                return (
                  <Card key={team.id} className="group transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Team {index + 1}</CardTitle>
                        <Badge variant="outline" className={config.color}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Team Members */}
                      <div className="space-y-2">
                        {[member1, member2].map((member) => member && (
                          <div key={member.id} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{member.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <p className="line-clamp-2 text-sm text-muted-foreground">{team.address}</p>
                      </div>
                      
                      {/* Dietary Badges */}
                      {(member1?.dietaryRestrictions.length || member2?.dietaryRestrictions.length) ? (
                        <div className="flex flex-wrap gap-1">
                          {[...new Set([
                            ...(member1?.dietaryRestrictions || []),
                            ...(member2?.dietaryRestrictions || []),
                          ])].map((restriction) => (
                            <Badge key={restriction} variant="secondary" className="text-xs">
                              {restriction.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
