'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, CheckCircle2, Clock, Activity, Loader2, Calendar
} from 'lucide-react'
import { PatientAppointment } from '@/types'
import { format, isSameDay } from 'date-fns'

// ────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  return format(new Date(iso), 'hh:mm a')
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user)
  const supabase = createClient()

  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ── Fetch today's appointments for this doctor ────────
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      // Fetch appointments where doctor_id matches
      const { data, error } = await supabase
        .from('patient_appointments')
        .select(`
          *,
          patient_profile:profiles!patient_id(full_name)
        `)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.warn('Error fetching appointments:', error.message)
      } else if (data) {
        // Filter for today's appointments in JS for simplicity, 
        // or add gte/lte in query for better performance
        const todayAppts = data.filter(a => isSameDay(new Date(a.scheduled_at), new Date()))
        setAppointments(todayAppts)
      }
    } catch (err) {
      console.error('Error in fetchAppointments:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const markComplete = async (id: string) => {
    const { error } = await supabase
      .from('patient_appointments')
      .update({ status: 'completed' })
      .eq('id', id)
    
    if (!error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
      )
    }
  }

  // ── Stats ─────────────────────────────────────────────
  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const remainingCount = appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length
  const totalCount = appointments.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) : 0
  const circumference = 2 * Math.PI * 56

  const nextAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role="doctor" />

      <div className="lg:pl-60">
        <Navbar role="doctor" />

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A]">Doctor Dashboard</h1>
            <p className="text-[#64748B]">Managing your schedule and patients for today.</p>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Patients Today',
                value: totalCount,
                sub: `${remainingCount} left`,
                subIcon: <Activity className="w-4 h-4" />,
                subColor: 'text-[#2563EB]',
                bgIcon: 'bg-[#EFF6FF]',
                icon: <Users className="w-6 h-6 text-[#2563EB]" />,
              },
              {
                label: 'Completed',
                value: completedCount,
                sub: 'Great progress!',
                subIcon: <CheckCircle2 className="w-4 h-4" />,
                subColor: 'text-[#10B981]',
                bgIcon: 'bg-[#F0FDF4]',
                icon: <CheckCircle2 className="w-6 h-6 text-[#10B981]" />,
              },
              {
                label: 'Upcoming',
                value: remainingCount,
                sub: nextAppt ? `Next: ${fmtTime(nextAppt.scheduled_at)}` : 'No more today',
                subIcon: <Clock className="w-4 h-4" />,
                subColor: 'text-[#F59E0B]',
                bgIcon: 'bg-[#FEF3C7]',
                icon: <Clock className="w-6 h-6 text-[#F59E0B]" />,
              },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#64748B] text-sm mb-1">{card.label}</p>
                    <h3 className="text-3xl font-bold text-[#0F172A]">{card.value}</h3>
                    <div className={`flex items-center gap-1 mt-2 text-sm ${card.subColor}`}>
                      {card.subIcon}
                      <span>{card.sub}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${card.bgIcon} flex items-center justify-center`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Appointment List — 2/3 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0]">
                <h2 className="text-lg font-semibold text-[#0F172A]">Today&apos;s Appointments</h2>
              </div>

              <div className="p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-[#64748B]">
                    <Loader2 className="animate-spin w-6 h-6 mr-2" />
                    Loading…
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8] text-center">
                    <Calendar className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">No appointments for today</p>
                  </div>
                ) : (
                  appointments.map((appt) => {
                    const patientName = appt.patient_profile?.full_name || 'Unknown Patient'
                    return (
                      <div
                        key={appt.id}
                        className={`rounded-lg border-l-4 p-4 transition-all hover:shadow-sm bg-[#F8FAFC] 
                          ${appt.status === 'completed' ? 'border-[#10B981]' : 'border-[#2563EB]'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-[#2563EB] text-white">
                                {initials(patientName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-[#0F172A]">{patientName}</h4>
                              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {fmtTime(appt.scheduled_at)}
                                </span>
                                <span>•</span>
                                <span>{appt.appointment_type}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {appt.status === 'completed' ? (
                              <Badge className="bg-green-100 text-green-700 border-none">Completed</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => markComplete(appt.id)}
                                className="bg-[#10B981] hover:bg-[#059669] text-white text-xs h-8"
                              >
                                Complete ✓
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Column — 1/3 */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 text-center">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Daily Progress</h3>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                    <circle
                      cx="64" cy="64" r="56"
                      stroke="#10B981" strokeWidth="12" fill="none"
                      strokeDasharray={`${progressPct * circumference} ${circumference}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{completedCount}/{totalCount}</span>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold">Done</span>
                  </div>
                </div>
              </div>

              {nextAppt && (
                <div className="bg-[#2563EB] rounded-xl p-6 text-white shadow-lg">
                  <h3 className="text-lg font-semibold mb-3">Next Patient</h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="font-bold text-lg">{nextAppt.patient_profile?.full_name}</p>
                    <p className="text-sm text-white/80 mt-1">{fmtTime(nextAppt.scheduled_at)}</p>
                    <Badge className="mt-3 bg-white text-[#2563EB] hover:bg-white border-none">
                      {nextAppt.appointment_type}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
