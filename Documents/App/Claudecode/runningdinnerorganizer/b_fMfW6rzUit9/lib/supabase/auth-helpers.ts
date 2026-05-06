import { redirect } from 'next/navigation'
import { createClient } from './server'

/**
 * Get the currently authenticated user (server-side).
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

/**
 * Get the current session (server-side).
 * Returns null if no active session.
 */
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return null
  }

  return session
}

/**
 * Sign out the current user (server-side).
 * Call this from a Server Action.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

/**
 * Require authentication in a Server Component.
 * Redirects to /login if the user is not authenticated.
 * Returns the authenticated user.
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
