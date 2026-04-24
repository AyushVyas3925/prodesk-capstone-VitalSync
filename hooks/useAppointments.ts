'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { PatientAppointment } from '@/types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const supabase = createClient()

  // READ — fetch all appointments
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('patient_appointments')
      .select('*')
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (error) setError(error.message)
    else setAppointments(data || [])
    setLoading(false)
  }, [user?.id, supabase])

  useEffect(() => { 
    fetchAppointments() 
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('patient_appointments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAppointments, supabase])

  // CREATE — add new appointment
  const addAppointment = async (
    data: Omit<PatientAppointment, 'id' | 'patient_id' | 'created_at'>
  ) => {
    if (!user?.id) return
    const { data: newAppt, error } = await supabase
      .from('patient_appointments')
      .insert({ ...data, patient_id: user.id })
      .select()
      .single()
    if (error) throw error
    // Optimistic update — instantly add to UI
    setAppointments(prev => [...prev, newAppt])
    return newAppt
  }

  // UPDATE — edit existing appointment
  const updateAppointment = async (
    id: string,
    data: Partial<PatientAppointment>
  ) => {
    const { data: updated, error } = await supabase
      .from('patient_appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    // Optimistic update — instantly update in UI
    setAppointments(prev => 
      prev.map(a => a.id === id ? updated : a)
    )
    return updated
  }

  // DELETE — remove appointment
  const deleteAppointment = async (id: string) => {
    const { error } = await supabase
      .from('patient_appointments')
      .delete()
      .eq('id', id)
    if (error) throw error
    // Optimistic update — instantly remove from UI
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  }
}
