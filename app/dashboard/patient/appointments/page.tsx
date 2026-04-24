'use client'

import { useState } from 'react'
import { useAppointments } from '@/hooks/useAppointments'
import { Sidebar } from '@/components/shared/Sidebar'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal'
import { EditAppointmentModal } from '@/components/appointments/EditAppointmentModal'
import { DeleteConfirmDialog } from '@/components/appointments/DeleteConfirmDialog'
import { PatientAppointment } from '@/types'
import { format } from 'date-fns'

export default function AppointmentsPage() {
  const { appointments, loading, refetch } = useAppointments()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<{id: string, name: string} | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none capitalize">{status}</Badge>
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none capitalize">{status}</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none capitalize">{status}</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none capitalize">{status}</Badge>
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        role="patient" 
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      
      <div className="lg:pl-60">
        <Navbar 
          role="patient"
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        
        <main className="p-4 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A]">My Appointments</h1>
              <p className="text-[#64748B] mt-1">Manage your upcoming and past medical consultations.</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1E40AF] shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-[#2563EB] opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A]">No appointments yet</h3>
                <p className="text-[#64748B] mb-6 max-w-xs">
                  Schedule your first consultation with our specialist doctors today.
                </p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]"
                >
                  Book your first appointment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#F8FAFC]">
                  <TableRow>
                    <TableHead className="font-semibold text-[#64748B]">Doctor</TableHead>
                    <TableHead className="font-semibold text-[#64748B]">Specialty</TableHead>
                    <TableHead className="font-semibold text-[#64748B]">Date & Time</TableHead>
                    <TableHead className="font-semibold text-[#64748B]">Type</TableHead>
                    <TableHead className="font-semibold text-[#64748B]">Status</TableHead>
                    <TableHead className="text-right font-semibold text-[#64748B]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appt) => (
                    <TableRow key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <TableCell className="font-medium text-[#0F172A]">{appt.doctor_name}</TableCell>
                      <TableCell className="text-[#64748B]">{appt.specialty}</TableCell>
                      <TableCell className="text-[#0F172A]">
                        {format(new Date(appt.scheduled_at), 'dd MMM yyyy, p')}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm px-2 py-1 bg-[#F1F5F9] rounded text-[#475569]">
                          {appt.appointment_type}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditingAppointment(appt)}
                            className="text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeletingAppointment({id: appt.id, name: appt.doctor_name})}
                            className="text-[#64748B] hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>

      <AddAppointmentModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={refetch}
      />
      
      <EditAppointmentModal 
        appointment={editingAppointment} 
        open={!!editingAppointment} 
        onOpenChange={(open) => !open && setEditingAppointment(null)} 
        onSuccess={refetch}
      />
      
      <DeleteConfirmDialog 
        appointmentId={deletingAppointment?.id || null} 
        doctorName={deletingAppointment?.name || null} 
        open={!!deletingAppointment} 
        onOpenChange={(open) => !open && setDeletingAppointment(null)} 
        onSuccess={refetch}
      />
    </div>
  )
}
