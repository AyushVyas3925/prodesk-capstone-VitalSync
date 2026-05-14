'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { PatientAppointment } from '@/types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const currentUser = useAuthStore((state) => state.user)
  const supabaseClient = createClient()

  const retrievePatientSchedule = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    
    const { data, error: fetchErr } = await supabaseClient
      .from('patient_appointments')
      .select('*')
      .eq('patient_id', currentUser.id)
      .order('scheduled_at', { ascending: true })
      
    if (fetchErr) {
      setError(fetchErr.message)
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }, [currentUser?.id, supabaseClient])

  useEffect(() => { 
    retrievePatientSchedule() 
    
    const subscription = supabaseClient
      .channel('patient_appointments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => retrievePatientSchedule()
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(subscription)
    }
  }, [retrievePatientSchedule, supabaseClient])

  const bookNewConsultation = async (
    appointmentDetails: Omit<PatientAppointment, 'id' | 'patient_id' | 'created_at'>
  ) => {
    if (!currentUser?.id) return
    
    const { data: createdRecord, error: insertErr } = await supabaseClient
      .from('patient_appointments')
      .insert({ ...appointmentDetails, patient_id: currentUser.id })
      .select()
      .single()
      
    if (insertErr) throw insertErr
    
    setAppointments(currentList => [...currentList, createdRecord])
    return createdRecord
  }

  const rescheduleOrModify = async (
    recordId: string,
    updates: Partial<PatientAppointment>
  ) => {
    const { data: updatedRecord, error: updateErr } = await supabaseClient
      .from('patient_appointments')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single()
      
    if (updateErr) throw updateErr
    
    setAppointments(currentList => 
      currentList.map(item => item.id === recordId ? updatedRecord : item)
    )
    return updatedRecord
  }

  const cancelAndRemove = async (recordId: string) => {
    const { error: deleteErr } = await supabaseClient
      .from('patient_appointments')
      .delete()
      .eq('id', recordId)
      
    if (deleteErr) throw deleteErr
    
    setAppointments(currentList => currentList.filter(item => item.id !== recordId))
  }

  return {
    appointments,
    loading,
    error,
    addAppointment: bookNewConsultation,
    updateAppointment: rescheduleOrModify,
    deleteAppointment: cancelAndRemove,
    refetch: retrievePatientSchedule,
  }
}
