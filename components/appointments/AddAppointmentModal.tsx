'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppointments } from '@/hooks/useAppointments'
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
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedDoctor?: { id: string, name: string } | null
}

export function AddAppointmentModal({ open, onOpenChange, preselectedDoctor }: Props) {
  const { addAppointment } = useAppointments()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<{id: string, full_name: string, specialty: string}[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, specialty')
        .eq('role', 'doctor')
      if (data) setDoctors(data)
    }
    fetchDoctors()
  }, [open, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const selectedDoctorId = formData.get('doctor_id') as string
    // If preselectedDoctor is used, and the user didn't change it, it might just use preselectedDoctor.id
    const finalDoctorId = selectedDoctorId || preselectedDoctor?.id
    
    // Find doctor name from the fetched list or fallback to preselected
    const foundDoc = doctors.find(d => d.id === finalDoctorId)
    const doctor_name = foundDoc ? `Dr. ${foundDoc.full_name}` : preselectedDoctor?.name || 'Unknown Doctor'
    
    // If we know the doctor's specialty, use it, else use the form's specialty
    const formSpecialty = formData.get('specialty') as string
    const specialty = foundDoc?.specialty || formSpecialty || 'General Medicine'

    const data = {
      doctor_name,
      specialty,
      scheduled_at: formData.get('scheduled_at') as string,
      appointment_type: formData.get('appointment_type') as 'In-Person' | 'Video Call',
      notes: formData.get('notes') as string,
      status: 'pending' as const,
      doctor_id: finalDoctorId, // Always links to real account now
    }

    try {
      await addAppointment(data)
      toast.success('Appointment booked successfully!')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F172A]">Book Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doctor_id">Doctor</Label>
            {preselectedDoctor ? (
              <Input 
                id="doctor_id_display" 
                value={preselectedDoctor.name} 
                readOnly 
                className="bg-gray-50"
              />
            ) : (
              <Select name="doctor_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      Dr. {doc.full_name} {doc.specialty ? `— ${doc.specialty}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* hidden input so FormData can still grab it if preselected */}
            {preselectedDoctor && <input type="hidden" name="doctor_id" value={preselectedDoctor.id} />}
          </div>

          {/* Hide specialty if we already know it from the doctor */}
          {!preselectedDoctor && (
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select name="specialty" required>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date & Time</Label>
            <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_type">Appointment Type</Label>
            <Select name="appointment_type" defaultValue="In-Person">
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Any specific concerns..." />
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-[#2563EB] hover:bg-[#1E40AF]" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
