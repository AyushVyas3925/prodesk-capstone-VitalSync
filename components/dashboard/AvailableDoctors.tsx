'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, User, Activity } from 'lucide-react'
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal'

export function AvailableDoctors() {
  const [doctors, setDoctors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<{id: string, name: string} | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('is_available', true)
      
      if (data) setDoctors(data)
      setLoading(false)
    }

    fetchDoctors()

    // Real-time subscription to status changes
    const channel = supabase
      .channel('online-doctors')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: 'role=eq.doctor'
      }, () => {
        fetchDoctors()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  if (loading) return (
    <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar">
      {[1, 2, 3].map(i => (
        <div key={i} className="min-w-[200px] h-32 bg-gray-100 animate-pulse rounded-xl" />
      ))}
    </div>
  )

  if (doctors.length === 0) return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-6 text-center">
      <Activity className="w-8 h-8 text-[#2563EB] mx-auto mb-2 opacity-50" />
      <p className="text-sm font-medium text-[#1E40AF]">No doctors are currently online.</p>
      <p className="text-xs text-[#60A5FA] mt-1">Please check back later or record a manual appointment.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Doctors Online Now
        </h2>
      </div>

      <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="min-w-[240px] border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-green-100">
                  <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB]">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#0F172A] truncate">Dr. {doctor.full_name}</h4>
                  <p className="text-xs text-[#64748B] truncate">{doctor.specialty || 'General Medicine'}</p>
                </div>
              </div>
              <Button 
                onClick={() => setSelectedDoctor({ id: doctor.id, name: `Dr. ${doctor.full_name}` })}
                className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-xs h-8"
              >
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddAppointmentModal 
        open={!!selectedDoctor} 
        onOpenChange={(open) => !open && setSelectedDoctor(null)}
        preselectedDoctor={selectedDoctor}
      />
    </div>
  )
}
