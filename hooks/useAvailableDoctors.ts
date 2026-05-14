'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export function useAvailableDoctors() {
  const [doctors, setDoctors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadActivePractitioners() {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('is_available', true)
        .order('full_name', { ascending: true })

      if (dbError) {
        setError(dbError.message)
      } else {
        setDoctors(data || [])
      }
      setLoading(false)
    }

    loadActivePractitioners()

    const liveUpdates = supabase
      .channel('online-doctors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'role=eq.doctor'
      }, () => loadActivePractitioners())
      .subscribe()

    return () => {
      supabase.removeChannel(liveUpdates)
    }
  }, [])

  return { doctors, loading, error }
}
