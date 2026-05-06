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
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4">
      {/* Floating decorative elements */}
      <FloatingIcon icon={UtensilsCrossed} className="absolute left-[10%] top-[15%] text-orange-300" delay={0} />
      <FloatingIcon icon={ChefHat} className="absolute right-[15%] top-[20%] text-amber-300" delay={0.5} />
      <FloatingIcon icon={Wine} className="absolute left-[20%] bottom-[25%] text-rose-300" delay={1} />
      <FloatingIcon icon={Heart} className="absolute right-[10%] bottom-[30%] text-pink-300" delay={1.5} />
      <FloatingIcon icon={Sparkles} className="absolute left-[5%] top-[50%] text-yellow-400" delay={0.8} />
      <FloatingIcon icon={PartyPopper} className="absolute right-[8%] top-[45%] text-orange-400" delay={1.2} />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Logo / Title */}
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
          Create magical evenings where friends meet, cook, and celebrate together at different homes!
        </p>
        
        {/* Main Action Buttons */}
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
              
              {/* Sparkle effect on hover */}
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
              
              {/* Sparkle effect on hover */}
              <PartyPopper className="absolute right-3 top-3 h-5 w-5 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </Button>
          </Link>
        </div>
        
        {/* Fun tagline */}
        <p className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 text-rose-400" />
          <span>Made with love for dinner enthusiasts</span>
          <Heart className="h-4 w-4 text-rose-400" />
        </p>
      </div>
      
      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-100/50 to-transparent" />
    </div>
  )
}

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
