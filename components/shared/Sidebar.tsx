'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart, Home, Users, CalendarDays, FileText,
  Pill, Settings, LogOut
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Role } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

interface SidebarProps {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const supabase = createClient()
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (role === 'doctor' && user?.id) {
      const getStatus = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('is_available')
          .eq('id', user.id)
          .single()
        if (data) setIsAvailable(data.is_available)
      }
      getStatus()
    }
  }, [role, user?.id, supabase])

  const toggleAvailability = async (checked: boolean) => {
    if (!user?.id) return
    setIsAvailable(checked)
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: checked })
      .eq('id', user.id)
    
    if (error) {
      setIsAvailable(!checked)
      toast.error('Failed to update status')
    } else {
      toast.success(`You are now ${checked ? 'Online' : 'Offline'}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  const patientNav = [
    { name: 'Dashboard',      href: '/dashboard/patient', icon: Home },
    { name: 'Appointments',   href: '/dashboard/patient/appointments', icon: CalendarDays },
    { name: 'Medical History', href: '#',                  icon: FileText },
    { name: 'Prescriptions',  href: '#',                  icon: Pill },
    { name: 'Settings',       href: '#',                  icon: Settings },
  ]

  const doctorNav = [
    { name: 'Dashboard',      href: '/dashboard/doctor',  icon: Home },
    { name: 'My Patients',    href: '#',                  icon: Users },
    { name: 'Schedule',       href: '#',                  icon: CalendarDays },
    { name: 'Prescriptions',  href: '#',                  icon: FileText },
    { name: 'Settings',       href: '#',                  icon: Settings },
  ]

  const navItems = role === 'patient' ? patientNav : doctorNav

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col bg-white border-r border-[#E2E8F0] z-20">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A]">VitalSync</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 pt-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile + Logout */}
          <div className="p-4 border-t border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-[#2563EB] text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {role === 'doctor' ? `Dr. ${user?.name || 'Doctor'}` : (user?.name || 'Patient')}
                </p>
                <Badge
                  className={cn(
                    'text-xs mt-0.5',
                    role === 'doctor'
                      ? 'bg-[#F0FDF4] text-[#065F46] hover:bg-[#F0FDF4]'
                      : 'bg-[#EFF6FF] text-[#2563EB]   hover:bg-[#EFF6FF]'
                  )}
                >
                  {role === 'doctor' ? 'Doctor' : 'Patient'}
                </Badge>
              </div>
            </div>

            {role === 'doctor' && (
              <div className="px-2 pb-2">
                <button 
                  onClick={() => toggleAvailability(!isAvailable)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-all shadow-sm active:scale-95",
                    isAvailable 
                      ? "bg-[#F0FDF4] border-[#BBF7D0] hover:bg-[#DCFCE7]" 
                      : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Current Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isAvailable ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                          </span>
                          <span className="text-xs font-bold text-[#059669]">Online</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                          <span className="text-xs font-bold text-[#64748B]">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Switch 
                    checked={isAvailable} 
                    className="data-[state=checked]:bg-[#10B981] pointer-events-none"
                  />
                </button>
              </div>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-2 z-30">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 text-xs font-medium transition-colors py-1',
                  isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name === 'Medical History' ? 'History' : item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
