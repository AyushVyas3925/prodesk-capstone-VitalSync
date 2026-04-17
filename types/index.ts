export type Role = 'patient' | 'doctor' | null

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

// ── Shared ──────────────────────────────────────────────
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// ── Doctor-side view of an appointment ──────────────────
export interface DoctorAppointment {
  id: string
  patient_name: string
  scheduled_at: string          // ISO datetime
  appointment_type: 'In-Person' | 'Video Call'
  room: string                  // e.g. "Room 3" | "Online"
  status: 'completed' | 'upcoming' | 'missed'
  patient_initials?: string
}

// ── Patient-side view of an appointment ─────────────────
export interface PatientAppointment {
  id: string
  doctor_name: string
  specialty: string
  scheduled_at: string          // ISO datetime
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  doctor_initials?: string
}

// ── Medical History ──────────────────────────────────────
export interface MedicalHistoryItem {
  id: string
  event_date: string            // ISO date (YYYY-MM-DD)
  title: string
  doctor_name: string
  event_type: 'checkup' | 'lab' | 'treatment' | 'surgery' | 'other'
}

// ── Prescription ──────────────────────────────────────────
export interface Prescription {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  prescribed_at: string
  expires_at?: string
  is_active: boolean
}
