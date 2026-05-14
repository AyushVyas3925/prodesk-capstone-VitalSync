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
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useAppointments } from '@/hooks/useAppointments'
import { AppointmentsChart } from '@/components/charts/AppointmentsChart'
import dynamic from 'next/dynamic'
import { AvailableDoctors } from '@/components/dashboard/AvailableDoctors'
import { useAvailableDoctors } from '@/hooks/useAvailableDoctors'
import { format } from 'date-fns'

const AddAppointmentModal = dynamic(
  () => import('@/components/appointments/AddAppointmentModal').then((mod) => mod.AddAppointmentModal),
  { ssr: false }
)

function renderShortDate(isoVal: string) {
  return format(new Date(isoVal), 'dd MMM yyyy')
}

function renderClockTime(isoVal: string) {
  return format(new Date(isoVal), 'hh:mm a')
}

function renderMonthYear(dateString: string) {
  return format(new Date(dateString), 'MMM yyyy')
}

function computeDaysSince(dateString: string) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

export default function PatientDashboard() {
  const activeUser = useAuthStore((state) => state.user)
  const supabaseDb = createClient()
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  
  const { appointments, loading: isFetchingAppts } = useAppointments()
  const { doctors, loading: isFetchingDocs } = useAvailableDoctors()
  
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [activeMedsCount, setActiveMedsCount] = useState(0)
  const [mostRecentCheckup, setMostRecentCheckup] = useState<string | null>(null)
  const [isGatheringStats, setIsGatheringStats] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const pullDashboardMetrics = useCallback(async () => {
    if (!activeUser?.id) return
    setIsGatheringStats(true)

    try {
      const [
        { data: histData },
        { count: medsCount },
        { data: checkupData }
      ] = await Promise.all([
        supabaseDb
          .from('medical_history')
          .select('*')
          .eq('patient_id', activeUser.id)
          .order('event_date', { ascending: false })
          .limit(5),
          
        supabaseDb
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', activeUser.id)
          .eq('is_active', true),
          
        supabaseDb
          .from('medical_history')
          .select('event_date')
          .eq('patient_id', activeUser.id)
          .eq('event_type', 'checkup')
          .order('event_date', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      if (histData) setMedicalRecords(histData)
      if (medsCount !== null) setActiveMedsCount(medsCount)
      if (checkupData) setMostRecentCheckup(checkupData.event_date)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGatheringStats(false)
    }
  }, [activeUser?.id, supabaseDb])

  useEffect(() => {
    pullDashboardMetrics()
  }, [pullDashboardMetrics])

  const futureVisits = useMemo(() => {
    return appointments
      .filter(item => (item.status === 'pending' || item.status === 'confirmed') && new Date(item.scheduled_at) > new Date())
      .slice(0, 3)
  }, [appointments])

  const chronologicalAppts = useMemo(() => {
    return [...appointments]
      .sort((first, second) => new Date(second.scheduled_at).getTime() - new Date(first.scheduled_at).getTime())
      .slice(0, 5)
  }, [appointments])

  const immediatelyNextVisit = futureVisits[0]
  const isAnySectionLoading = isFetchingAppts || isGatheringStats

  return (
    <main>
      <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        role="patient" 
        mobileOpen={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
      />

      <div className="lg:pl-60">
        <Navbar 
          role="patient" 
          onMobileMenuToggle={() => setIsSidebarVisible(true)}
        />

        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 min-h-[68px]">
            <div>
              {activeUser ? (
                <h1 className="text-3xl font-bold text-[#0F172A]">Welcome back, {activeUser.name?.split(' ')[0]}</h1>
              ) : (
                <Skeleton className="h-9 w-64 rounded-md mb-1" />
              )}
              <p className="text-[#64748B]">Here is what's happening with your health today.</p>
            </div>
            <Button 
              onClick={() => setShowBookingModal(true)}
              className="bg-[#2563EB] hover:bg-[#1E40AF] text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>

          <div className="mb-8 min-h-[300px]">
            <AvailableDoctors doctors={doctors} loading={isFetchingDocs} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Upcoming Appointments</p>
                  <p className="text-3xl font-bold text-[#0F172A]">
                    {isAnySectionLoading ? '—' : futureVisits.length}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[#047857] text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {immediatelyNextVisit ? `Next: ${renderShortDate(immediatelyNextVisit.scheduled_at)}` : 'No upcoming'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#2563EB]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Active Prescriptions</p>
                  <p className="text-3xl font-bold text-[#0F172A]">
                    {isAnySectionLoading ? '—' : activeMedsCount}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[#047857] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{activeMedsCount > 0 ? 'Active medications' : 'No active Rx'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
                  <Pill className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#64748B] text-sm mb-1">Last Checkup</p>
                  <p className="text-2xl font-bold text-[#0F172A]">
                    {isAnySectionLoading ? '—' : mostRecentCheckup ? renderShortDate(mostRecentCheckup) : 'N/A'}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[#64748B] text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{mostRecentCheckup ? computeDaysSince(mostRecentCheckup) : 'No record'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#EF4444]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
                <h2 className="text-lg font-semibold text-[#0F172A]">Recent Appointments</h2>
                <Link 
                  href="/dashboard/patient/appointments" 
                  prefetch={false}
                  className="text-sm font-medium text-[#2563EB] hover:text-[#1E40AF] flex items-center"
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {isFetchingAppts ? (
                <div className="flex items-center justify-center h-40 text-[#64748B]">
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  Loading…
                </div>
              ) : chronologicalAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#64748B]">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No appointments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        {['Doctor', 'Specialty', 'Date', 'Time', 'Status'].map((heading) => (
                          <th
                            key={heading}
                            className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {chronologicalAppts.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                                  {item.doctor_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-[#0F172A]">
                                {item.doctor_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                            {item.specialty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                            {renderShortDate(item.scheduled_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                            {renderClockTime(item.scheduled_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`
                              ${
                                item.status === 'confirmed'  ? 'bg-green-100 text-green-700'  :
                                item.status === 'completed'  ? 'bg-gray-100  text-gray-700'   :
                                item.status === 'cancelled'  ? 'bg-red-100   text-red-700'    :
                                                               'bg-yellow-100 text-yellow-700'
                              } border-none capitalize
                            `}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Medical History</h2>

              {isGatheringStats ? (
                <div className="flex items-center justify-center h-40 text-[#64748B]">
                  <Loader2 className="animate-spin w-5 h-5" />
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#64748B] text-sm">
                  <Heart className="w-8 h-8 mb-2 opacity-30" />
                  <p>No medical history yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {medicalRecords.map((recordItem, idx) => (
                    <div key={recordItem.id} className="relative">
                      {idx !== medicalRecords.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-[#E2E8F0]" />
                      )}
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-[#2563EB] border-4 border-white shadow-sm" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs text-[#64748B] mb-1">{renderMonthYear(recordItem.event_date)}</p>
                          <h3 className="text-sm font-semibold text-[#0F172A] mb-0.5">{recordItem.title}</h3>
                          <p className="text-xs text-[#64748B]">{recordItem.doctor_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AppointmentsChart appointments={appointments} />
          </div>
        </div>
      </div>

      {showBookingModal && (
        <AddAppointmentModal 
          open={showBookingModal} 
          onOpenChange={setShowBookingModal} 
        />
      )}
    </div>
    </main>
  )
}
