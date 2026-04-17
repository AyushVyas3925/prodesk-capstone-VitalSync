'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Eye, EyeOff, Loader2, Heart, Mail, Lock,
  Users, Stethoscope, Clock, Star
} from 'lucide-react'
import Link from 'next/link'
import { Role } from '@/types'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (data.user) {
        const storedRole = data.user.user_metadata?.role as Role
        
        // Validation: Role selected must match stored role (if it exists)
        if (storedRole && storedRole !== role) {
          setError(`This account is registered as a ${storedRole}. Please select the correctly role above or use the appropriate login.`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        const finalRole = storedRole || role // Fallback to selected role if metadata is missing
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || 'User',
          role: finalRole,
        })
        router.push(`/dashboard/${finalRole}`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left → Form ── */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-[#0F172A]">VitalSync</span>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Welcome back 👋</h1>
              <p className="text-[#64748B]">Sign in to your VitalSync account</p>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${role === 'patient'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
              >
                <Users className="w-4 h-4" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${role === 'doctor'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <Input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F172A]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 pr-11 h-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm text-[#64748B] cursor-pointer">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-[#2563EB] hover:underline font-medium">
                  Forgot password?
                </a>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-lg shadow-sm transition-all"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>



            <p className="text-center text-sm text-[#64748B]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#2563EB] hover:underline font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right → Hero ── */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#1E40AF] to-[#2563EB] p-12 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-sm w-full">
          {/* Stat Cards */}
          {[
            { icon: <Stethoscope className="w-6 h-6 text-white" />, value: '2,400+', label: 'Doctors Available' },
            { icon: <Star className="w-6 h-6 text-white" fill="white" />, value: '98%', label: 'Patient Satisfaction' },
            { icon: <Clock className="w-6 h-6 text-white" />, value: '24/7', label: 'Support Available' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl hover:scale-105 transition-transform duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-white/80 text-sm">{s.label}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center pt-4">
            <h2 className="text-2xl font-bold text-white mb-2">VitalSync</h2>
            <p className="text-white/90 text-lg">Your Health, Synced.</p>
          </div>
        </div>

        {/* Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  )
}
