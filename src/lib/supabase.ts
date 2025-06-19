import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      user_usage: {
        Row: {
          id: string
          user_id: string
          pdf_uploads_today: number
          questions_asked_today: number
          last_reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pdf_uploads_today?: number
          questions_asked_today?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pdf_uploads_today?: number
          questions_asked_today?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          summary: string
          upload_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          summary: string
          upload_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          summary?: string
          upload_date?: string
          created_at?: string
        }
      }
    }
  }
}