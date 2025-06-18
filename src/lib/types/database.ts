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
          description: string | null
          author_id: string
          cover_image_url: string | null
          status: 'draft' | 'published' | 'archived'
          orientation: 'landscape' | 'portrait' | 'adaptive'
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          author_id: string
          cover_image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          orientation?: 'landscape' | 'portrait' | 'adaptive'
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          author_id?: string
          cover_image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          orientation?: 'landscape' | 'portrait' | 'adaptive'
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      story_pages: {
        Row: {
          id: string
          story_id: string
          page_number: number
          content: any
          audio_url: string | null
          duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          page_number: number
          content: any
          audio_url?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          page_number?: number
          content?: any
          audio_url?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
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