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
  Users, CheckCircle2, Clock, Activity, Loader2
} from 'lucide-react'
import type { DoctorAppointment } from '@/types'

// ────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user)
  const supabase = createClient()

  const [isAvailable, setIsAvailable] = useState(true)
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([])
  const [loading, setLoading] = useState(true)

  // ── Fetch today's appointments for this doctor ────────
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('doctor_appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.warn('doctor_appointments table might be missing:', error.message)
      } else if (data) {
        setAppointments(data as DoctorAppointment[])
      }
    } catch (err) {
      console.error('Error in fetchAppointments:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // ── Mark appointment as completed ────────────────────
  const markComplete = async (id: string) => {
    await supabase
      .from('doctor_appointments')
      .update({ status: 'completed' })
      .eq('id', id)
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
    )
  }

  // ── Stats ─────────────────────────────────────────────
  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const remainingCount = appointments.filter((a) => a.status !== 'completed').length
  const totalCount = appointments.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) : 0
  const circumference = 2 * Math.PI * 56 // r=56

  // Next upcoming appointment
  const nextAppt = appointments.find((a) => a.status === 'upcoming' || a.status === 'missed')

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role="doctor" />

      <div className="lg:pl-60">
        <Navbar
          role="doctor"
          isAvailable={isAvailable}
          onToggleAvailability={setIsAvailable}
        />

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Patients Today',
                value: totalCount,
                sub: `${remainingCount} appointment${remainingCount !== 1 ? 's' : ''} left`,
                subIcon: <Activity className="w-4 h-4" />,
                subColor: 'text-[#2563EB]',
                bgIcon: 'bg-[#EFF6FF]',
                icon: <Users className="w-6 h-6 text-[#2563EB]" />,
              },
              {
                label: 'Completed',
                value: completedCount,
                sub: completedCount > 0 ? 'Great progress! 🎉' : 'None yet today',
                subIcon: <CheckCircle2 className="w-4 h-4" />,
                subColor: 'text-[#10B981]',
                bgIcon: 'bg-[#F0FDF4]',
                icon: <CheckCircle2 className="w-6 h-6 text-[#10B981]" />,
              },
              {
                label: 'Remaining',
                value: remainingCount,
                sub: nextAppt ? `Next: ${fmtTime(nextAppt.scheduled_at)}` : 'All done!',
                subIcon: <Clock className="w-4 h-4" />,
                subColor: 'text-[#F59E0B]',
                bgIcon: 'bg-[#FEF3C7]',
                icon: <Clock className="w-6 h-6 text-[#F59E0B]" />,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow"
              >
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
                <p className="text-sm text-[#64748B] mt-1">
                  {totalCount} appointment{totalCount !== 1 ? 's' : ''} scheduled
                </p>
              </div>

              <div className="p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-[#64748B]">
                    <Loader2 className="animate-spin w-6 h-6 mr-2" />
                    Loading appointments…
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8]">
                    <Clock className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">No appointments scheduled for today</p>
                  </div>
                ) : (
                  appointments.map((appt) => {
                    const borderColor =
                      appt.status === 'completed'
                        ? 'border-[#10B981]'
                        : appt.status === 'upcoming'
                        ? 'border-[#2563EB] bg-[#EFF6FF]'
                        : 'border-[#F59E0B]'

                    return (
                      <div
                        key={appt.id}
                        className={`rounded-lg border-l-4 bg-[#F8FAFC] p-4 transition-all hover:shadow-md ${borderColor}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="mt-0.5">
                              <AvatarFallback className="bg-[#2563EB] text-white text-sm">
                                {appt.patient_initials || initials(appt.patient_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0F172A] mb-1">{appt.patient_name}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {fmtTime(appt.scheduled_at)}
                                </span>
                                <span>•</span>
                                <span>{appt.appointment_type}</span>
                                <span>•</span>
                                <span>{appt.room}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {appt.status === 'completed' ? (
                              <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]">
                                Completed
                              </Badge>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" className="text-xs">
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => markComplete(appt.id)}
                                  className="bg-[#10B981] hover:bg-[#059669] text-white text-xs"
                                >
                                  Complete ✓
                                </Button>
                              </>
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

              {/* SVG Progress Circle */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Today&apos;s Progress</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="56" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                      <circle
                        cx="64" cy="64" r="56"
                        stroke="#10B981" strokeWidth="12" fill="none"
                        strokeDasharray={`${progressPct * circumference} ${circumference}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        {completedCount}/{totalCount}
                      </span>
                      <span className="text-xs text-[#64748B]">Completed</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Completed</span>
                    <span className="font-semibold text-[#10B981]">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Remaining</span>
                    <span className="font-semibold text-[#F59E0B]">{remainingCount}</span>
                  </div>
                </div>
              </div>

              {/* Next Appointment Card */}
              <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Next Appointment</h3>
                {nextAppt ? (
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarFallback className="bg-white/20 text-white text-sm">
                          {nextAppt.patient_initials || initials(nextAppt.patient_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{nextAppt.patient_name}</p>
                        <p className="text-sm text-white/80">{nextAppt.appointment_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{nextAppt.room}</span>
                      </div>
                      <Badge className="bg-white text-[#2563EB]">
                        {fmtTime(nextAppt.scheduled_at)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20 text-center text-white/80 text-sm">
                    {totalCount === 0
                      ? 'No appointments today'
                      : '🎉 All done for today!'}
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
