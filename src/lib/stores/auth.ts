import { writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  profile: any | null
}

const initialState: AuthState = {
  user: null,
  loading: true,
  profile: null
}

export const authStore = writable<AuthState>(initialState)

export const authService = {
  async initialize() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      await this.loadUserProfile(session.user)
    } else {
      authStore.update(state => ({ ...state, loading: false }))
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.loadUserProfile(session.user)
      } else {
        authStore.set({ user: null, loading: false, profile: null })
      }
    })
  },

  async loadUserProfile(user: User) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
      }

      authStore.set({
        user,
        loading: false,
        profile
      })
    } catch (error) {
      console.error('Failed to load user profile:', error)
      authStore.set({
        user,
        loading: false,
        profile: null
      })
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
}