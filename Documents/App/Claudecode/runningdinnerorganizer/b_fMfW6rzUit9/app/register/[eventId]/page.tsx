'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useMockData } from '@/lib/mock-context'
import type { ParticipantFormData, DietaryRestriction } from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  UtensilsCrossed,
  User,
  Home,
  Leaf,
} from 'lucide-react'

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Address', icon: Home },
  { id: 3, name: 'Preferences', icon: Leaf },
]

const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'lactose_free', label: 'Lactose Free' },
  { value: 'nut_allergy', label: 'Nut Allergy' },
  { value: 'shellfish_allergy', label: 'Shellfish Allergy' },
]

export default function PublicRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const { getEvent, getEventParticipants, addParticipant } = useMockData()
  
  const event = getEvent(eventId)
  const participants = event ? getEventParticipants(eventId) : []
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<ParticipantFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    location: null,
    dietaryRestrictions: [],
    notes: '',
  })
  
  if (!event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event not found</h1>
            <p className="mt-2 text-muted-foreground">This event does not exist or registration is closed.</p>
            <Link href="/">
              <Button className="mt-4">Back to Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  const isRegistrationOpen = event.status === 'registration_open'
  const isFull = participants.length >= event.maxParticipants
  const isPastDeadline = new Date() > new Date(event.registrationDeadline)
  
  const canRegister = isRegistrationOpen && !isFull && !isPastDeadline
  
  const updateFormData = (updates: Partial<ParticipantFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }
  
  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }))
  }
  
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSubmit = () => {
    addParticipant({
      eventId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      location: formData.location || { lat: 52.3676, lng: 4.9041 },
      dietaryRestrictions: formData.dietaryRestrictions,
      notes: formData.notes,
    })
    setIsSubmitted(true)
  }
  
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.email.trim() !== '' && formData.phone.trim() !== ''
      case 2:
        return formData.address.trim() !== ''
      case 3:
        return true
      default:
        return false
    }
  }
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }
  
  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">Registration Complete!</CardTitle>
              <CardDescription>
                Thank you for registering for {event.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You will receive a confirmation email shortly. We will send you your team assignment 
                and schedule closer to the event date.
              </p>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">Event Details</p>
                <p className="text-muted-foreground">
                  {format(new Date(event.date), 'EEEE, MMMM d, yyyy')} in {event.city}
                </p>
              </div>
              <Link href="/">
                <Button className="w-full">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Event Info Banner */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                    <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{event.name}</h1>
                    <p className="text-muted-foreground">Running Dinner Event</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(event.schedule.appetizer.start)} - {formatTime(event.schedule.dessert.end)}</span>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <p className="mt-4 border-t border-border pt-4 text-muted-foreground">
                  {event.description}
                </p>
              )}
            </CardContent>
          </Card>
          
          {!canRegister ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <h2 className="text-xl font-bold">Registration Unavailable</h2>
                <p className="mt-2 text-muted-foreground">
                  {!isRegistrationOpen && 'Registration for this event is not currently open.'}
                  {isFull && 'This event has reached its maximum capacity.'}
                  {isPastDeadline && 'The registration deadline has passed.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Steps */}
              <nav aria-label="Progress" className="mb-8">
                <ol className="flex items-center justify-center gap-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <li key={step.id} className="flex items-center">
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors",
                            currentStep > step.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : currentStep === step.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 bg-muted text-muted-foreground"
                          )}
                        >
                          {currentStep > step.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                          <span className="hidden text-sm font-medium sm:inline">{step.name}</span>
                        </div>
                        {index !== steps.length - 1 && (
                          <div
                            className={cn(
                              "ml-4 h-0.5 w-8",
                              currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
              
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{steps[currentStep - 1].name}</CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'Tell us who you are so we can contact you'}
                    {currentStep === 2 && 'Where should we send your dinner guests?'}
                    {currentStep === 3 && 'Any dietary requirements we should know about?'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => updateFormData({ email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+31 6 12345678"
                          value={formData.phone}
                          onChange={(e) => updateFormData({ phone: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Your Address *</Label>
                        <Textarea
                          id="address"
                          placeholder="Street name, number, postal code, city"
                          value={formData.address}
                          onChange={(e) => updateFormData({ address: e.target.value })}
                          rows={3}
                        />
                        <p className="text-sm text-muted-foreground">
                          This is where you will host one of the courses. Enter your full address including postal code.
                        </p>
                      </div>
                      
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                          <strong>Note:</strong> You will be paired with another participant as a team. 
                          One of you will host the course at your address. We will use this address to 
                          optimize routes and minimize travel time between courses.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label>Dietary Restrictions</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {dietaryOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.value}
                                checked={formData.dietaryRestrictions.includes(option.value)}
                                onCheckedChange={() => toggleDietaryRestriction(option.value)}
                              />
                              <label
                                htmlFor={option.value}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any other dietary requirements, allergies, or preferences..."
                          value={formData.notes}
                          onChange={(e) => updateFormData({ notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                {currentStep < steps.length ? (
                  <Button onClick={handleNext} disabled={!isStepValid()}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit}>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Registration
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
