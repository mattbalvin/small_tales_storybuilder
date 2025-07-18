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
          credit_balance: number
          subscription_tier: 'free' | 'creator' | 'creator_pro'
          subscription_expires_at: string | null
          last_credits_reset_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'author' | 'reader'
          created_at?: string
          updated_at?: string
          credit_balance?: number
          subscription_tier?: 'free' | 'creator' | 'creator_pro'
          subscription_expires_at?: string | null
          last_credits_reset_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'author' | 'reader'
          created_at?: string
          updated_at?: string
          credit_balance?: number
          subscription_tier?: 'free' | 'creator' | 'creator_pro'
          subscription_expires_at?: string | null
          last_credits_reset_at?: string | null
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          description: string
          cover_image: string | null
          age_range: string
          orientation: 'landscape' | 'portrait'
          status: 'draft' | 'published' | 'archived'
          settings: any
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          cover_image?: string | null
          age_range?: string
          orientation?: 'landscape' | 'portrait'
          status?: 'draft' | 'published' | 'archived'
          settings?: any
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          cover_image?: string | null
          age_range?: string
          orientation?: 'landscape' | 'portrait'
          status?: 'draft' | 'published' | 'archived'
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
          content: {
            elements: Array<{
              id: string
              type: 'text' | 'image' | 'audio'
              // Shared content properties
              properties: {
                // Text element properties
                text?: string
                fontSize?: number
                color?: string
                backgroundColor?: string
                backgroundAlpha?: number
                lineHeight?: number
                narrationId?: string
                narrationData?: any
                narrationSequence?: number
                inMainNarration?: boolean
                narrationHighlightColor?: string
                narrationHighlightGlow?: boolean
                // Image element properties
                src?: string
                alt?: string
                opacity?: number
                scale?: number
                // Audio element properties
                autoplay?: boolean
                volume?: number
              }
              // Layout-specific properties (only for text and image elements)
              layouts?: {
                landscape: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex: number
                  hidden: boolean
                }
                portrait: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex: number
                  hidden: boolean
                }
              }
              animation?: any
            }>
            // Page-level audio elements (not positioned)
            audioElements?: Array<{
              id: string
              type: 'audio'
              properties: {
                src: string
                volume: number // 0-100
                isIdleLoop: boolean
                actionVolume?: number // 0-100, only if isIdleLoop is true
                playbackMode?: 'random' | 'trigger' // only if isIdleLoop is false
                minDelay?: number // seconds, only if playbackMode is 'random'
                maxDelay?: number // seconds, only if playbackMode is 'random'
                triggerName?: string // only if playbackMode is 'trigger'
              }
            }>
            background?: any
            animation?: any
          }
          created_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          page_number: number
          content: {
            elements?: Array<{
              id: string
              type: 'text' | 'image' | 'audio'
              properties: any
              layouts?: {
                landscape: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex?: number
                  hidden?: boolean
                }
                portrait: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex?: number
                  hidden?: boolean
                }
              }
              animation?: any
            }>
            audioElements?: Array<{
              id: string
              type: 'audio'
              properties: {
                src: string
                volume?: number
                isIdleLoop?: boolean
                actionVolume?: number
                playbackMode?: 'random' | 'trigger'
                minDelay?: number
                maxDelay?: number
                triggerName?: string
              }
            }>
            background?: any
            animation?: any
          }
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          page_number?: number
          content?: {
            elements?: Array<{
              id: string
              type: 'text' | 'image' | 'audio'
              properties: any
              layouts?: {
                landscape: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex?: number
                  hidden?: boolean
                }
                portrait: {
                  x: number
                  y: number
                  width: number
                  height: number
                  zIndex?: number
                  hidden?: boolean
                }
              }
              animation?: any
            }>
            audioElements?: Array<{
              id: string
              type: 'audio'
              properties: {
                src: string
                volume?: number
                isIdleLoop?: boolean
                actionVolume?: number
                playbackMode?: 'random' | 'trigger'
                minDelay?: number
                maxDelay?: number
                triggerName?: string
              }
            }>
            background?: any
            animation?: any
          }
          created_at?: string
        }
      }
      story_collaborators: {
        Row: {
          id: string
          story_id: string
          user_id: string
          permission_level: 'owner' | 'editor' | 'viewer'
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          permission_level?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          permission_level?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
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
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          transaction_type: 'purchase' | 'subscription' | 'usage' | 'bonus' | 'refund'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          transaction_type: 'purchase' | 'subscription' | 'usage' | 'bonus' | 'refund'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          transaction_type?: 'purchase' | 'subscription' | 'usage' | 'bonus' | 'refund'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      use_credits: {
        Args: {
          user_id: string
          amount: number
        }
        Returns: boolean
      }
      add_credits: {
        Args: {
          user_id: string
          amount: number
        }
        Returns: boolean
      }
      record_credit_transaction: {
        Args: {
          user_id: string
          amount: number
          description: string
          transaction_type: 'purchase' | 'subscription' | 'usage' | 'bonus' | 'refund'
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}