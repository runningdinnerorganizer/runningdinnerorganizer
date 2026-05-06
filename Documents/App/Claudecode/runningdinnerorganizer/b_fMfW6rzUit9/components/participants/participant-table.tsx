'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ParticipantFormDialog } from './participant-form-dialog'
import { useMockData } from '@/lib/mock-context'
import type { Participant, DietaryRestriction } from '@/lib/types'
import { format } from 'date-fns'
import { MoreHorizontal, Edit, Trash2, Mail, MapPin } from 'lucide-react'

interface ParticipantTableProps {
  participants: Participant[]
  eventId: string
}

const dietaryLabels: Record<DietaryRestriction, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten Free',
  lactose_free: 'Lactose Free',
  nut_allergy: 'Nut Allergy',
  shellfish_allergy: 'Shellfish',
  other: 'Other',
}

export function ParticipantTable({ participants, eventId }: ParticipantTableProps) {
  const { deleteParticipant } = useMockData()
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null)
  
  const handleDelete = () => {
    if (deletingParticipant) {
      deleteParticipant(deletingParticipant.id)
      setDeletingParticipant(null)
    }
  }
  
  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead className="hidden lg:table-cell">Dietary</TableHead>
              <TableHead className="hidden sm:table-cell">Registered</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    {participant.teamId && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Team Assigned
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{participant.email}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{participant.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-start gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2 text-sm">{participant.address}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {participant.dietaryRestrictions.length > 0 ? (
                      participant.dietaryRestrictions.map((restriction) => (
                        <Badge key={restriction} variant="secondary" className="text-xs">
                          {dietaryLabels[restriction]}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(participant.registeredAt), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingParticipant(participant)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingParticipant(participant)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Edit Dialog */}
      <ParticipantFormDialog
        open={!!editingParticipant}
        onOpenChange={(open) => !open && setEditingParticipant(null)}
        eventId={eventId}
        participant={editingParticipant || undefined}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingParticipant} onOpenChange={(open) => !open && setDeletingParticipant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingParticipant?.name} from this event? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
