'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart, Home, Users, CalendarDays, FileText,
  Pill, Settings, LogOut, Loader2, X
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
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const supabase = createClient()
  
  const [isAvailable, setIsAvailable] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isSidebarOpen = mobileOpen ?? false

  const closeSidebar = () => {
    if (onClose) onClose()
  }

  useEffect(() => {
    setMounted(true)
    if (role === 'doctor' && user?.id) {
      const getStatus = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_available')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setIsAvailable(data.is_available)
        }
      }
      getStatus()
    }
  }, [role, user?.id, supabase])

  const toggleAvailability = async (checked: boolean) => {
    if (!user?.id || syncing) return
    setSyncing(true)
    setIsAvailable(checked)

    const { error } = await supabase
      .from('profiles')
      .update({ is_available: checked })
      .eq('id', user.id)
    
    if (error) {
      setIsAvailable(!checked)
      toast.error('Failed to update status')
    } else {
      toast.success(`Status updated: ${checked ? 'Online' : 'Offline'}`)
    }
    setSyncing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  const navItems = role === 'patient' 
    ? [
        { name: 'Dashboard',      href: '/dashboard/patient', icon: Home },
        { name: 'Appointments',   href: '/dashboard/patient/appointments', icon: CalendarDays },
        { name: 'Medical History', href: '#',                  icon: FileText },
        { name: 'Prescriptions',  href: '#',                  icon: Pill },
        { name: 'Settings',       href: '#',                  icon: Settings },
      ]
    : [
        { name: 'Dashboard',      href: '/dashboard/doctor',  icon: Home },
        { name: 'My Patients',    href: '/dashboard/doctor/patients',  icon: Users },
        { name: 'Schedule',       href: '#',                  icon: CalendarDays },
        { name: 'Prescriptions',  href: '#',                  icon: FileText },
        { name: 'Settings',       href: '#',                  icon: Settings },
      ];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      {/* ── Mobile Drawer (Nuclear Option: Style zIndex) ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 lg:hidden" style={{ zIndex: 100000 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSidebar} />
          
          <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-lg font-bold text-[#0F172A]">VitalSync</span>
              </div>
              <button onClick={closeSidebar} className="p-2 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 pt-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-[#E2E8F0] space-y-3">
              {mounted && role === 'doctor' && (
                <button 
                  onClick={() => toggleAvailability(!isAvailable)}
                  disabled={syncing}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 rounded-xl border",
                    isAvailable ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#F8FAFC] border-[#E2E8F0]"
                  )}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Status</span>
                    <span className={cn("text-xs font-bold", isAvailable ? "text-[#059669]" : "text-[#64748B]")}>
                      {isAvailable ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <Switch checked={isAvailable} className="pointer-events-none" />
                </button>
              )}
              
              <Button onClick={handleLogout} variant="outline" className="w-full text-[#64748B] hover:text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col bg-white border-r border-[#E2E8F0] z-20">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-5 border-b border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A]">VitalSync</span>
          </div>

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
                    isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-[#2563EB] text-white text-sm font-semibold">
                  {mounted ? initials : '...'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {mounted ? (role === 'doctor' ? `Dr. ${user?.name || 'Doctor'}` : (user?.name || 'Patient')) : 'Loading...'}
                </p>
                <Badge className={role === 'doctor' ? 'bg-[#F0FDF4] text-[#065F46]' : 'bg-[#EFF6FF] text-[#2563EB]'}>
                  {role === 'doctor' ? 'Doctor' : 'Patient'}
                </Badge>
              </div>
            </div>

            {mounted && role === 'doctor' && (
              <button 
                onClick={() => toggleAvailability(!isAvailable)}
                disabled={syncing}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-all active:scale-95",
                  isAvailable ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#F8FAFC] border-[#E2E8F0]"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold tracking-wider text-[#64748B]">STATUS</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isAvailable ? <span className="text-xs font-bold text-[#059669]">Online</span> : <span className="text-xs font-bold text-[#64748B]">Offline</span>}
                  </div>
                </div>
                <Switch checked={isAvailable} className="pointer-events-none" />
              </button>
            )}

            <Button onClick={handleLogout} variant="outline" size="sm" className="w-full text-[#64748B] hover:text-red-500">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-2 z-[40]">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 text-xs font-medium py-1',
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
