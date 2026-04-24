'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2, Heart, Mail, Lock, Eye, EyeOff,
  Users, Stethoscope, Clock, Star, UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { Role } from '@/types'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })

      if (authError) throw authError

      if (data.user) {
        // ── Explicitly save profile so full_name is NEVER null/email ──
        await supabase.from('profiles').upsert({
          id:           data.user.id,
          full_name:    fullName,
          role:         role,
          is_available: false,
        }, { onConflict: 'id' })

        setSuccess(true)
        setTimeout(() => router.push('/login?registered=true'), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
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
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Create account 🏥</h1>
              <p className="text-[#64748B]">Join VitalSync and manage your health</p>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  role === 'patient'
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
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  role === 'doctor'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor
              </button>
            </div>

            {success ? (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                ✅ Account created! Check your email to confirm, then sign in.
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-11 h-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <Input
                      id="email"
                      type="email"
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
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-[#64748B]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#2563EB] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right → Hero ── */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#1E40AF] to-[#2563EB] p-12 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-sm w-full">
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

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  )
}
