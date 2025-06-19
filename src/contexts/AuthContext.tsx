import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        toast.error('Authentication error. Please check your connection.')
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        // Initialize user usage record
        await initializeUserUsage(session.user.id)
        toast.success('Successfully signed in!')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeUserUsage = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_usage')
        .upsert({
          user_id: userId,
          pdf_uploads_today: 0,
          questions_asked_today: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error initializing user usage:', error)
      }
    } catch (error) {
      console.error('Error in initializeUserUsage:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Attempting to sign up user:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        throw error
      }

      console.log('Signup successful:', data)
      toast.success('Account created successfully!')
    } catch (error: any) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }

      console.log('Sign in successful:', data)
      // Don't show success toast here, it will be shown in the auth state change handler
    } catch (error: any) {
      console.error('Sign in failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      toast.success('Signed out successfully!')
    } catch (error: any) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}