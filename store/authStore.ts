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
  setLoading: (isBusy) => set({ isLoading: isBusy }),
  setUser: (newUser) => set({ 
    user: newUser, 
    isAuthenticated: !!newUser,
    isLoading: false 
  }),
  setRole: (newRole) => set((state) => ({
    user: state.user ? { ...state.user, role: newRole } : null
  })),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}))
