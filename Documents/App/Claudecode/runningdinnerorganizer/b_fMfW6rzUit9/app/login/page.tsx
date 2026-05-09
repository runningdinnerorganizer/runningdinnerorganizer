'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { UtensilsCrossed, Loader2, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicMode, setMagicMode] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMagicLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) { setError(authError.message); return }
      setMagicSent(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to manage your Running Dinner events
            </CardDescription>
          </CardHeader>

          {magicSent ? (
            <CardContent className="space-y-4 text-center py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-medium text-amber-900">Check your inbox!</p>
              <p className="text-sm text-muted-foreground">We sent a login link to <strong>{email}</strong>. Click it to sign in directly.</p>
              <Button variant="outline" className="w-full" onClick={() => { setMagicSent(false); setMagicMode(false) }}>Back to login</Button>
            </CardContent>
          ) : magicMode ? (
            <form onSubmit={handleMagicLink}>
              <CardContent className="space-y-4">
                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to sign in directly — no password needed.</p>
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input id="magic-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={magicLoading}>
                  {magicLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Mail className="mr-2 h-4 w-4" />Send login link</>}
                </Button>
                <button type="button" onClick={() => { setMagicMode(false); setError('') }} className="text-sm text-muted-foreground hover:underline">Back to password login</button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" onClick={() => { setMagicMode(true); setError('') }} className="text-xs text-muted-foreground hover:text-primary hover:underline">Forgot password?</button>
                  </div>
                  <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {"Don't have an account? "}
                  <Link href="/register" className="font-medium text-primary hover:underline">Sign up</Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  )
}
