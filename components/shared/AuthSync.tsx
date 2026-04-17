'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types'

export function AuthSync() {
  const setUser = useAuthStore((s) => s.setUser)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch of the session
    const syncSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session?.user) {
        const userRole = (session.user.user_metadata?.role as Role) || 'patient'
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          role: userRole,
        })
      }
    }

    syncSession()

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userRole = (session.user.user_metadata?.role as Role) || 'patient'
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          role: userRole,
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, supabase.auth])

  return null // This component only handles side effects
}
