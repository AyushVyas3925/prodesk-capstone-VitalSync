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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Users, Clock, Calendar, CheckCircle2,
  Loader2, Filter, Phone, Video, Sparkles, Copy, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

  // ── AI Summarize state ──
  const [summaryOpen,    setSummaryOpen]    = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryText,    setSummaryText]    = useState('')
  const [summarySource,  setSummarySource]  = useState<'ai'|'template'>('ai')
  const [summaryAppt,    setSummaryAppt]    = useState<any | null>(null)
  const [copied,         setCopied]         = useState(false)

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
        toast.error('❌ Failed to load patient appointments.')
      } else {
        setAppointments(data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('❌ An unexpected error occurred.')
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

    if (error) {
      toast.error('❌ Failed to update appointment status.')
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
      toast.success(`✅ Appointment marked as ${status}.`)
    }
  }

  // ── AI Summarize ──
  const handleSummarize = async (appt: any) => {
    const patientName = appt.patient_profile?.full_name || 'Unknown Patient'
    setSummaryAppt(appt)
    setSummaryText('')
    setSummarySource('ai')
    setSummaryOpen(true)
    setSummaryLoading(true)

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          appointmentDate: fmtDate(appt.scheduled_at),
          appointmentType: appt.appointment_type,
          specialty:       appt.specialty || 'General',
          status:          appt.status,
          notes:           appt.notes || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error('❌ Network error. Please try again.')
        setSummaryOpen(false)
      } else {
        setSummaryText(data.summary)
        setSummarySource(data.source === 'template' ? 'template' : 'ai')
      }
    } catch (err) {
      toast.error('❌ Network error while generating summary.')
      setSummaryOpen(false)
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleCopy = () => {
    if (!summaryText) return
    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    toast.success('✅ Summary copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
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
            <h1 className="text-3xl font-bold text-[#0F172A] truncate">My Patients</h1>
            <p className="text-[#64748B] mt-1">
              All patients who booked appointments with you.
            </p>
          </div>

          {!mounted ? (
            // ── Skeleton Loading ──
            <>
              {/* Stat Card Skeletons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              {/* List Skeletons */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </>
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
                      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide truncate">{card.label}</span>
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full ${card.bg} flex items-center justify-center`}>
                        {card.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A]">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Filter Pills ── */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Filter className="w-4 h-4 text-[#64748B] flex-shrink-0" />
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
                                   flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow max-w-full"
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
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                {fmtDate(appt.scheduled_at)}
                              </span>
                              <span className="text-xs text-[#64748B] flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {fmtTime(appt.scheduled_at)}
                              </span>
                              <span className="text-xs flex items-center gap-1 text-[#64748B]">
                                {appt.appointment_type === 'Video Call'
                                  ? <Video className="w-3 h-3 flex-shrink-0" />
                                  : <Phone className="w-3 h-3 flex-shrink-0" />}
                                {appt.appointment_type}
                              </span>
                            </div>
                            {appt.specialty && (
                              <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{appt.specialty}</p>
                            )}
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Badge className={cfg.className}>{cfg.label}</Badge>

                          {/* AI Summarize Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSummarize(appt)}
                            className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Summarize
                          </Button>

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

      {/* ── AI Summary Dialog ── */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A]">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Clinical Summary
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              {summaryAppt && (
                <>
                  {summaryAppt.patient_profile?.full_name || 'Unknown Patient'} —{' '}
                  {fmtDate(summaryAppt.scheduled_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {summaryLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-[90%] rounded" />
                <Skeleton className="h-4 w-[80%] rounded" />
                <Skeleton className="h-4 w-[95%] rounded" />
                <Skeleton className="h-4 w-[70%] rounded" />
                <div className="flex items-center gap-2 mt-4 text-sm text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  Generating summary…
                </div>
              </div>
            ) : (
              <>
                {/* Source badge */}
                <div className="flex items-center gap-2 mb-2">
                  {summarySource === 'ai'
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" />AI Generated</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">📋 Template Summary</span>
                  }
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                  {summaryText}
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
