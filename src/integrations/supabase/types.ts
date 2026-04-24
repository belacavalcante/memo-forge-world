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
      activity_log: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          source: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          subject_id: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          flashcard_id: string
          id: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          flashcard_id: string
          id?: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          difficulty?: Database["public"]["Enums"]["difficulty"]
          flashcard_id?: string
          id?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          due_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          last_difficulty: Database["public"]["Enums"]["difficulty"] | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          due_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          last_difficulty?: Database["public"]["Enums"]["difficulty"] | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          due_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          last_difficulty?: Database["public"]["Enums"]["difficulty"] | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      material_upvotes: {
        Row: {
          created_at: string
          creator_user_id: string
          id: string
          material_id: string
          material_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          id?: string
          material_id: string
          material_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          id?: string
          material_id?: string
          material_type?: string
          user_id?: string
        }
        Relationships: []
      }
      mind_maps: {
        Row: {
          created_at: string
          description: string | null
          elite_badge: boolean
          id: string
          mermaid_code: string
          source: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          subject_id: string | null
          title: string
          updated_at: string
          upvotes_count: number
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          elite_badge?: boolean
          id?: string
          mermaid_code: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
          upvotes_count?: number
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          elite_badge?: boolean
          id?: string
          mermaid_code?: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          upvotes_count?: number
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          quiz_accuracy: number
          reputation: number
          review_aggressiveness: number
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          quiz_accuracy?: number
          reputation?: number
          review_aggressiveness?: number
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          quiz_accuracy?: number
          reputation?: number
          review_aggressiveness?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          questions: Json
          subject_id: string | null
          title: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          questions?: Json
          subject_id?: string | null
          title: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          created_at?: string
          id?: string
          questions?: Json
          subject_id?: string | null
          title?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          cover_color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          slug: string
        }
        Insert: {
          cover_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug: string
        }
        Update: {
          cover_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_plan: Json | null
          created_at: string
          daily_cards_goal: number
          daily_minutes_goal: number
          description: string | null
          id: string
          monthly_cards_goal: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_plan?: Json | null
          created_at?: string
          daily_cards_goal?: number
          daily_minutes_goal?: number
          description?: string | null
          id?: string
          monthly_cards_goal?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_plan?: Json | null
          created_at?: string
          daily_cards_goal?: number
          daily_minutes_goal?: number
          description?: string | null
          id?: string
          monthly_cards_goal?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          source: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "summaries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          _activity: string
          _metadata?: Json
          _user_id: string
          _xp: number
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_learning_performance: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      difficulty: "easy" | "medium" | "hard"
      source_type: "manual" | "pdf" | "text" | "youtube" | "audio"
      visibility_type: "private" | "public"
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
      app_role: ["admin", "moderator", "user"],
      difficulty: ["easy", "medium", "hard"],
      source_type: ["manual", "pdf", "text", "youtube", "audio"],
      visibility_type: ["private", "public"],
    },
  },
} as const
