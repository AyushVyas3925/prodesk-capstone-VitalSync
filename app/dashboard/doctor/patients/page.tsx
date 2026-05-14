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

type AppointmentFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

function extractDate(isoString: string) {
  return format(new Date(isoString), 'dd MMM yyyy')
}
function extractTime(isoString: string) {
  return format(new Date(isoString), 'hh:mm a')
}
function getTwoInitials(fullName: string) {
  return fullName.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2)
}

const UI_BADGES: Record<string, { display: string; classes: string }> = {
  pending:   { display: 'Pending',   classes: 'bg-yellow-100 text-yellow-700 border-none' },
  confirmed: { display: 'Confirmed', classes: 'bg-blue-100   text-blue-700   border-none' },
  completed: { display: 'Completed', classes: 'bg-green-100  text-green-700  border-none' },
  cancelled: { display: 'Cancelled', classes: 'bg-red-100    text-red-700    border-none' },
}

export default function MyPatientsPage() {
  const doctorAuth = useAuthStore((state) => state.user)
  const supabaseDb = createClient()

  const [patientList, setPatientList] = useState<any[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [activeTab, setActiveTab] = useState<AppointmentFilter>('all')
  const [componentMounted, setComponentMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [aiModalVisible, setAiModalVisible] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [originType, setOriginType] = useState<'ai'|'template'>('ai')
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [hasCopied, setHasCopied] = useState(false)

  const loadPatients = useCallback(async () => {
    if (!doctorAuth?.id) return
    setIsFetchingData(true)
    try {
      const { data, error } = await supabaseDb
        .from('patient_appointments')
        .select(`
          *,
          patient_profile:profiles!patient_id(full_name, role)
        `)
        .eq('doctor_id', doctorAuth.id)
        .order('scheduled_at', { ascending: false })

      if (error) {
        console.warn('Failed patients load:', error.message)
        toast.error('❌ Failed to load patient appointments.')
      } else {
        setPatientList(data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('❌ An unexpected error occurred.')
    } finally {
      setIsFetchingData(false)
    }
  }, [doctorAuth?.id, supabaseDb])

  useEffect(() => {
    setComponentMounted(true)
    loadPatients()

    const dbChannel = supabaseDb
      .channel('doctor_patients_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => loadPatients()
      )
      .subscribe()

    return () => {
      supabaseDb.removeChannel(dbChannel)
    }
  }, [loadPatients, supabaseDb])

  const changeRecordStatus = async (recordId: string, newStatus: string) => {
    const { error } = await supabaseDb
      .from('patient_appointments')
      .update({ status: newStatus })
      .eq('id', recordId)

    if (error) {
      toast.error('❌ Failed to update appointment status.')
    } else {
      setPatientList((currentList) =>
        currentList.map((appt) => (appt.id === recordId ? { ...appt, status: newStatus } : appt))
      )
      toast.success(`✅ Appointment marked as ${newStatus}.`)
    }
  }

  const triggerSummarize = async (record: any) => {
    const pName = record.patient_profile?.full_name || 'Unknown Patient'
    setSelectedRecord(record)
    setClinicalNotes('')
    setOriginType('ai')
    setAiModalVisible(true)
    setAiProcessing(true)

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: pName,
          appointmentDate: extractDate(record.scheduled_at),
          appointmentType: record.appointment_type,
          specialty:       record.specialty || 'General',
          status:          record.status,
          notes:           record.notes || null,
        }),
      })

      const payload = await response.json()
      if (!response.ok || payload.error) {
        toast.error('❌ Network error. Please try again.')
        setAiModalVisible(false)
      } else {
        setClinicalNotes(payload.summary)
        setOriginType(payload.source === 'template' ? 'template' : 'ai')
      }
    } catch (err) {
      toast.error('❌ Network error while generating summary.')
      setAiModalVisible(false)
    } finally {
      setAiProcessing(false)
    }
  }

  const duplicateToClipboard = () => {
    if (!clinicalNotes) return
    navigator.clipboard.writeText(clinicalNotes)
    setHasCopied(true)
    toast.success('✅ Summary copied to clipboard!')
    setTimeout(() => setHasCopied(false), 2000)
  }

  const displayedList = activeTab === 'all'
    ? patientList
    : patientList.filter((item) => item.status === activeTab)

  const groupSizes = {
    all:       patientList.length,
    pending:   patientList.filter((item) => item.status === 'pending').length,
    confirmed: patientList.filter((item) => item.status === 'confirmed').length,
    completed: patientList.filter((item) => item.status === 'completed').length,
    cancelled: patientList.filter((item) => item.status === 'cancelled').length,
  }

  const TAB_OPTIONS: { key: AppointmentFilter; display: string }[] = [
    { key: 'all',       display: 'All' },
    { key: 'pending',   display: 'Pending' },
    { key: 'confirmed', display: 'Confirmed' },
    { key: 'completed', display: 'Completed' },
    { key: 'cancelled', display: 'Cancelled' },
  ]

  return (
    <main>
      <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        role="doctor"
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-60">
        <Navbar
          role="doctor"
          onMobileMenuToggle={() => setSidebarOpen(true)}
        />

        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A] truncate">My Patients</h1>
            <p className="text-[#64748B] mt-1">
              All patients who booked appointments with you.
            </p>
          </div>

          {!componentMounted ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((idx) => (
                  <Skeleton key={idx} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((idx) => (
                  <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { text: 'Total Booked',  num: groupSizes.all,       ico: <Users className="w-5 h-5 text-[#2563EB]" />,        clr: 'bg-[#EFF6FF]' },
                  { text: 'Pending',       num: groupSizes.pending,   ico: <Clock className="w-5 h-5 text-[#F59E0B]" />,        clr: 'bg-[#FEF3C7]' },
                  { text: 'Confirmed',     num: groupSizes.confirmed, ico: <Calendar className="w-5 h-5 text-[#2563EB]" />,     clr: 'bg-[#EFF6FF]' },
                  { text: 'Completed',     num: groupSizes.completed, ico: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, clr: 'bg-[#F0FDF4]' },
                ].map((statBox) => (
                  <div key={statBox.text} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide truncate">{statBox.text}</span>
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full ${statBox.clr} flex items-center justify-center`}>
                        {statBox.ico}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A]">{statBox.num}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Filter className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                {TAB_OPTIONS.map(({ key, display }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTab === key
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB]'
                    }`}
                  >
                    {display}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === key ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {groupSizes[key]}
                    </span>
                  </button>
                ))}
              </div>

              {isFetchingData ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((idx) => (
                    <Skeleton key={idx} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : displayedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-[#E2E8F0]">
                  <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-[#2563EB] opacity-40" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">No patients found</h2>
                  <p className="text-[#64748B] mt-1 text-sm max-w-xs">
                    {activeTab === 'all'
                      ? 'No patients have booked with you yet. Make sure your profile is set to Online.'
                      : `No ${activeTab} appointments right now.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedList.map((recordItem) => {
                    const personName = recordItem.patient_profile?.full_name || 'Unknown Patient'
                    const configData = UI_BADGES[recordItem.status] || UI_BADGES['pending']

                    return (
                      <div
                        key={recordItem.id}
                        className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 lg:p-5
                                   flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow max-w-full"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-11 h-11 flex-shrink-0">
                            <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] font-semibold">
                              {getTwoInitials(personName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0F172A] truncate">{personName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-[#64748B] flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                {extractDate(recordItem.scheduled_at)}
                              </span>
                              <span className="text-xs text-[#64748B] flex items-center gap-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {extractTime(recordItem.scheduled_at)}
                              </span>
                              <span className="text-xs flex items-center gap-1 text-[#64748B]">
                                {recordItem.appointment_type === 'Video Call'
                                  ? <Video className="w-3 h-3 flex-shrink-0" />
                                  : <Phone className="w-3 h-3 flex-shrink-0" />}
                                {recordItem.appointment_type}
                              </span>
                            </div>
                            {recordItem.specialty && (
                              <p className="text-xs text-[#64748B] mt-0.5 truncate">{recordItem.specialty}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Badge className={configData.classes}>{configData.display}</Badge>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerSummarize(recordItem)}
                            className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Summarize
                          </Button>

                          {recordItem.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => changeRecordStatus(recordItem.id, 'confirmed')}
                              className="h-7 text-xs bg-[#2563EB] hover:bg-[#1E40AF]"
                            >
                              Confirm
                            </Button>
                          )}
                          {recordItem.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => changeRecordStatus(recordItem.id, 'completed')}
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
        </div>
      </div>

      <Dialog open={aiModalVisible} onOpenChange={setAiModalVisible}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A]">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Clinical Summary
            </DialogTitle>
            <DialogDescription className="text-[#64748B]">
              {selectedRecord && (
                <>
                  {selectedRecord.patient_profile?.full_name || 'Unknown Patient'} —{' '}
                  {extractDate(selectedRecord.scheduled_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            {aiProcessing ? (
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
                <div className="flex items-center gap-2 mb-2">
                  {originType === 'ai'
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" />AI Generated</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">📋 Template Summary</span>
                  }
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                  {clinicalNotes}
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={duplicateToClipboard}
                    className="gap-1.5 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {hasCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </main>
  )
}
