'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'

interface NavbarProps {
  role: 'doctor' | 'patient'
  isAvailable?: boolean
  onToggleAvailability?: (val: boolean) => void
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

export function Navbar({
  role,
  isAvailable = true,
  onToggleAvailability,
  onMobileMenuToggle,
}: NavbarProps) {
  const user = useAuthStore((s) => s.user)

  const greeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good Morning'
    if (hr < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (onMobileMenuToggle) onMobileMenuToggle()
            }}
            className="lg:hidden p-3 -ml-3 text-[#0F172A] hover:bg-slate-100 rounded-full transition-all active:scale-90 z-[100]"
            aria-label="Open menu"
          >
            <Menu className="w-7 h-7" />
          </button>

          {role === 'doctor' ? (
            <h1 className="text-xl font-semibold text-[#0F172A]">Today&apos;s Overview</h1>
          ) : (
            <h1 className="text-xl font-semibold text-[#0F172A]">
              {greeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Patient: Search Bar */}
          {role === 'patient' && (
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-64 h-9 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg text-sm"
              />
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>

          {/* Avatar */}
          <Avatar className="hidden md:flex w-9 h-9">
            <AvatarFallback className="bg-[#2563EB] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
