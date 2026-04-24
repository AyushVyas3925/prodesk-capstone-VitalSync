'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar, Pill, Heart, TrendingUp,
  CheckCircle2, Clock, Loader2, Plus, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useAppointments } from '@/hooks/useAppointments'
import { AppointmentsChart } from '@/components/charts/AppointmentsChart'
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal'
import { AvailableDoctors } from '@/components/dashboard/AvailableDoctors'
import { format } from 'date-fns'

// ────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy')
}

function fmtTime(iso: string) {
  return format(new Date(iso), 'hh:mm a')
}

function fmtMonthYear(dateStr: string) {
  return format(new Date(dateStr), 'MMM yyyy')
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
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { appointments, loading: apptsLoading } = useAppointments()
  const [history, setHistory] = useState<any[]>([])
  const [prescriptionCount, setPrescriptionCount] = useState(0)
  const [lastCheckup, setLastCheckup] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchExtraData = useCallback(async () => {
    if (!user?.id) return
    setDataLoading(true)

    try {
      // Medical history
      const { data: hist } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', user.id)
        .order('event_date', { ascending: false })
        .limit(5)

      // Active prescriptions count
      const { count: rxCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id)
        .eq('is_active', true)

      // Last checkup
      const { data: checkup } = await supabase
        .from('medical_history')
        .select('event_date')
        .eq('patient_id', user.id)
        .eq('event_type', 'checkup')
        .order('event_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (hist) setHistory(hist)
      if (rxCount !== null) setPrescriptionCount(rxCount)
      if (checkup) setLastCheckup(checkup.event_date)
    } catch (err) {
      console.error('Error in fetchExtraData:', err)
    } finally {
      setDataLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    setMounted(true)
    fetchExtraData()
  }, [fetchExtraData])

  const upcomingAppts = useMemo(() => {
    return appointments
      .filter(a => (a.status === 'pending' || a.status === 'confirmed') && new Date(a.scheduled_at) > new Date())
      .slice(0, 3)
  }, [appointments])

  const nextAppt = upcomingAppts[0]
  const totalLoading = apptsLoading || dataLoading

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        role="patient" 
        mobileOpen={mobileMenuOpen}
        onClose={() => {
          console.log('Closing mobile menu');
          setMobileMenuOpen(false);
        }}
      />

      <div className="lg:pl-60">
        <Navbar 
          role="patient" 
          onMobileMenuToggle={() => {
            console.log('Opening mobile menu');
            setMobileMenuOpen(true);
          }}
        />

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {!mounted ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A]">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-[#64748B]">Here is what's happening with your health today.</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1E40AF] shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>

          <div className="mb-8">
            <AvailableDoctors />
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Upcoming Appointments</p>
                  <h3 className="text-3xl font-bold text-[#0F172A]">
                    {totalLoading ? '—' : upcomingAppts.length}
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
                    {totalLoading ? '—' : prescriptionCount}
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
                    {totalLoading ? '—' : lastCheckup ? fmtDate(lastCheckup) : 'N/A'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Upcoming Appointments Table — 2/3 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <h2 className="text-lg font-semibold text-[#0F172A]">Recent Appointments</h2>
                <Link 
                  href="/dashboard/patient/appointments" 
                  className="text-sm font-medium text-[#2563EB] hover:text-[#1E40AF] flex items-center"
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {apptsLoading ? (
                <div className="flex items-center justify-center h-40 text-[#64748B]">
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  Loading…
                </div>
              ) : upcomingAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8]">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        {['Doctor', 'Specialty', 'Date', 'Time', 'Status'].map((h) => (
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
                      {upcomingAppts.map((appt) => (
                        <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                                  {appt.doctor_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
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
                            <Badge className={`
                              ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                              border-none capitalize
                            `}>
                              {appt.status}
                            </Badge>
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

              {dataLoading ? (
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
                      {index !== history.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-[#E2E8F0]" />
                      )}
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-[#2563EB] border-4 border-white shadow-sm" />
                        </div>
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

          {/* ── Data Visualization ── */}
          <div className="grid grid-cols-1 gap-6">
            <AppointmentsChart appointments={appointments} />
          </div>
            </>
          )}
        </main>
      </div>

      <AddAppointmentModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
    </div>
  )
}
