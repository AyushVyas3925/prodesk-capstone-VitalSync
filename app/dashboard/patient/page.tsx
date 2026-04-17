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
  Calendar, Pill, Heart, TrendingUp,
  CheckCircle2, Clock, Loader2
} from 'lucide-react'
import type { PatientAppointment, MedicalHistoryItem } from '@/types'

// ────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function fmtMonthYear(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short', year: 'numeric',
  })
}

function daysAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d} days ago`
}

// ────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const user = useAuthStore((s) => s.user)
  const supabase = createClient()

  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [history, setHistory] = useState<MedicalHistoryItem[]>([])
  const [prescriptionCount, setPrescriptionCount] = useState(0)
  const [lastCheckup, setLastCheckup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const now = new Date().toISOString()

    try {
      // Upcoming appointments
      const { data: appts, error: apptErr } = await supabase
        .from('patient_appointments')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(5)

      if (apptErr) console.warn('patient_appointments table might be missing:', apptErr.message)

      // Medical history
      const { data: hist, error: histErr } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', user.id)
        .order('event_date', { ascending: false })
        .limit(5)

      if (histErr) console.warn('medical_history table might be missing:', histErr.message)

      // Active prescriptions count
      const { count: rxCount, error: rxErr } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id)
        .eq('is_active', true)

      if (rxErr) console.warn('prescriptions table might be missing:', rxErr.message)

      // Last checkup
      const { data: checkup, error: checkupErr } = await supabase
        .from('medical_history')
        .select('event_date')
        .eq('patient_id', user.id)
        .eq('event_type', 'checkup')
        .order('event_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkupErr) console.warn('Error fetching last checkup:', checkupErr.message)

      if (appts) setAppointments(appts as PatientAppointment[])
      if (hist) setHistory(hist as MedicalHistoryItem[])
      if (rxCount !== null) setPrescriptionCount(rxCount)
      if (checkup) setLastCheckup(checkup.event_date)
    } catch (err) {
      console.error('Error in fetchData:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const nextAppt = appointments[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role="patient" />

      <div className="lg:pl-60">
        <Navbar role="patient" />

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Upcoming Appointments</p>
                  <h3 className="text-3xl font-bold text-[#0F172A]">
                    {loading ? '—' : appointments.length}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-[#10B981] text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {nextAppt ? `Next: ${fmtDate(nextAppt.scheduled_at)}` : 'No upcoming'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#2563EB]" />
                </div>
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Active Prescriptions</p>
                  <h3 className="text-3xl font-bold text-[#0F172A]">
                    {loading ? '—' : prescriptionCount}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-[#10B981] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{prescriptionCount > 0 ? 'Active medications' : 'No active Rx'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                  <Pill className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
            </div>

            {/* Last Checkup */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Last Checkup</p>
                  <h3 className="text-2xl font-bold text-[#0F172A]">
                    {loading ? '—' : lastCheckup ? fmtDate(lastCheckup) : 'N/A'}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-[#64748B] text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{lastCheckup ? daysAgo(lastCheckup) : 'No record'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#EF4444]" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Upcoming Appointments Table — 2/3 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0]">
                <h2 className="text-lg font-semibold text-[#0F172A]">Upcoming Appointments</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40 text-[#64748B]">
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  Loading…
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8]">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No upcoming appointments</p>
                  <p className="text-xs mt-1 text-[#CBD5E1]">Book an appointment to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        {['Doctor', 'Specialty', 'Date', 'Time', 'Status', 'Action'].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                                  {appt.doctor_initials ||
                                    appt.doctor_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-[#0F172A]">
                                {appt.doctor_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                            {appt.specialty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                            {fmtDate(appt.scheduled_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                            {fmtTime(appt.scheduled_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appt.status === 'confirmed' ? (
                              <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]">
                                🟢 Confirmed
                              </Badge>
                            ) : (
                              <Badge className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]">
                                🟡 Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#2563EB] hover:text-[#1E40AF] hover:bg-[#EFF6FF] text-xs"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Medical History Timeline — 1/3 */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Medical History</h2>

              {loading ? (
                <div className="flex items-center justify-center h-40 text-[#64748B]">
                  <Loader2 className="animate-spin w-5 h-5" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8] text-sm">
                  <Heart className="w-8 h-8 mb-2 opacity-30" />
                  <p>No medical history yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map((item, index) => (
                    <div key={item.id} className="relative">
                      {/* Vertical connector line */}
                      {index !== history.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-[#E2E8F0]" />
                      )}
                      <div className="flex gap-4">
                        {/* Dot */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-[#2563EB] border-4 border-white shadow-sm" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-1">
                          <p className="text-xs text-[#64748B] mb-1">{fmtMonthYear(item.event_date)}</p>
                          <h4 className="text-sm font-semibold text-[#0F172A] mb-0.5">{item.title}</h4>
                          <p className="text-xs text-[#64748B]">{item.doctor_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
