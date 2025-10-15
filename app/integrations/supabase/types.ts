
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      outfit_generations: {
        Row: {
          id: string
          user_id: string | null
          original_image_url: string
          generated_image_url: string
          style: string
          prompt: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          original_image_url: string
          generated_image_url: string
          style: string
          prompt: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          original_image_url?: string
          generated_image_url?: string
          style?: string
          prompt?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database['public']

export type Tables<
  TableName extends keyof DefaultSchema['Tables'],
  Operation extends 'Row' | 'Insert' | 'Update' = 'Row'
> = DefaultSchema['Tables'][TableName][Operation]
