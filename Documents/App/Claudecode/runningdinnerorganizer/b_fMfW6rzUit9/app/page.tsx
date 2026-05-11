'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Plus,
  FolderOpen,
  UtensilsCrossed,
  Sparkles,
  PartyPopper,
  ChefHat,
  Wine,
  Heart,
  ChevronDown,
  Link2,
  Users,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
} from 'lucide-react'

export default function HomePage() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* ── Hero Section ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        <FloatingIcon icon={UtensilsCrossed} className="absolute left-[10%] top-[15%] text-orange-300" delay={0} />
        <FloatingIcon icon={ChefHat} className="absolute right-[15%] top-[20%] text-amber-300" delay={0.5} />
        <FloatingIcon icon={Wine} className="absolute left-[20%] bottom-[25%] text-rose-300" delay={1} />
        <FloatingIcon icon={Heart} className="absolute right-[10%] bottom-[30%] text-pink-300" delay={1.5} />
        <FloatingIcon icon={Sparkles} className="absolute left-[5%] top-[50%] text-yellow-400" delay={0.8} />
        <FloatingIcon icon={PartyPopper} className="absolute right-[8%] top-[45%] text-orange-400" delay={1.2} />

        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mb-8 animate-bounce-slow">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-200">
              <UtensilsCrossed className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            Running Dinner
          </h1>

          <p className="mb-2 text-xl font-medium text-amber-700 sm:text-2xl">
            Organizer
          </p>

          <p className="mx-auto mb-12 max-w-md text-balance text-muted-foreground">
            Create magical evenings where you make new friends, cook, and celebrate together at different homes!
          </p>

          <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
            <Link href="/events/new" className="group">
              <Button
                size="lg"
                className="relative h-auto w-full min-w-[200px] flex-col gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 px-8 py-8 text-white shadow-lg shadow-orange-200 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-300 sm:w-auto"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Plus className="h-8 w-8" />
                </div>
                <span className="text-lg font-semibold">Create New Event</span>
                <span className="text-sm font-normal text-white/80">Start a new dinner adventure</span>
                <Sparkles className="absolute right-3 top-3 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </Link>

            <Link href="/events" className="group">
              <Button
                size="lg"
                variant="outline"
                className="relative h-auto w-full min-w-[200px] flex-col gap-3 overflow-hidden rounded-2xl border-2 border-amber-300 bg-white/80 px-8 py-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-amber-400 hover:bg-white hover:shadow-xl sm:w-auto"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <FolderOpen className="h-8 w-8 text-amber-600" />
                </div>
                <span className="text-lg font-semibold text-amber-900">Manage Events</span>
                <span className="text-sm font-normal text-amber-600">View and edit your dinners</span>
                <PartyPopper className="absolute right-3 top-3 h-5 w-5 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </Link>
          </div>

          <p className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-rose-400" />
            <span>Made with love for dinner enthusiasts</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </p>

          <button
            onClick={scrollToHowItWorks}
            className="mx-auto mt-8 flex flex-col items-center gap-1 text-sm text-amber-600 transition-colors hover:text-amber-800"
          >
            <span className="font-medium">How do I organize a running dinner with this website?</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-100/50 to-transparent" />
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="px-4 py-24">
        <div className="mx-auto max-w-4xl">

          {/* Section header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-amber-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              A running dinner is an evening where guests move between homes for each course — appetizer, main, and dessert — meeting new people at every stop.
            </p>
          </div>

          {/* ── ORGANIZER PERSPECTIVE ── */}
          <div className="mb-20">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white">
                <ChefHat className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-amber-900">As the organizer</h3>
            </div>

            <div className="space-y-10">

              {/* Step 1 */}
              <OrganizerStep
                number={1}
                icon={<Plus className="h-5 w-5 text-orange-500" />}
                title="Create your running dinner event"
                description="Fill in the event name, city, date and the start times for each course. You can set a registration deadline so you know when to close sign-ups."
                mockup={
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-32 rounded bg-orange-200" />
                    <div className="h-8 rounded border border-border bg-white px-3 py-1 text-xs text-muted-foreground">Summer Running Dinner Berlin</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="mb-1 h-2 w-16 rounded bg-orange-100" />
                        <div className="h-8 rounded border border-border bg-white px-3 py-1 text-xs text-muted-foreground">Berlin</div>
                      </div>
                      <div>
                        <div className="mb-1 h-2 w-16 rounded bg-orange-100" />
                        <div className="h-8 rounded border border-border bg-white px-3 py-1 text-xs text-muted-foreground">14 Jun 2025</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['Appetizer 18:00', 'Main 19:00', 'Dessert 20:00'].map(t => (
                        <div key={t} className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-center text-[10px] font-medium text-orange-700">{t}</div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2 text-center text-xs font-semibold text-white">Create Event →</div>
                  </div>
                }
              />

              {/* Step 2 */}
              <OrganizerStep
                number={2}
                icon={<Link2 className="h-5 w-5 text-orange-500" />}
                title="Share the invitation link"
                description="After creating the event, you get a unique invitation link. Send it to your friends via WhatsApp, email or however you like. Anyone with the link can register."
                mockup={
                  <div className="space-y-3 p-4">
                    <div className="text-xs font-medium text-muted-foreground">Your invitation link</div>
                    <div className="flex items-center gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-2">
                      <Link2 className="h-3 w-3 shrink-0 text-orange-400" />
                      <span className="flex-1 truncate text-[10px] text-orange-700">running-dinner-organizer.vercel.app/join/abc123</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded bg-orange-500 py-1.5 text-center text-[10px] font-semibold text-white">Copy Link</div>
                      <div className="flex-1 rounded border border-orange-300 py-1.5 text-center text-[10px] font-medium text-orange-700">Share via WhatsApp</div>
                    </div>
                    <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-[10px] text-amber-700">
                      Tip: Share the link as early as possible so people have time to register.
                    </div>
                  </div>
                }
              />

              {/* Step 3 */}
              <OrganizerStep
                number={3}
                icon={<Users className="h-5 w-5 text-orange-500" />}
                title="Watch participants register"
                description="In your event dashboard you see every participant in real time — their name, address, dietary restrictions and whether they came as a couple. You can remove participants manually if needed."
                mockup={
                  <div className="space-y-1.5 p-4">
                    <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Participants (12)</div>
                    {[
                      { name: 'Anna & Jonas M.', diet: 'Vegetarian', status: 'couple' },
                      { name: 'Lena K.', diet: 'None', status: 'solo' },
                      { name: 'Max & Clara B.', diet: 'Gluten-free', status: 'couple' },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center justify-between rounded border border-border bg-white px-2 py-1.5">
                        <div>
                          <div className="text-[10px] font-medium">{p.name}</div>
                          <div className="text-[9px] text-muted-foreground">{p.diet}</div>
                        </div>
                        <div className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${p.status === 'couple' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />

              {/* Step 4 */}
              <OrganizerStep
                number={4}
                icon={<Sparkles className="h-5 w-5 text-orange-500" />}
                title="Generate teams with one click"
                description="Once registration is closed, click 'Generate Teams'. The algorithm automatically groups participants into teams of 2, assigns each team a course to host, and calculates the dinner routes. Teams are shown on a map."
                mockup={
                  <div className="space-y-3 p-4">
                    <div className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2 text-center text-xs font-semibold text-white">Generate Teams</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { course: 'Appetizer', color: 'bg-blue-100 text-blue-700 border-blue-200', teams: ['Anna & Jonas', 'Team C'] },
                        { course: 'Main', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', teams: ['Lena & Max', 'Team D'] },
                        { course: 'Dessert', color: 'bg-amber-100 text-amber-700 border-amber-200', teams: ['Clara & Ben', 'Team E'] },
                      ].map(({ course, color, teams }) => (
                        <div key={course} className={`rounded border ${color} p-2`}>
                          <div className="mb-1 text-[9px] font-semibold">{course}</div>
                          {teams.map(t => <div key={t} className="text-[9px]">{t}</div>)}
                        </div>
                      ))}
                    </div>
                    <div className="h-16 rounded border border-border bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-emerald-500 mr-1" />
                      <span className="text-[10px] text-emerald-700">Route map</span>
                    </div>
                  </div>
                }
              />

              {/* Step 5 */}
              <OrganizerStep
                number={5}
                icon={<Mail className="h-5 w-5 text-orange-500" />}
                title="Send out the dinner routes by email"
                description="Use the built-in email system to send every participant their personal dinner route: which course they host, at what time, and where they need to go for the other two courses."
                mockup={
                  <div className="space-y-2 p-4">
                    <div className="rounded border border-border bg-white p-2">
                      <div className="mb-1 text-[9px] font-semibold text-muted-foreground">Template</div>
                      <div className="rounded bg-orange-50 px-2 py-1 text-[9px] text-orange-700">Dinner Route Email</div>
                    </div>
                    <div className="rounded border border-border bg-white p-2 text-[9px] text-muted-foreground leading-4">
                      Hi {'{{name}}'}, here is your dinner route for Saturday...<br />
                      🍷 18:00 Appetizer — you are hosting at your place<br />
                      🍝 19:00 Main — Musterstr. 12, Berlin<br />
                      🍰 20:00 Dessert — Gartenweg 5, Berlin
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded bg-orange-500 py-1.5 text-center text-[10px] font-semibold text-white">Send to all (12)</div>
                      <div className="rounded border border-border px-2 py-1.5 text-[10px] text-muted-foreground">Preview</div>
                    </div>
                  </div>
                }
              />

            </div>
          </div>

          {/* Divider */}
          <div className="mb-20 flex items-center gap-4">
            <div className="h-px flex-1 bg-amber-200" />
            <UtensilsCrossed className="h-5 w-5 text-amber-400" />
            <div className="h-px flex-1 bg-amber-200" />
          </div>

          {/* ── PARTICIPANT PERSPECTIVE ── */}
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-400 text-white">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-amber-900">As a participant</h3>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-amber-200 sm:left-6" />

              <div className="space-y-8">

                <ParticipantStep
                  icon={<Link2 className="h-4 w-4 text-white" />}
                  color="bg-orange-400"
                  title="You receive an invitation link"
                  description="The organizer sends you a link — via WhatsApp, email or wherever. No account needed. Just click it."
                  mockup={
                    <div className="rounded-2xl bg-green-50 border border-green-200 p-3 text-[10px] max-w-[200px]">
                      <div className="mb-1 font-semibold text-green-800">WhatsApp</div>
                      <div className="text-green-700">Hey! Join our Running Dinner on June 14 in Berlin — register here: running-dinner-organizer.vercel.app/join/abc123</div>
                    </div>
                  }
                />

                <ParticipantStep
                  icon={<Users className="h-4 w-4 text-white" />}
                  color="bg-amber-400"
                  title="Register on the event page"
                  description="Enter your name, address (so the algorithm can calculate routes), dietary restrictions, and whether you're coming as a couple. That's it."
                  mockup={
                    <div className="space-y-1.5 rounded border border-border bg-white p-3 text-[10px] max-w-[220px]">
                      <div className="h-6 rounded border border-border px-2 py-1 text-muted-foreground">Your name</div>
                      <div className="h-6 rounded border border-border px-2 py-1 text-muted-foreground">Your address</div>
                      <div className="flex gap-1.5">
                        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded border border-orange-300 bg-orange-100" /><span>Vegetarian</span></div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded border border-border" /><span>Vegan</span></div>
                      </div>
                      <div className="rounded bg-orange-500 py-1 text-center font-semibold text-white">Register for free</div>
                    </div>
                  }
                />

                <ParticipantStep
                  icon={<Mail className="h-4 w-4 text-white" />}
                  color="bg-rose-400"
                  title="Receive a welcome email"
                  description="Right after registering you get a confirmation email. It tells you the event date, city, and that your spot is saved."
                  mockup={
                    <div className="rounded border border-border bg-white p-3 text-[10px] max-w-[240px] shadow-sm">
                      <div className="mb-1.5 font-semibold">You're in! Welcome to Summer Running Dinner</div>
                      <div className="text-muted-foreground leading-4">Hi Anna, your spot is confirmed for June 14 in Berlin. We'll send your personal dinner route a few days before the event.</div>
                    </div>
                  }
                />

                <ParticipantStep
                  icon={<MapPin className="h-4 w-4 text-white" />}
                  color="bg-emerald-500"
                  title="Receive your personal dinner route"
                  description="Before the event you get an email with your complete route: which course you host, at what time, and the exact addresses for the other two stops. You also learn who your team partner is."
                  mockup={
                    <div className="rounded border border-border bg-white p-3 text-[10px] max-w-[240px] shadow-sm space-y-1.5">
                      <div className="font-semibold">Your dinner route for June 14</div>
                      <div className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-blue-500">●</span>
                        <div><span className="font-medium">18:00 Appetizer</span> — you are hosting<br /><span className="text-muted-foreground">Guests: Lena K. & Max B.</span></div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-emerald-500">●</span>
                        <div><span className="font-medium">19:00 Main Course</span><br /><span className="text-muted-foreground">Musterstr. 12, 10115 Berlin</span></div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-amber-500">●</span>
                        <div><span className="font-medium">20:00 Dessert</span><br /><span className="text-muted-foreground">Gartenweg 5, 10115 Berlin</span></div>
                      </div>
                    </div>
                  }
                />

                <ParticipantStep
                  icon={<UtensilsCrossed className="h-4 w-4 text-white" />}
                  color="bg-purple-500"
                  title="Enjoy the evening — at three different homes"
                  description="The evening moves in three stops. At each one you meet different people. By the end of the night you've cooked for new friends, eaten at two new homes, and had the best dinner party you've ever been to."
                  mockup={
                    <div className="space-y-2 max-w-[240px]">
                      {[
                        { time: '18:00', label: 'Appetizer', sub: 'You host — prepare a starter', color: 'border-blue-200 bg-blue-50', dot: 'bg-blue-400' },
                        { time: '19:00', label: 'Main Course', sub: 'Walk to a new home', color: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-400' },
                        { time: '20:00', label: 'Dessert', sub: 'One last new address', color: 'border-amber-200 bg-amber-50', dot: 'bg-amber-400' },
                      ].map(({ time, label, sub, color, dot }) => (
                        <div key={time} className={`flex items-center gap-3 rounded-lg border ${color} px-3 py-2`}>
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                          <div>
                            <div className="text-[10px] font-semibold">{time} — {label}</div>
                            <div className="text-[9px] text-muted-foreground">{sub}</div>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Meet up to 12 new people in one evening</span>
                      </div>
                    </div>
                  }
                />

              </div>
            </div>
          </div>

          {/* CTA at bottom */}
          <div className="mt-20 text-center">
            <Link href="/register">
              <Button size="lg" className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-10 py-6 text-base font-semibold text-white shadow-lg shadow-orange-200 hover:scale-105 transition-transform">
                Get started — it&apos;s free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">Create your first event in under 2 minutes</p>
          </div>

        </div>
      </section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function FloatingIcon({
  icon: Icon,
  className,
  delay
}: {
  icon: React.ComponentType<{ className?: string }>
  className?: string
  delay: number
}) {
  return (
    <div
      className={`animate-float opacity-60 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon className="h-8 w-8 sm:h-12 sm:w-12" />
    </div>
  )
}

function OrganizerStep({
  number,
  icon,
  title,
  description,
  mockup,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  mockup: React.ReactNode
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
            {number}
          </div>
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="font-semibold text-amber-900">{title}</h4>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pl-11">{description}</p>
      </div>
      <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border bg-gray-50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-red-300" />
          <div className="h-2 w-2 rounded-full bg-yellow-300" />
          <div className="h-2 w-2 rounded-full bg-green-300" />
          <div className="ml-2 h-3 flex-1 max-w-[120px] rounded bg-gray-200" />
        </div>
        {mockup}
      </div>
    </div>
  )
}

function ParticipantStep({
  icon,
  color,
  title,
  description,
  mockup,
}: {
  icon: React.ReactNode
  color: string
  title: string
  description: string
  mockup: React.ReactNode
}) {
  return (
    <div className="relative flex gap-6 pl-14 sm:pl-16">
      <div className={`absolute left-0 z-10 flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full ${color} shadow-md`}>
        {icon}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8 w-full">
        <div className="flex-1">
          <h4 className="mb-1 font-semibold text-amber-900">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div className="shrink-0">{mockup}</div>
      </div>
    </div>
  )
}
