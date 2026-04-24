'use client'

import { useState } from 'react'
import { useAppointments } from '@/hooks/useAppointments'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  appointmentId: string | null
  doctorName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteConfirmDialog({ appointmentId, doctorName, open, onOpenChange, onSuccess }: Props) {
  const { deleteAppointment } = useAppointments()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!appointmentId) return
    setLoading(true)
    try {
      await deleteAppointment(appointmentId)
      toast.success('Appointment deleted')
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this appointment with{' '}
            <span className="font-semibold text-[#0F172A]">{doctorName}</span>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
