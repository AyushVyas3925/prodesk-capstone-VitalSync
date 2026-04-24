'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { PatientAppointment } from '@/types'

interface Props {
  appointments: PatientAppointment[]
}

export function AppointmentsChart({ appointments }: Props) {
  const chartData = useMemo(() => {
    // Last 6 months
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, 'MMM'),
        fullName: format(date, 'MMMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        count: 0,
      }
    })

    appointments.forEach((apt) => {
      const aptDate = new Date(apt.scheduled_at)
      last6Months.forEach((m) => {
        if (isWithinInterval(aptDate, { start: m.start, end: m.end })) {
          m.count++
        }
      })
    })

    return last6Months.map(({ month, count }) => ({ month, count }))
  }, [appointments])

  return (
    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#0F172A]">Appointments This Year</h3>
        <p className="text-sm text-[#64748B]">Your appointment history by month</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar 
              dataKey="count" 
              fill="#2563EB" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
