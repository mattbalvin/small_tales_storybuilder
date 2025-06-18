export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'author' | 'reader'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'author' | 'reader'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'author' | 'reader'
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          description: string
          cover_image: string
          age_range: string
          orientation: 'landscape' | 'portrait'
          settings: any
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          cover_image: string
          age_range?: string
          orientation?: 'landscape' | 'portrait'
          settings?: any
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          cover_image?: string
          age_range?: string
          orientation?: 'landscape' | 'portrait'
          settings?: any
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      story_pages: {
        Row: {
          id: string
          story_id: string | null
          page_number: number
          background: string
          text: string
          narration: string | null
          interactions: any
          auto_advance: boolean
          duration: number | null
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          page_number: number
          background: string
          text: string
          narration?: string | null
          interactions?: any
          auto_advance?: boolean
          duration?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          page_number?: number
          background?: string
          text?: string
          narration?: string | null
          interactions?: any
          auto_advance?: boolean
          duration?: number | null
          created_at?: string
        }
      }
      media_assets: {
        Row: {
          id: string
          user_id: string
          filename: string
          url: string
          type: 'image' | 'audio' | 'video'
          size: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          url: string
          type: 'image' | 'audio' | 'video'
          size: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          url?: string
          type?: 'image' | 'audio' | 'video'
          size?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          story_id: string
          event_type: string
          event_data: any
          user_session: string | null
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          event_type: string
          event_data: any
          user_session?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          event_type?: string
          event_data?: any
          user_session?: string | null
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