'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { PatientAppointment } from '@/types'

const AppointmentsChartCore = dynamic(
  () => import('./AppointmentsChartCore').then((mod) => mod.AppointmentsChartCore),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm animate-pulse h-[340px] w-full" />
    )
  }
)

export function AppointmentsChart({ appointments }: { appointments: PatientAppointment[] }) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full min-h-[340px]">
      {inView ? (
        <AppointmentsChartCore appointments={appointments} />
      ) : (
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm animate-pulse h-[340px] w-full" />
      )}
    </div>
  )
}
