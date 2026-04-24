'use client'

import { useState, useEffect } from 'react'
import { useAppointments } from '@/hooks/useAppointments'
import { PatientAppointment } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  appointment: PatientAppointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditAppointmentModal({ appointment, open, onOpenChange, onSuccess }: Props) {
  const { updateAppointment } = useAppointments()
  const [loading, setLoading] = useState(false)

  // Bulletproof timezone offset generator
  const toPostgresDate = (dateTimeLocalStr: string) => {
    if (!dateTimeLocalStr) return new Date().toISOString()
    const d = new Date(dateTimeLocalStr)
    return d.toISOString()
  }

  if (!appointment) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: Partial<PatientAppointment> = {
      doctor_name: formData.get('doctor_name') as string,
      specialty: formData.get('specialty') as string,
      scheduled_at: toPostgresDate(formData.get('scheduled_at') as string),
      appointment_type: formData.get('appointment_type') as any,
      status: formData.get('status') as any,
      notes: formData.get('notes') as string,
    }

    try {
      await updateAppointment(appointment.id, data)
      toast.success('Appointment updated successfully!')
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment')
    } finally {
      setLoading(false)
    }
  }

  // Format date for datetime-local input strictly in local time (YYYY-MM-DDThh:mm)
  const formatLocalDatetime = (dateString: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  
  const formattedDate = formatLocalDatetime(appointment.scheduled_at)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F172A]">Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doctor_name">Doctor Name</Label>
            <Input 
              id="doctor_name" 
              name="doctor_name" 
              defaultValue={appointment.doctor_name} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Select name="specialty" defaultValue={appointment.specialty} required>
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cardiology">Cardiology</SelectItem>
                <SelectItem value="Neurology">Neurology</SelectItem>
                <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                <SelectItem value="Dermatology">Dermatology</SelectItem>
                <SelectItem value="General Medicine">General Medicine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date & Time</Label>
            <Input 
              id="scheduled_at" 
              name="scheduled_at" 
              type="datetime-local" 
              defaultValue={formattedDate} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_type">Appointment Type</Label>
            <Select name="appointment_type" defaultValue={appointment.appointment_type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Video Call">Video Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={appointment.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              defaultValue={appointment.notes} 
              placeholder="Any specific concerns..." 
            />
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-[#2563EB] hover:bg-[#1E40AF]" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
