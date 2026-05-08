'use client'

import dynamic from 'next/dynamic'
import { PatientAppointment } from '@/types'

// Dynamically import the heavy Recharts core to reduce initial JS payload and main-thread work.
// This splits the Recharts bundle into a separate chunk that is only loaded when needed.
export const AppointmentsChart = dynamic(
  () => import('./AppointmentsChartCore').then((mod) => mod.AppointmentsChartCore),
  {
    loading: () => (
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm animate-pulse h-[340px] w-full" />
    )
  }
)
