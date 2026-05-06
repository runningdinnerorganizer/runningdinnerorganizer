'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { EventFormData, EventSchedule } from '@/lib/types'
import { StepBasicInfo } from '@/components/events/create/step-basic-info'
import { StepLocation } from '@/components/events/create/step-location'
import { StepSchedule } from '@/components/events/create/step-schedule'
import { StepOptions } from '@/components/events/create/step-options'
import { StepReview } from '@/components/events/create/step-review'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  UtensilsCrossed,
  Sparkles,
  ChefHat,
  Calendar,
  MapPin,
  Settings,
  ClipboardCheck,
  Copy,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const steps = [
  { id: 1, name: 'Basic Info', description: 'Name and date', icon: Calendar },
  { id: 2, name: 'Location', description: 'City and area', icon: MapPin },
  { id: 3, name: 'Schedule', description: 'Course times', icon: ChefHat },
  { id: 4, name: 'Options', description: 'Registration settings', icon: Settings },
  { id: 5, name: 'Review', description: 'Confirm details', icon: ClipboardCheck },
]

const defaultSchedule: EventSchedule = {
  appetizer: { start: '18:00', end: '19:15' },
  main: { start: '19:30', end: '21:00' },
  dessert: { start: '21:15', end: '22:30' },
}

interface CreatedEvent {
  id: string
  inviteToken: string | null
}

export default function NewEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: null,
    description: '',
    city: '',
    centerAddress: '',
    centerLocation: null,
    schedule: defaultSchedule,
    registrationDeadline: null,
    maxParticipants: 24,
  })

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!formData.date || !formData.registrationDeadline) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const body = {
        title: formData.name,
        publicTitle: formData.name,
        publicDescription: formData.description || null,
        city: formData.city,
        date: formData.date.toISOString(),
        registrationDeadline: formData.registrationDeadline.toISOString(),
        appetizerTime: formData.schedule.appetizer.start,
        mainTime: formData.schedule.main.start,
        dessertTime: formData.schedule.dessert.start,
        contactName: null,
        contactEmail: null,
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      setCreatedEvent({ id: data.event.id, inviteToken: data.event.inviteToken })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.date !== null
      case 2:
        return formData.city.trim() !== ''
      case 3:
        return true
      case 4:
        return formData.registrationDeadline !== null && formData.maxParticipants > 0
      case 5:
        return true
      default:
        return false
    }
  }

  const CurrentStepIcon = steps[currentStep - 1].icon

  const inviteLink = createdEvent?.inviteToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdEvent.inviteToken}`
    : null

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappMessage = inviteLink
    ? `You're invited to a Running Dinner! Register here: ${inviteLink}`
    : ''

  // Success screen
  if (createdEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-md">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-amber-900">Running Dinner</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-amber-900">Event Created!</h1>
            <p className="mb-8 text-amber-600">
              Your running dinner event has been created successfully. Share the invite link with your participants!
            </p>

            {inviteLink ? (
              <Card className="mb-6 overflow-hidden rounded-2xl border-2 border-green-200 bg-white/80 text-left">
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
                <CardHeader>
                  <CardTitle className="text-green-800">Invite Link</CardTitle>
                  <CardDescription className="text-green-600">
                    Share this link so participants can register for your dinner.
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
                      onClick={handleCopy}
                      className="shrink-0 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-green-600"
                  >
                    Share via WhatsApp
                  </a>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => router.push(`/events/${createdEvent.id}`)}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md hover:shadow-lg"
              >
                View Event
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/events')}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                All Events
              </Button>
            </div>
          </div>
        </main>
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

          <Link href="/events">
            <Button variant="ghost" className="gap-2 text-amber-700 hover:text-amber-900">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-amber-900">Create New Event</h1>
            <p className="text-amber-600">Set up your running dinner in a few simple steps!</p>
          </div>

          {/* Progress Steps - Mobile */}
          <div className="mb-6 flex items-center justify-center gap-2 md:hidden">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  'h-2 w-8 rounded-full transition-colors',
                  currentStep >= step.id
                    ? 'bg-gradient-to-r from-orange-400 to-amber-400'
                    : 'bg-amber-200'
                )}
              />
            ))}
          </div>

          {/* Progress Steps - Desktop */}
          <nav aria-label="Progress" className="mb-8 hidden md:block">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <li key={step.id} className="relative flex flex-col items-center">
                    <div className="flex items-center">
                      {index !== 0 && (
                        <div
                          className={cn(
                            'absolute right-1/2 top-5 -z-10 h-0.5 w-full',
                            currentStep > step.id ? 'bg-orange-400' : 'bg-amber-200'
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300',
                          currentStep > step.id
                            ? 'border-orange-400 bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-md'
                            : currentStep === step.id
                            ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-md'
                            : 'border-amber-200 bg-white text-amber-400'
                        )}
                      >
                        {currentStep > step.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          currentStep >= step.id ? 'text-amber-900' : 'text-amber-400'
                        )}
                      >
                        {step.name}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Step Content */}
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-xl backdrop-blur-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <CurrentStepIcon className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900">{steps[currentStep - 1].name}</CardTitle>
              <CardDescription className="text-amber-600">{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              {currentStep === 1 && <StepBasicInfo formData={formData} updateFormData={updateFormData} />}
              {currentStep === 2 && <StepLocation formData={formData} updateFormData={updateFormData} />}
              {currentStep === 3 && <StepSchedule formData={formData} updateFormData={updateFormData} />}
              {currentStep === 4 && <StepOptions formData={formData} updateFormData={updateFormData} />}
              {currentStep === 5 && <StepReview formData={formData} />}
            </CardContent>
          </Card>

          {/* Error */}
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 rounded-xl border-2 border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-900 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Event!
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
