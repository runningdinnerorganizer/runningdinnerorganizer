'use client'

import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Footer() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Running Dinner</span>
          </div>

          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Running Dinner Organizer
          </p>
        </div>

        {loggedIn && (
          <div className="mt-4 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Feedback?{' '}
              <a href="mailto:lukasweick@gmail.com" className="underline hover:text-foreground transition-colors">
                lukasweick@gmail.com
              </a>
            </p>
          </div>
        )}
      </div>
    </footer>
  )
}
