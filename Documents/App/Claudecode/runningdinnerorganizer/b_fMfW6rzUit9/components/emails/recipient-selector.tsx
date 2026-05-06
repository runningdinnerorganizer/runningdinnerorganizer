'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle2, Users } from 'lucide-react'

export interface RealParticipant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  dietaryRestrictions: string[]
  hasPartner: boolean
  registeredAt: string
  teamId?: string | null
}

interface RecipientSelectorProps {
  participants: RealParticipant[]
  selectedRecipients: RealParticipant[]
  onSelectionChange: (participants: RealParticipant[]) => void
}

export function RecipientSelector({ participants, selectedRecipients, onSelectionChange }: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const fullName = (p: RealParticipant) => `${p.firstName} ${p.lastName}`

  const filteredParticipants = participants.filter(p =>
    fullName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isSelected = (participant: RealParticipant) =>
    selectedRecipients.some(p => p.id === participant.id)

  const toggleParticipant = (participant: RealParticipant) => {
    if (isSelected(participant)) {
      onSelectionChange(selectedRecipients.filter(p => p.id !== participant.id))
    } else {
      onSelectionChange([...selectedRecipients, participant])
    }
  }

  const selectAll = () => {
    onSelectionChange(filteredParticipants)
  }

  const deselectAll = () => {
    onSelectionChange([])
  }

  const selectWithTeams = () => {
    onSelectionChange(participants.filter(p => p.teamId))
  }

  const selectWithoutTeams = () => {
    onSelectionChange(participants.filter(p => !p.teamId))
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select All ({filteredParticipants.length})
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect All
        </Button>
        <Button variant="outline" size="sm" onClick={selectWithTeams}>
          With Teams ({participants.filter(p => p.teamId).length})
        </Button>
        <Button variant="outline" size="sm" onClick={selectWithoutTeams}>
          Without Teams ({participants.filter(p => !p.teamId).length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Summary */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <span className="font-medium">{selectedRecipients.length}</span>
        <span className="text-muted-foreground">recipients selected</span>
      </div>

      {/* Participant List */}
      <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border border-border">
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No participants found</p>
          </div>
        ) : (
          filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 border-b border-border p-3 last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                id={`recipient-${participant.id}`}
                checked={isSelected(participant)}
                onCheckedChange={() => toggleParticipant(participant)}
              />
              <label
                htmlFor={`recipient-${participant.id}`}
                className="flex flex-1 cursor-pointer items-center justify-between"
              >
                <div>
                  <p className="font-medium">{fullName(participant)}</p>
                  <p className="text-sm text-muted-foreground">{participant.email}</p>
                </div>
                <div className="flex gap-2">
                  {participant.teamId && (
                    <Badge variant="outline" className="text-xs">Team Assigned</Badge>
                  )}
                  {participant.dietaryRestrictions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {participant.dietaryRestrictions.length} dietary
                    </Badge>
                  )}
                </div>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
