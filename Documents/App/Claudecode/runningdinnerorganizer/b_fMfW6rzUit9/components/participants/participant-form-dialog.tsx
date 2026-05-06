'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useMockData } from '@/lib/mock-context'
import type { Participant, DietaryRestriction } from '@/lib/types'

interface ParticipantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  participant?: Participant
}

const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'lactose_free', label: 'Lactose Free' },
  { value: 'nut_allergy', label: 'Nut Allergy' },
  { value: 'shellfish_allergy', label: 'Shellfish Allergy' },
]

export function ParticipantFormDialog({ open, onOpenChange, eventId, participant }: ParticipantFormDialogProps) {
  const { addParticipant, updateParticipant } = useMockData()
  const isEditing = !!participant
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dietaryRestrictions: [] as DietaryRestriction[],
    notes: '',
  })
  
  useEffect(() => {
    if (participant) {
      setFormData({
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        address: participant.address,
        dietaryRestrictions: participant.dietaryRestrictions,
        notes: participant.notes || '',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        dietaryRestrictions: [],
        notes: '',
      })
    }
  }, [participant, open])
  
  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditing && participant) {
      updateParticipant(participant.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dietaryRestrictions: formData.dietaryRestrictions,
        notes: formData.notes,
      })
    } else {
      addParticipant({
        eventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: { lat: 52.3676, lng: 4.9041 }, // Default location
        dietaryRestrictions: formData.dietaryRestrictions,
        notes: formData.notes,
      })
    }
    
    onOpenChange(false)
  }
  
  const isValid = formData.name.trim() !== '' && formData.email.trim() !== '' && formData.address.trim() !== ''
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Participant' : 'Add Participant'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the participant information below.' 
              : 'Add a new participant to this event.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+31 6 12345678"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street, number, postal code, city"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dietary Restrictions</Label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dialog-${option.value}`}
                      checked={formData.dietaryRestrictions.includes(option.value)}
                      onCheckedChange={() => toggleDietaryRestriction(option.value)}
                    />
                    <label
                      htmlFor={`dialog-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? 'Save Changes' : 'Add Participant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
