'use client'

import { Bell, Search, Menu } from 'lucide-react'
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
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Burger — min 44×44px touch target */}
          <button
            onClick={(e) => {
              e.preventDefault()
              window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: true }))
              if (onMobileMenuToggle) onMobileMenuToggle()
            }}
            className="lg:hidden flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center
                       -ml-2 text-[#0F172A] bg-transparent hover:bg-slate-100 rounded-xl 
                       transition-colors active:scale-90"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Greeting — truncates on small screens */}
          {role === 'doctor' ? (
            <h1 className="text-base lg:text-xl font-semibold text-[#0F172A] truncate">
              Today&apos;s Overview
            </h1>
          ) : (
            <h1 className="text-base lg:text-xl font-semibold text-[#0F172A] truncate">
              {greeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search — hidden on mobile, visible md+ */}
          {role === 'patient' && (
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-56 lg:w-64 h-9 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg text-sm"
              />
            </div>
          )}

          {/* Notifications */}
          <button className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>

          {/* Avatar */}
          <Avatar className="hidden sm:flex w-9 h-9 flex-shrink-0">
            <AvatarFallback className="bg-[#2563EB] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
