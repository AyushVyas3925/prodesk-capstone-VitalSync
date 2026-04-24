export type Role = 'patient' | 'doctor'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

// ── Shared ──────────────────────────────────────────────
export type AppointmentStatus = 
  'pending' | 'confirmed' | 'cancelled' | 'completed'

export type AppointmentType = 'In-Person' | 'Video Call'

export interface PatientAppointment {
  id: string
  patient_id: string
  doctor_name: string
  specialty: string
  scheduled_at: string
  appointment_type: AppointmentType
  status: AppointmentStatus
  notes?: string
  created_at: string
}

export interface MedicalHistoryItem {
  id: string
  patient_id: string
  title: string
  doctor_name: string
  event_date: string
  event_type: 'checkup' | 'lab' | 'treatment' | 'surgery' | 'other'
  description?: string
  created_at: string
}

export interface Prescription {
  id: string
  patient_id: string
  medication_name: string
  dosage: string
  frequency: string
  prescribed_at: string
  expires_at?: string
  is_active: boolean
  prescribed_by?: string
  created_at: string
}
