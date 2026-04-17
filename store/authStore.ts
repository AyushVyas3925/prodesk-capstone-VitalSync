import { create } from 'zustand'
import { User, Role } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setLoading: (loading: boolean) => void
  setUser: (user: User | null) => void
  setRole: (role: Role) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  setRole: (role) => set((state) => ({
    user: state.user ? { ...state.user, role } : null
  })),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}))
