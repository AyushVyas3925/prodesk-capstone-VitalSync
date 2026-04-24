'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, Clock, Calendar, CheckCircle2,
  Loader2, Filter, Phone, Video
} from 'lucide-react'
import { format } from 'date-fns'

// ─────────────────────────────────────────────
type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

function fmtDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy')
}
function fmtTime(iso: string) {
  return format(new Date(iso), 'hh:mm a')
}
function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700 border-none' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100   text-blue-700   border-none' },
  completed: { label: 'Completed', className: 'bg-green-100  text-green-700  border-none' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100    text-red-700    border-none' },
}

// ─────────────────────────────────────────────
export default function MyPatientsPage() {
  const user    = useAuthStore((s) => s.user)
  const supabase = createClient()

  const [appointments, setAppointments] = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<FilterType>('all')
  const [mounted,      setMounted]      = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)

  // ── Fetch all appointments for this doctor ──
  const fetchPatients = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select(`
          *,
          patient_profile:profiles!patient_id(full_name, role)
        `)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (error) {
        console.warn('Error fetching patients:', error.message)
      } else {
        setAppointments(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    setMounted(true)
    fetchPatients()

    const channel = supabase
      .channel('doctor_patients_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => fetchPatients()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPatients, supabase])

  // ── Mark appointment confirmed / completed ──
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('patient_appointments')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
    }
  }

  // ── Filtered list ──
  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter)

  // ── Counts for filter pills ──
  const counts = {
    all:       appointments.length,
    pending:   appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        role="doctor"
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-60">
        <Navbar
          role="doctor"
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A]">My Patients</h1>
            <p className="text-[#64748B] mt-1">
              All patients who booked appointments with you.
            </p>
          </div>

          {!mounted ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            </div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Booked',  value: counts.all,       icon: <Users className="w-5 h-5 text-[#2563EB]" />,        bg: 'bg-[#EFF6FF]' },
                  { label: 'Pending',       value: counts.pending,   icon: <Clock className="w-5 h-5 text-[#F59E0B]" />,        bg: 'bg-[#FEF3C7]' },
                  { label: 'Confirmed',     value: counts.confirmed, icon: <Calendar className="w-5 h-5 text-[#2563EB]" />,     bg: 'bg-[#EFF6FF]' },
                  { label: 'Completed',     value: counts.completed, icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, bg: 'bg-[#F0FDF4]' },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{card.label}</span>
                      <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center`}>
                        {card.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A]">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Filter Pills ── */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Filter className="w-4 h-4 text-[#64748B]" />
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      filter === key
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB]'
                    }`}
                  >
                    {label}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === key ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Patient Cards ── */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-[#E2E8F0]">
                  <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-[#2563EB] opacity-40" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">No patients found</h3>
                  <p className="text-[#64748B] mt-1 text-sm max-w-xs">
                    {filter === 'all'
                      ? 'No patients have booked with you yet. Make sure your profile is set to Online.'
                      : `No ${filter} appointments right now.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((appt) => {
                    const patientName = appt.patient_profile?.full_name || 'Unknown Patient'
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG['pending']

                    return (
                      <div
                        key={appt.id}
                        className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 lg:p-5 
                                   flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                      >
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-11 h-11 flex-shrink-0">
                            <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] font-semibold">
                              {initials(patientName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0F172A] truncate">{patientName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-[#64748B] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {fmtDate(appt.scheduled_at)}
                              </span>
                              <span className="text-xs text-[#64748B] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fmtTime(appt.scheduled_at)}
                              </span>
                              <span className="text-xs flex items-center gap-1 text-[#64748B]">
                                {appt.appointment_type === 'Video Call'
                                  ? <Video className="w-3 h-3" />
                                  : <Phone className="w-3 h-3" />}
                                {appt.appointment_type}
                              </span>
                            </div>
                            {appt.specialty && (
                              <p className="text-xs text-[#94A3B8] mt-0.5">{appt.specialty}</p>
                            )}
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cfg.className}>{cfg.label}</Badge>

                          {appt.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="h-7 text-xs bg-[#2563EB] hover:bg-[#1E40AF]"
                            >
                              Confirm
                            </Button>
                          )}
                          {appt.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(appt.id, 'completed')}
                              className="h-7 text-xs bg-[#10B981] hover:bg-[#059669]"
                            >
                              Complete ✓
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
