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
import { format, isSameDay } from 'date-fns'

function formatDisplayTime(isoString: string) {
  return format(new Date(isoString), 'hh:mm a')
}

function extractInitials(fullName: string) {
  return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function DoctorDashboard() {
  const currentUser = useAuthStore((state) => state.user)
  const dbClient = createClient()

  const [dailyAppointments, setDailyAppointments] = useState<any[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const retrieveTodaySchedule = useCallback(async () => {
    if (!currentUser?.id) return
    setIsInitializing(true)
    try {
      const { data, error } = await dbClient
        .from('patient_appointments')
        .select('*, patient_profile:profiles!patient_id(full_name)')
        .eq('doctor_id', currentUser.id)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.warn('Failed to load schedule:', error.message)
      } else if (data) {
        const todaysList = data.filter(item => isSameDay(new Date(item.scheduled_at), new Date()))
        setDailyAppointments(todaysList)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsInitializing(false)
    }
  }, [currentUser?.id, dbClient])

  useEffect(() => {
    setHasMounted(true)
    retrieveTodaySchedule()

    const syncChannel = dbClient
      .channel('doctor_dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => retrieveTodaySchedule()
      )
      .subscribe()

    return () => {
      dbClient.removeChannel(syncChannel)
    }
  }, [retrieveTodaySchedule, dbClient])

  const modifyAppointmentState = async (recordId: string, newState: string) => {
    const { error } = await dbClient
      .from('patient_appointments')
      .update({ status: newState })
      .eq('id', recordId)
    
    if (!error) {
      setDailyAppointments((current) =>
        current.map((appt) => (appt.id === recordId ? { ...appt, status: newState } : appt))
      )
    }
  }

  const finishedCount = dailyAppointments.filter((a) => a.status === 'completed').length
  const pendingCount = dailyAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length
  const totalForToday = dailyAppointments.length
  const ratio = totalForToday > 0 ? (finishedCount / totalForToday) : 0
  const circleCircumference = 2 * Math.PI * 56

  const upcomingPatient = dailyAppointments.find((a) => a.status === 'pending' || a.status === 'confirmed')

  return (
    <main>
      <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        role="doctor" 
        mobileOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
      />

      <div className="lg:pl-60">
        <Navbar 
          role="doctor" 
          onMobileMenuToggle={() => setShowMobileSidebar(true)}
        />

        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          {!hasMounted ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0F172A]">Doctor Dashboard</h1>
                <p className="text-[#64748B]">Managing your schedule and patients for today.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    title: 'Patients Today',
                    count: totalForToday,
                    footerText: `${pendingCount} left`,
                    footerIcon: <Activity className="w-4 h-4" />,
                    footerColor: 'text-[#2563EB]',
                    iconWrapperBg: 'bg-[#EFF6FF]',
                    mainIcon: <Users className="w-6 h-6 text-[#2563EB]" />,
                  },
                  {
                    title: 'Completed',
                    count: finishedCount,
                    footerText: 'Great progress!',
                    footerIcon: <CheckCircle2 className="w-4 h-4" />,
                    footerColor: 'text-[#10B981]',
                    iconWrapperBg: 'bg-[#F0FDF4]',
                    mainIcon: <CheckCircle2 className="w-6 h-6 text-[#10B981]" />,
                  },
                  {
                    title: 'Upcoming',
                    count: pendingCount,
                    footerText: upcomingPatient ? `Next: ${formatDisplayTime(upcomingPatient.scheduled_at)}` : 'No more today',
                    footerIcon: <Clock className="w-4 h-4" />,
                    footerColor: 'text-[#F59E0B]',
                    iconWrapperBg: 'bg-[#FEF3C7]',
                    mainIcon: <Clock className="w-6 h-6 text-[#F59E0B]" />,
                  },
                ].map((stat) => (
                  <div key={stat.title} className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#64748B] text-sm mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-[#0F172A]">{stat.count}</p>
                        <div className={`flex items-center gap-1 mt-2 text-sm ${stat.footerColor}`}>
                          {stat.footerIcon}
                          <span>{stat.footerText}</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-full ${stat.iconWrapperBg} flex items-center justify-center`}>
                        {stat.mainIcon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="p-6 border-b border-[#E2E8F0]">
                    <h2 className="text-lg font-semibold text-[#0F172A]">Today's Appointments</h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {isInitializing ? (
                      <div className="flex items-center justify-center h-40 text-[#64748B]">
                        <Loader2 className="animate-spin w-6 h-6 mr-2" />
                        Loading…
                      </div>
                    ) : dailyAppointments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8] text-center">
                        <Calendar className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">No appointments for today</p>
                      </div>
                    ) : (
                      dailyAppointments.map((record) => {
                        const displayName = record.patient_profile?.full_name || 'Unknown Patient'
                        return (
                          <div
                            key={record.id}
                            className={`rounded-lg border-l-4 p-4 transition-all hover:shadow-sm bg-[#F8FAFC] 
                              ${record.status === 'completed' ? 'border-[#10B981]' : 'border-[#2563EB]'}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-[#2563EB] text-white">
                                    {extractInitials(displayName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-[#0F172A]">{displayName}</h4>
                                  <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {formatDisplayTime(record.scheduled_at)}
                                    </span>
                                    <span>•</span>
                                    <span>{record.appointment_type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {record.status === 'completed' && (
                                  <Badge className="bg-green-100 text-green-700 border-none">Completed</Badge>
                                )}
                                {record.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => modifyAppointmentState(record.id, 'confirmed')}
                                    className="bg-[#2563EB] hover:bg-[#1E40AF] text-white text-xs h-8"
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {record.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => modifyAppointmentState(record.id, 'completed')}
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

                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 text-center">
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Daily Progress</h3>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="56" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                        <circle
                          cx="64" cy="64" r="56"
                          stroke="#10B981" strokeWidth="12" fill="none"
                          strokeDasharray={`${ratio * circleCircumference} ${circleCircumference}`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{finishedCount}/{totalForToday}</span>
                        <span className="text-[10px] text-[#64748B] uppercase font-bold">Done</span>
                      </div>
                    </div>
                  </div>

                  {upcomingPatient && (
                    <div className="bg-[#2563EB] rounded-xl p-6 text-white shadow-lg">
                      <h3 className="text-lg font-semibold mb-3">Next Patient</h3>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <p className="font-bold text-lg">{upcomingPatient.patient_profile?.full_name}</p>
                        <p className="text-sm text-white/80 mt-1">{formatDisplayTime(upcomingPatient.scheduled_at)}</p>
                        <Badge className="mt-3 bg-white text-[#2563EB] hover:bg-white border-none">
                          {upcomingPatient.appointment_type}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </main>
  )
}
