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
      users: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          is_guest: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string
          avatar_url?: string | null
          is_guest?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          is_guest?: boolean
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          code: string
          house_rules: Json
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          house_rules?: Json
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          house_rules?: Json
          status?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          room_id: string | null
          started_at: string
          ended_at: string | null
          winner_id: string | null
          placements: Json
          house_rules: Json
        }
        Insert: {
          id?: string
          room_id?: string | null
          started_at?: string
          ended_at?: string | null
          winner_id?: string | null
          placements?: Json
          house_rules?: Json
        }
        Update: {
          id?: string
          room_id?: string | null
          started_at?: string
          ended_at?: string | null
          winner_id?: string | null
          placements?: Json
          house_rules?: Json
        }
      }
      match_players: {
        Row: {
          match_id: string
          user_id: string
          color: string
          final_position: number | null
        }
        Insert: {
          match_id: string
          user_id: string
          color: string
          final_position?: number | null
        }
        Update: {
          match_id?: string
          user_id?: string
          color?: string
          final_position?: number | null
        }
      }
    }
  }
}
