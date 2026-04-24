'use client'

import { useState } from 'react'
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      doctor_name: formData.get('doctor_name') as string,
      specialty: formData.get('specialty') as string,
      scheduled_at: formData.get('scheduled_at') as string,
      appointment_type: formData.get('appointment_type') as 'In-Person' | 'Video Call',
      notes: formData.get('notes') as string,
      status: 'pending' as const,
      doctor_id: preselectedDoctor?.id || undefined, // New: Link to real account
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
            <Label htmlFor="doctor_name">Doctor Name</Label>
            <Input 
              id="doctor_name" 
              name="doctor_name" 
              placeholder="Dr. Smith" 
              defaultValue={preselectedDoctor?.name || ''}
              required 
            />
          </div>

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
