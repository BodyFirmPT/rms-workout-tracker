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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client: {
        Row: {
          created_at: string
          id: string
          name: string
          trainer_id: string
          workout_count_offset: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          trainer_id: string
          workout_count_offset?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          trainer_id?: string
          workout_count_offset?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainer"
            referencedColumns: ["id"]
          },
        ]
      }
      client_locations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          location_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          location_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location_id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location_id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
        ]
      }
      injury: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string
          workout_count_offset: number
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          workout_count_offset?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          workout_count_offset?: number
        }
        Relationships: [
          {
            foreignKeyName: "injury_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
      location: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      muscle_group: {
        Row: {
          category: string | null
          created_at: string
          default_group: boolean
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_group?: boolean
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_group?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      restricted_exercise: {
        Row: {
          client_id: string
          created_at: string
          id: string
          muscle_group_id: string | null
          name: string
          reason: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          muscle_group_id?: string | null
          name: string
          reason?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          muscle_group_id?: string | null
          name?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restricted_exercise_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restricted_exercise_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_group"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer: {
        Row: {
          created_at: string
          id: string
          name: string
          workout_count_mode: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workout_count_mode?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workout_count_mode?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_paid: boolean
          stripe_customer_id: string | null
          subscription_override: boolean | null
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_paid?: boolean
          stripe_customer_id?: string | null
          subscription_override?: boolean | null
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_paid?: boolean
          stripe_customer_id?: string | null
          subscription_override?: boolean | null
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainer"
            referencedColumns: ["id"]
          },
        ]
      }
      workout: {
        Row: {
          canceled_at: string | null
          client_id: string
          created_at: string
          date: string
          id: string
          late_cancelled: boolean | null
          location_id: string | null
          note: string
          parent_workout_id: string | null
          self_led: boolean
          share_token: string | null
          status: string
        }
        Insert: {
          canceled_at?: string | null
          client_id: string
          created_at?: string
          date?: string
          id?: string
          late_cancelled?: boolean | null
          location_id?: string | null
          note: string
          parent_workout_id?: string | null
          self_led?: boolean
          share_token?: string | null
          status?: string
        }
        Update: {
          canceled_at?: string | null
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          late_cancelled?: boolean | null
          location_id?: string | null
          note?: string
          parent_workout_id?: string | null
          self_led?: boolean
          share_token?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_parent_workout_id_fkey"
            columns: ["parent_workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise: {
        Row: {
          band_color: string | null
          band_type: string | null
          completed_sets: number
          count: number
          created_at: string
          exercise_name: string
          id: string
          image_url: string | null
          is_completed: boolean
          left_weight: number | null
          muscle_group_id: string
          note: string | null
          raw_import_data: string | null
          reps: string
          reps_count: number
          reps_unit: string
          set_count: number
          type: string
          unit: string
          weight_count: number
          weight_unit: string
          workout_id: string
        }
        Insert: {
          band_color?: string | null
          band_type?: string | null
          completed_sets?: number
          count: number
          created_at?: string
          exercise_name: string
          id?: string
          image_url?: string | null
          is_completed?: boolean
          left_weight?: number | null
          muscle_group_id: string
          note?: string | null
          raw_import_data?: string | null
          reps: string
          reps_count: number
          reps_unit?: string
          set_count: number
          type?: string
          unit: string
          weight_count: number
          weight_unit?: string
          workout_id: string
        }
        Update: {
          band_color?: string | null
          band_type?: string | null
          completed_sets?: number
          count?: number
          created_at?: string
          exercise_name?: string
          id?: string
          image_url?: string | null
          is_completed?: boolean
          left_weight?: number | null
          muscle_group_id?: string
          note?: string | null
          raw_import_data?: string | null
          reps?: string
          reps_count?: number
          reps_unit?: string
          set_count?: number
          type?: string
          unit?: string
          weight_count?: number
          weight_unit?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
