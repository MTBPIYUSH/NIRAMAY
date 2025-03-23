export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      redeemed_rewards: {
        Row: {
          id: string
          redeemed_at: string | null
          reward_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          id: string
          redeemed_at?: string | null
          reward_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          reward_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redeemed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string
          id: string
          image_url: string
          name: string
          points: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description: string
          id: string
          image_url: string
          name: string
          points: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          name?: string
          points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          created_at: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_name: string
          created_at?: string | null
          earned_at?: string | null
          id: string
          user_id?: string | null
        }
        Update: {
          badge_name?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          level: number | null
          name: string | null
          next_level_points: number | null
          points: number | null
          rank: number | null
          recycling: number | null
          reports: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          level?: number | null
          name?: string | null
          next_level_points?: number | null
          points?: number | null
          rank?: number | null
          recycling?: number | null
          reports?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          name?: string | null
          next_level_points?: number | null
          points?: number | null
          rank?: number | null
          recycling?: number | null
          reports?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waste_reports: {
        Row: {
          collected_at: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location: Json
          reported_at: string | null
          status: string | null
          type: string
          updated_at: string | null
          urgent: boolean | null
          user_id: string | null
        }
        Insert: {
          collected_at?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          location: Json
          reported_at?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Update: {
          collected_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: Json
          reported_at?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          urgent?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_demo_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment: {
        Args: {
          value: number
        }
        Returns: number
      }
      increment_user_reports: {
        Args: {
          user_id: string
          points_to_add: number
        }
        Returns: undefined
      }
      update_user_ranks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
