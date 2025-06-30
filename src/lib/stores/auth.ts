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
      // First, try to get existing profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error)
      }

      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            credit_balance: 50, // Default 50 credits for new users
            subscription_tier: 'free' // Default to free tier
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        }

        authStore.set({
          user,
          loading: false,
          profile: newProfile
        })
      } else {
        authStore.set({
          user,
          loading: false,
          profile
        })
      }
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
  },

  async updateSubscription(tier: 'free' | 'creator' | 'creator_pro') {
    if (!this.getCurrentUser()) return false
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          subscription_tier: tier,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .eq('id', this.getCurrentUser()?.id)
        .select()
        .single()
      
      if (error) throw error
      
      // Update the profile in the store
      authStore.update(state => ({
        ...state,
        profile: data
      }))
      
      return true
    } catch (error) {
      console.error('Failed to update subscription:', error)
      return false
    }
  },

  async getCredits(): Promise<number> {
    if (!this.getCurrentUser()) return 0
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credit_balance')
        .eq('id', this.getCurrentUser()?.id)
        .single()
      
      if (error) throw error
      
      return data.credit_balance
    } catch (error) {
      console.error('Failed to get credit balance:', error)
      return 0
    }
  },

  async useCredits(amount: number, description: string): Promise<boolean> {
    if (!this.getCurrentUser()) return false
    
    try {
      // Call the use_credits function
      const { data, error } = await supabase.rpc(
        'use_credits',
        { 
          user_id: this.getCurrentUser()?.id,
          amount: amount
        }
      )
      
      if (error) throw error
      
      if (data) {
        // Record the transaction
        await supabase.rpc(
          'record_credit_transaction',
          {
            user_id: this.getCurrentUser()?.id,
            amount: -amount, // Negative amount for usage
            description: description,
            transaction_type: 'usage'
          }
        )
        
        // Update the profile in the store
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', this.getCurrentUser()?.id)
          .single()
        
        if (profile) {
          authStore.update(state => ({
            ...state,
            profile
          }))
        }
      }
      
      return data
    } catch (error) {
      console.error('Failed to use credits:', error)
      return false
    }
  },

  async addCredits(amount: number, description: string, transactionType: 'purchase' | 'subscription' | 'bonus' | 'refund'): Promise<boolean> {
    if (!this.getCurrentUser()) return false
    
    try {
      // Call the add_credits function
      const { data, error } = await supabase.rpc(
        'add_credits',
        { 
          user_id: this.getCurrentUser()?.id,
          amount: amount
        }
      )
      
      if (error) throw error
      
      if (data) {
        // Record the transaction
        await supabase.rpc(
          'record_credit_transaction',
          {
            user_id: this.getCurrentUser()?.id,
            amount: amount,
            description: description,
            transaction_type: transactionType
          }
        )
        
        // Update the profile in the store
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', this.getCurrentUser()?.id)
          .single()
        
        if (profile) {
          authStore.update(state => ({
            ...state,
            profile
          }))
        }
      }
      
      return data
    } catch (error) {
      console.error('Failed to add credits:', error)
      return false
    }
  },

  async getCreditTransactions(limit: number = 10): Promise<any[]> {
    if (!this.getCurrentUser()) return []
    
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', this.getCurrentUser()?.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Failed to get credit transactions:', error)
      return []
    }
  },

  getCurrentUser(): User | null {
    let currentUser: User | null = null
    authStore.subscribe(state => {
      currentUser = state.user
    })()
    return currentUser
  },

  getCurrentProfile(): any | null {
    let currentProfile: any | null = null
    authStore.subscribe(state => {
      currentProfile = state.profile
    })()
    return currentProfile
  }
}