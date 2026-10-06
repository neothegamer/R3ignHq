export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      award_winners: {
        Row: {
          award_label: string
          context: string | null
          created_at: string
          id: string
          player_name: string
          profile_id: string | null
          season: string | null
        }
        Insert: {
          award_label?: string
          context?: string | null
          created_at?: string
          id?: string
          player_name: string
          profile_id?: string | null
          season?: string | null
        }
        Update: {
          award_label?: string
          context?: string | null
          created_at?: string
          id?: string
          player_name?: string
          profile_id?: string | null
          season?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_winners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bracket_matches: {
        Row: {
          id: string
          match_order: number
          round_name: string | null
          round_number: number
          scheduled_at: string | null
          score_a: number | null
          score_b: number | null
          team_a: string | null
          team_b: string | null
          tournament_id: string
          updated_at: string | null
          winner: string | null
        }
        Insert: {
          id?: string
          match_order: number
          round_name?: string | null
          round_number: number
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
          tournament_id: string
          updated_at?: string | null
          winner?: string | null
        }
        Update: {
          id?: string
          match_order?: number
          round_name?: string | null
          round_number?: number
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          team_a?: string | null
          team_b?: string | null
          tournament_id?: string
          updated_at?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connected_at: string | null
          id: string
          profile_id: string
          provider: string
          provider_user_id: string | null
          username: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string
          profile_id: string
          provider: string
          provider_user_id?: string | null
          username?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string
          profile_id?: string
          provider?: string
          provider_user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          ended_at: string | null
          id: string
          league: string | null
          location: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          ended_at?: string | null
          id?: string
          league?: string | null
          location?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          ended_at?: string | null
          id?: string
          league?: string | null
          location?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_accounts: {
        Row: {
          game: string
          game_uid: string | null
          id: string
          ign: string
          profile_id: string
          updated_at: string | null
          verification_code: string | null
          verification_status: string
        }
        Insert: {
          game: string
          game_uid?: string | null
          id?: string
          ign: string
          profile_id: string
          updated_at?: string | null
          verification_code?: string | null
          verification_status?: string
        }
        Update: {
          game?: string
          game_uid?: string | null
          id?: string
          ign?: string
          profile_id?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_profiles: {
        Row: {
          country: string | null
          experience: string | null
          extra: Json | null
          game: string
          id: string
          ign: string | null
          player_uid: string | null
          profile_id: string
          role: string | null
          team_clan: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          experience?: string | null
          extra?: Json | null
          game: string
          id?: string
          ign?: string | null
          player_uid?: string | null
          profile_id: string
          role?: string | null
          team_clan?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          experience?: string | null
          extra?: Json | null
          game?: string
          id?: string
          ign?: string | null
          player_uid?: string | null
          profile_id?: string
          role?: string | null
          team_clan?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_highlights: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          league: string | null
          match_label: string | null
          storage_path: string | null
          title: string
          uploaded_by: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          league?: string | null
          match_label?: string | null
          storage_path?: string | null
          title: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          league?: string | null
          match_label?: string | null
          storage_path?: string | null
          title?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_highlights_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          admin_notes: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          league: string | null
          match_date: string | null
          notes: string | null
          opponent_profile_id: string | null
          score_a: number | null
          score_b: number | null
          season: string | null
          status: string
          submitted_by: string | null
          team_a: string | null
          team_b: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          league?: string | null
          match_date?: string | null
          notes?: string | null
          opponent_profile_id?: string | null
          score_a?: number | null
          score_b?: number | null
          season?: string | null
          status?: string
          submitted_by?: string | null
          team_a?: string | null
          team_b?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          league?: string | null
          match_date?: string | null
          notes?: string | null
          opponent_profile_id?: string | null
          score_a?: number | null
          score_b?: number | null
          season?: string | null
          status?: string
          submitted_by?: string | null
          team_a?: string | null
          team_b?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          body: string
          created_at: string
          deleted_at: string | null
          delivered_at: string | null
          edited_at: string | null
          id: string
          listing_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          body: string
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          listing_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          listing_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "player_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          author_name: string | null
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          published: boolean
          title: string
        }
        Insert: {
          author_name?: string | null
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          title: string
        }
        Update: {
          author_name?: string | null
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          id: string
          league_interests: string[] | null
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          league_interests?: string[] | null
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          league_interests?: string[] | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          profile_id: string
          role: string
          status: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          profile_id: string
          role?: string
          status?: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          profile_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          division: number | null
          id: string
          league: string
          name: string
          owner_id: string | null
          region: string | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          division?: number | null
          id?: string
          league: string
          name: string
          owner_id?: string | null
          region?: string | null
          tag: string
        }
        Update: {
          created_at?: string | null
          division?: number | null
          id?: string
          league?: string
          name?: string
          owner_id?: string | null
          region?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_listings: {
        Row: {
          created_at: string | null
          id: string
          ign: string
          league: string | null
          notes: string | null
          profile_id: string | null
          profile_screenshot_path: string | null
          region: string | null
          role: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ign: string
          league?: string | null
          notes?: string | null
          profile_id?: string | null
          profile_screenshot_path?: string | null
          region?: string | null
          role: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ign?: string
          league?: string | null
          notes?: string | null
          profile_id?: string | null
          profile_screenshot_path?: string | null
          region?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_listings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          league_id: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          player_id: string | null
          r3ign_hq_joined: boolean | null
          selected_games: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          league_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          player_id?: string | null
          r3ign_hq_joined?: boolean | null
          selected_games?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          league_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          player_id?: string | null
          r3ign_hq_joined?: boolean | null
          selected_games?: string[] | null
        }
        Relationships: []
      }
      rankings: {
        Row: {
          division: number | null
          id: string
          league: string
          losses: number | null
          organization_id: string | null
          points: number | null
          season: string
          tag: string | null
          team_name: string
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          division?: number | null
          id?: string
          league: string
          losses?: number | null
          organization_id?: string | null
          points?: number | null
          season: string
          tag?: string | null
          team_name: string
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          division?: number | null
          id?: string
          league?: string
          losses?: number | null
          organization_id?: string | null
          points?: number | null
          season?: string
          tag?: string | null
          team_name?: string
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rankings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          captain_email: string
          captain_name: string
          created_at: string | null
          discord: string | null
          id: string
          league: string
          notes: string | null
          region: string
          roster: string
          status: string | null
          submitted_by: string | null
          team_name: string
          team_tag: string
        }
        Insert: {
          captain_email: string
          captain_name: string
          created_at?: string | null
          discord?: string | null
          id?: string
          league: string
          notes?: string | null
          region: string
          roster: string
          status?: string | null
          submitted_by?: string | null
          team_name: string
          team_tag: string
        }
        Update: {
          captain_email?: string
          captain_name?: string
          created_at?: string | null
          discord?: string | null
          id?: string
          league?: string
          notes?: string | null
          region?: string
          roster?: string
          status?: string | null
          submitted_by?: string | null
          team_name?: string
          team_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          id: string
          league: string | null
          name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          league?: string | null
          name: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          league?: string | null
          name?: string
          status?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mutes: {
        Row: {
          created_at: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          muted_id?: string
          muter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mutes_muted_id_fkey"
            columns: ["muted_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mutes_muter_id_fkey"
            columns: ["muter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          conversation_peer_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          conversation_peer_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          conversation_peer_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      blocked_by_peer: { Args: { me: string; peer: string }; Returns: boolean }
      can_manage_organization_members: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      ensure_my_league_id: { Args: never; Returns: string }
      generate_league_id: { Args: never; Returns: string }
      generate_player_id: { Args: never; Returns: string }
      is_display_name_taken: { Args: { p_name: string }; Returns: boolean }
      is_messaging_blocked: { Args: { a: string; b: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
