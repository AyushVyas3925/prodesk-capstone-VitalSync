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

    async function fetchDoctors() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setDoctors(data || [])
      }
      setLoading(false)
    }

    fetchDoctors()
  }, [])

  return { doctors, loading, error }
}
