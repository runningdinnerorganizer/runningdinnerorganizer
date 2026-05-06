'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
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
  Loader2,
} from 'lucide-react'

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), { ssr: false })

interface DinnerInfo {
  id: string
  publicTitle: string | null
  publicDescription: string | null
  city: string
  date: string
  appetizerTime: string
  mainTime: string
  dessertTime: string
  contactName: string | null
  contactEmail: string | null
  registrationDeadline: string | null
  status: string
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  pinLat: number | null
  pinLng: number | null
  dietaryRestrictions: string[]
  hasPartner: boolean
  partnerName: string
  partnerEmail: string
  partnerPhone: string
  canHostSolo: boolean | null
}

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Address', icon: Home },
  { id: 3, name: 'Preferences', icon: Leaf },
]

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'no_pork', label: 'No pork' },
  { value: 'no_beef', label: 'No beef' },
  { value: 'no_chicken', label: 'No chicken' },
  { value: 'gluten_free', label: 'Gluten-free' },
]

export default function JoinPage() {
  const params = useParams()
  const token = params.token as string

  const [dinner, setDinner] = useState<DinnerInfo | null>(null)
  const [loadingDinner, setLoadingDinner] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    pinLat: null,
    pinLng: null,
    dietaryRestrictions: [],
    hasPartner: false,
    partnerName: '',
    partnerEmail: '',
    partnerPhone: '',
    canHostSolo: null,
  })

  useEffect(() => {
    async function fetchDinner() {
      try {
        const res = await fetch(`/api/join/${token}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Event not found')
        }
        const data = await res.json()
        setDinner(data.dinner)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoadingDinner(false)
      }
    }
    fetchDinner()
  }, [token])

  const update = (updates: Partial<FormState>) => setForm(prev => ({ ...prev, ...updates }))

  const toggleDietary = (value: string) => {
    setForm(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(value)
        ? prev.dietaryRestrictions.filter(d => d !== value)
        : [...prev.dietaryRestrictions, value],
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          form.firstName.trim() !== '' &&
          form.lastName.trim() !== '' &&
          form.email.trim() !== '' &&
          form.phone.trim() !== ''
        )
      case 2:
        return form.address.trim() !== '' || (form.pinLat != null && form.pinLng != null)
      case 3:
        // if no partner: must answer can-host question
        return form.hasPartner || form.canHostSolo !== null
      default:
        return false
    }
  }

  const handleNext = () => { if (currentStep < steps.length) setCurrentStep(s => s + 1) }
  const handleBack = () => { if (currentStep > 1) setCurrentStep(s => s - 1) }

  const handleGeocode = async () => {
    if (!form.address.trim()) return
    setGeocoding(true)
    setGeocodeError(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.address)}`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RunningDinnerOrganizer/1.0', 'Accept-Language': 'de,en' },
      })
      const data = await res.json()
      if (!data || data.length === 0) {
        setGeocodeError('Address not found. Try a more specific address or place the pin manually.')
        return
      }
      update({ pinLat: parseFloat(data[0].lat), pinLng: parseFloat(data[0].lon) })
    } catch {
      setGeocodeError('Could not reach geocoding service. Please place the pin manually.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleSubmit = async () => {
    if (!dinner) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address || null,
        lat: form.pinLat,
        lng: form.pinLng,
        dietaryRestrictions: form.dietaryRestrictions,
        hasPartner: form.hasPartner,
        partnerName: form.hasPartner ? form.partnerName : null,
        partnerEmail: form.hasPartner ? form.partnerEmail : null,
        partnerPhone: form.hasPartner ? form.partnerPhone : null,
        canHostSolo: form.hasPartner ? null : form.canHostSolo,
      }

      const res = await fetch(`/api/events/${dinner.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loadingDinner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  // Error / registration closed
  if (loadError || !dinner) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
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
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
              <UtensilsCrossed className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-amber-900">Registration Closed</h1>
            <p className="mt-2 text-amber-600">
              {loadError || 'This event is not available for registration.'}
            </p>
            <Link href="/">
              <Button className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500">Back to Home</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Check deadline
  const isPastDeadline = dinner.registrationDeadline
    ? new Date() > new Date(dinner.registrationDeadline)
    : false

  if (isPastDeadline) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
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
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-amber-200 bg-white/80 text-center">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
            <CardContent className="py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-amber-900">Registration is Closed</h2>
              <p className="text-amber-600">The registration deadline for this event has passed.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Success screen
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
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
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-green-200 bg-white/80 text-center shadow-xl">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                <Check className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800">You're registered!</CardTitle>
              <CardDescription className="text-green-600">
                Welcome to {dinner.publicTitle || 'the Running Dinner'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-700">
                Thanks for signing up! The organizer will be in touch with your team assignment and schedule closer to the event.
              </p>
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>{format(new Date(dinner.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>{dinner.city}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>{dinner.appetizerTime} – {dinner.dessertTime}</span>
                </div>
              </div>
              {dinner.contactEmail && (
                <p className="text-sm text-amber-600">
                  Questions? Contact {dinner.contactName || 'the organizer'} at {dinner.contactEmail}
                </p>
              )}
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-md">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
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

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Event Info Banner */}
          <Card className="mb-8 overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-md">
                  <UtensilsCrossed className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-amber-900">{dinner.publicTitle || 'Running Dinner'}</h1>
                  {dinner.publicDescription && (
                    <p className="mt-1 text-sm text-amber-700">{dinner.publicDescription}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-amber-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      {format(new Date(dinner.date), 'EEE, MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      {dinner.city}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                      {dinner.appetizerTime} – {dinner.dessertTime}
                    </div>
                  </div>
                  {dinner.contactName && (
                    <p className="mt-2 text-xs text-amber-600">
                      Organized by {dinner.contactName}
                      {dinner.contactEmail ? ` · ${dinner.contactEmail}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center justify-center gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors',
                        currentStep > step.id
                          ? 'border-orange-400 bg-gradient-to-r from-orange-400 to-amber-400 text-white'
                          : currentStep === step.id
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-amber-200 bg-white text-amber-400'
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
                          'mx-2 h-0.5 w-8',
                          currentStep > step.id ? 'bg-orange-400' : 'bg-amber-200'
                        )}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Form */}
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-xl backdrop-blur-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardHeader>
              <CardTitle className="text-amber-900">{steps[currentStep - 1].name}</CardTitle>
              <CardDescription className="text-amber-600">
                {currentStep === 1 && 'Tell us who you are so we can contact you.'}
                {currentStep === 2 && 'Enter your address or set your location on the map — or both.'}
                {currentStep === 3 && 'Let us know about any dietary requirements.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              {/* Step 1 — Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        value={form.firstName}
                        onChange={(e) => update({ firstName: e.target.value })}
                        className="rounded-xl border-amber-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={(e) => update({ lastName: e.target.value })}
                        className="rounded-xl border-amber-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={(e) => update({ email: e.target.value })}
                      className="rounded-xl border-amber-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 555 123 4567"
                      value={form.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      className="rounded-xl border-amber-200"
                    />
                  </div>

                  {/* Partner toggle */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="hasPartner"
                        checked={form.hasPartner}
                        onCheckedChange={(checked) => update({ hasPartner: !!checked })}
                      />
                      <Label htmlFor="hasPartner" className="cursor-pointer font-medium text-amber-900">
                        I am registering with a partner
                      </Label>
                    </div>

                    {form.hasPartner && (
                      <div className="mt-4 space-y-3 border-t border-amber-200 pt-4">
                        <p className="text-sm font-medium text-amber-800">Partner details</p>
                        <div className="space-y-2">
                          <Label htmlFor="partnerName">Partner Name</Label>
                          <Input
                            id="partnerName"
                            placeholder="Partner's full name"
                            value={form.partnerName}
                            onChange={(e) => update({ partnerName: e.target.value })}
                            className="rounded-xl border-amber-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partnerEmail">Partner Email</Label>
                          <Input
                            id="partnerEmail"
                            type="email"
                            placeholder="partner@example.com"
                            value={form.partnerEmail}
                            onChange={(e) => update({ partnerEmail: e.target.value })}
                            className="rounded-xl border-amber-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partnerPhone">Partner Phone</Label>
                          <Input
                            id="partnerPhone"
                            type="tel"
                            placeholder="+1 555 987 6543"
                            value={form.partnerPhone}
                            onChange={(e) => update({ partnerPhone: e.target.value })}
                            className="rounded-xl border-amber-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2 — Address / Location */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Your Home Address
                      <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Street name, number, postal code, city"
                      value={form.address}
                      onChange={(e) => { update({ address: e.target.value }); setGeocodeError(null) }}
                      rows={3}
                      className="rounded-xl border-amber-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!form.address.trim() || geocoding}
                      onClick={handleGeocode}
                      className="gap-2 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      {geocoding ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding...</>
                      ) : (
                        <><MapPin className="h-3.5 w-3.5" /> Find on map</>
                      )}
                    </Button>
                    {geocodeError && (
                      <p className="text-xs text-red-600">{geocodeError}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      We use your location to plan routes between courses. You may host one of the three courses.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-amber-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-amber-500 font-medium">
                        {form.address.trim() ? 'Or fine-tune on the map' : 'Or set your location on the map'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-amber-700">
                      <MapPin className="inline h-4 w-4 mr-1 text-amber-500" />
                      Click anywhere on the map to place your pin. You can drag it to adjust.
                    </p>
                    <LocationPickerMap
                      lat={form.pinLat}
                      lng={form.pinLng}
                      onChange={(lat, lng) => update({ pinLat: lat, pinLng: lng })}
                    />
                    {form.pinLat != null && form.pinLng != null && (
                      <p className="text-xs text-green-700 font-medium">
                        Pin set at {form.pinLat.toFixed(5)}, {form.pinLng.toFixed(5)}
                        {' — '}
                        <button
                          type="button"
                          className="underline text-red-500"
                          onClick={() => update({ pinLat: null, pinLng: null })}
                        >
                          remove
                        </button>
                      </p>
                    )}
                  </div>

                  {!form.address.trim() && form.pinLat == null && (
                    <p className="text-xs text-amber-600">
                      Please enter an address or place a pin on the map to continue.
                    </p>
                  )}
                </div>
              )}

              {/* Step 3 — Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Dietary Restrictions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {dietaryOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                          <Checkbox
                            id={option.value}
                            checked={form.dietaryRestrictions.includes(option.value)}
                            onCheckedChange={() => toggleDietary(option.value)}
                          />
                          <label
                            htmlFor={option.value}
                            className="cursor-pointer text-sm font-medium text-amber-900"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Can host solo — only show if no partner */}
                  {!form.hasPartner && (
                    <div className="space-y-3">
                      <Label>Could you host 6 people at your place?</Label>
                      <p className="text-sm text-muted-foreground">
                        This helps us plan which team will host each course.
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => update({ canHostSolo: true })}
                          className={cn(
                            'flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all',
                            form.canHostSolo === true
                              ? 'border-green-400 bg-green-50 text-green-800'
                              : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                          )}
                        >
                          Yes, I can host
                        </button>
                        <button
                          type="button"
                          onClick={() => update({ canHostSolo: false })}
                          className={cn(
                            'flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all',
                            form.canHostSolo === false
                              ? 'border-orange-400 bg-orange-50 text-orange-800'
                              : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                          )}
                        >
                          No, I cannot host
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Navigation */}
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
                    Registering...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Registration
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
