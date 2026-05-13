'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Check,
  UtensilsCrossed,
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
  partnerDietaryRestrictions: string[]
  canHostSolo: boolean | null
}

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
    partnerDietaryRestrictions: [],
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

  const togglePartnerDietary = (value: string) => {
    setForm(prev => ({
      ...prev,
      partnerDietaryRestrictions: prev.partnerDietaryRestrictions.includes(value)
        ? prev.partnerDietaryRestrictions.filter(d => d !== value)
        : [...prev.partnerDietaryRestrictions, value],
    }))
  }

  const isFormValid = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) return false
    if (!form.address.trim() && form.pinLat == null) return false
    if (!form.hasPartner && form.canHostSolo === null) return false
    return true
  }

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
        partnerDietaryRestrictions: form.hasPartner ? form.partnerDietaryRestrictions : null,
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

  const Header = () => (
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
  )

  if (loadingDinner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (loadError || !dinner) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100">
              <UtensilsCrossed className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-amber-900">Registration Closed</h1>
            <p className="mt-2 text-amber-600">{loadError || 'This event is not available for registration.'}</p>
            <Link href="/"><Button className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500">Back to Home</Button></Link>
          </div>
        </main>
      </div>
    )
  }

  if (dinner.registrationDeadline && new Date() > new Date(dinner.registrationDeadline)) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header />
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

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-green-200 bg-white/80 text-center shadow-xl">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                <Check className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800">You're registered!</CardTitle>
              <CardDescription className="text-green-600">Welcome to {dinner.publicTitle || 'the Running Dinner'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-700">Thanks for signing up! The organizer will be in touch with your team assignment and schedule closer to the event.</p>
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
                  <span>{dinner.appetizerTime.slice(0,5)} – {dinner.dessertTime.slice(0,5)}</span>
                </div>
              </div>
              {dinner.contactEmail && (
                <p className="text-sm text-amber-600">Questions? Contact {dinner.contactName || 'the organizer'} at {dinner.contactEmail}</p>
              )}
              <Link href="/"><Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-md">Back to Home</Button></Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Greeting Banner */}
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-md">
                  <UtensilsCrossed className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-600 mb-1">You are registering for</p>
                  <h1 className="text-xl font-bold text-amber-900">{dinner.publicTitle || 'Running Dinner'}</h1>
                  {dinner.publicDescription && <p className="mt-1 text-sm text-amber-700">{dinner.publicDescription}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-amber-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      {format(new Date(dinner.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      {dinner.city}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                      {dinner.appetizerTime.slice(0,5)} – {dinner.dessertTime.slice(0,5)}
                    </div>
                  </div>
                  {dinner.contactName && (
                    <p className="mt-2 text-xs text-amber-600">
                      Organized by {dinner.contactName}{dinner.contactEmail ? ` · ${dinner.contactEmail}` : ''}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-amber-500 italic">👇 Want to know what a Running Dinner is? Scroll to the bottom!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80 shadow-xl">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardHeader>
              <CardTitle className="text-amber-900">Register</CardTitle>
              <CardDescription className="text-amber-600">Fill in your details to join the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pb-8">

              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-amber-900 border-b border-amber-100 pb-2">Personal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Jane" value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} className="rounded-xl border-amber-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} className="rounded-xl border-amber-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => update({ email: e.target.value })} className="rounded-xl border-amber-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => update({ phone: e.target.value })} className="rounded-xl border-amber-200" />
                </div>
              </div>

              {/* Partner */}
              <div className="space-y-4">
                <h3 className="font-semibold text-amber-900 border-b border-amber-100 pb-2">Partner</h3>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="hasPartner" checked={form.hasPartner} onCheckedChange={(checked) => update({ hasPartner: !!checked })} />
                    <div>
                      <Label htmlFor="hasPartner" className="cursor-pointer font-medium text-amber-900">I am registering with a partner</Label>
                      <p className="text-xs text-amber-600 mt-0.5">If you register with a partner, they do not need to register separately.</p>
                    </div>
                  </div>
                  {form.hasPartner && (
                    <div className="mt-4 space-y-3 border-t border-amber-200 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">Partner Name</Label>
                        <Input id="partnerName" placeholder="Partner's full name" value={form.partnerName} onChange={(e) => update({ partnerName: e.target.value })} className="rounded-xl border-amber-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerEmail">Partner Email</Label>
                        <Input id="partnerEmail" type="email" placeholder="partner@example.com" value={form.partnerEmail} onChange={(e) => update({ partnerEmail: e.target.value })} className="rounded-xl border-amber-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerPhone">Partner Phone</Label>
                        <Input id="partnerPhone" type="tel" placeholder="+1 555 987 6543" value={form.partnerPhone} onChange={(e) => update({ partnerPhone: e.target.value })} className="rounded-xl border-amber-200" />
                      </div>
                      <div className="space-y-2">
                        <Label>Partner Dietary Restrictions</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {dietaryOptions.map((option) => (
                            <div key={`partner-${option.value}`} className="flex items-center gap-2">
                              <Checkbox
                                id={`partner-${option.value}`}
                                checked={form.partnerDietaryRestrictions.includes(option.value)}
                                onCheckedChange={() => togglePartnerDietary(option.value)}
                              />
                              <label htmlFor={`partner-${option.value}`} className="cursor-pointer text-sm font-medium text-amber-900">{option.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-amber-900 border-b border-amber-100 pb-2">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Home Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Street name, number, postal code, city"
                    value={form.address}
                    onChange={(e) => { update({ address: e.target.value }); setGeocodeError(null) }}
                    rows={3}
                    className="rounded-xl border-amber-200"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={!form.address.trim() || geocoding} onClick={handleGeocode} className="gap-2 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">
                    {geocoding ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding...</> : <><MapPin className="h-3.5 w-3.5" /> Find on map</>}
                  </Button>
                  {geocodeError && <p className="text-xs text-red-600">{geocodeError}</p>}
                  <p className="text-sm text-muted-foreground">We use your location to plan routes between courses.</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-200" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-amber-500 font-medium">{form.address.trim() ? 'Or fine-tune on the map' : 'Or set your location on the map'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-amber-700"><MapPin className="inline h-4 w-4 mr-1 text-amber-500" />Click on the map to place your pin.</p>
                  <LocationPickerMap lat={form.pinLat} lng={form.pinLng} onChange={(lat, lng) => update({ pinLat: lat, pinLng: lng })} />
                  {form.pinLat != null && form.pinLng != null && (
                    <p className="text-xs text-green-700 font-medium">
                      Pin set at {form.pinLat.toFixed(5)}, {form.pinLng.toFixed(5)}{' — '}
                      <button type="button" className="underline text-red-500" onClick={() => update({ pinLat: null, pinLng: null })}>remove</button>
                    </p>
                  )}
                  {!form.address.trim() && form.pinLat == null && (
                    <p className="text-xs text-amber-600">Please enter an address or place a pin on the map.</p>
                  )}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-amber-900 border-b border-amber-100 pb-2">Dietary Restrictions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox id={option.value} checked={form.dietaryRestrictions.includes(option.value)} onCheckedChange={() => toggleDietary(option.value)} />
                      <label htmlFor={option.value} className="cursor-pointer text-sm font-medium text-amber-900">{option.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Can host solo */}
              {!form.hasPartner && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-amber-900 border-b border-amber-100 pb-2">Hosting</h3>
                  <Label>Could you host 6 people at your place? *</Label>
                  <p className="text-sm text-muted-foreground">This helps us plan which team will host each course.</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => update({ canHostSolo: true })} className={cn('flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all', form.canHostSolo === true ? 'border-green-400 bg-green-50 text-green-800' : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50')}>
                      Yes, I can host
                    </button>
                    <button type="button" onClick={() => update({ canHostSolo: false })} className={cn('flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all', form.canHostSolo === false ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50')}>
                      No, I cannot host
                    </button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Error */}
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
          )}

          {/* Running Dinner Explanation */}
          <Card className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white/80">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-amber-900">🍽️ What is a Running Dinner?</h2>
              <p className="text-sm text-amber-800">A Running Dinner is a social dining experience where participants share a multi-course meal — but each course takes place at a different home!</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-lg">1️⃣</span>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Appetizer</p>
                    <p className="text-xs text-amber-700">You start at your first hosts' home with one other couple. Get to know each other and warm up for the night!</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">2️⃣</span>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Main Course</p>
                    <p className="text-xs text-amber-700">Everyone moves on — a completely different home, a brand new group of people, fresh conversations.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">3️⃣</span>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Dessert</p>
                    <p className="text-xs text-amber-700">The grand finale — yet another home, yet another wonderful group of people!</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                <p><strong>🏠 Your role as host:</strong> Every team hosts exactly one course at home — simple and homemade is perfect!</p>
                <p><strong>🤝 The magic:</strong> By the end of the evening you will have shared a meal with up to 12 different people from your community.</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="w-full gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-6 text-base font-semibold shadow-md transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Registering...</>
            ) : (
              <><Check className="h-5 w-5" /> Register</>
            )}
          </Button>

        </div>
      </main>
    </div>
  )
}
