export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      buziness: {
        Row: {
          author: string
          created_at: string
          defaultContact: number | null
          description: string
          embedding: string | null
          embedding_text: string | null
          id: number
          images: string[] | null
          ingyen: boolean
          location: unknown
          radius: number | null
          title: string
        }
        Insert: {
          author: string
          created_at?: string
          defaultContact?: number | null
          description: string
          embedding?: string | null
          embedding_text?: string | null
          id?: number
          images?: string[] | null
          ingyen?: boolean
          location?: unknown
          radius?: number | null
          title: string
        }
        Update: {
          author?: string
          created_at?: string
          defaultContact?: number | null
          description?: string
          embedding?: string | null
          embedding_text?: string | null
          id?: number
          images?: string[] | null
          ingyen?: boolean
          location?: unknown
          radius?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "buziness_author_fkey1"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buziness_defaultContact_fkey"
            columns: ["defaultContact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      buzinessRecommendations: {
        Row: {
          author: string
          buziness_id: number
          created_at: string
          id: number
        }
        Insert: {
          author: string
          buziness_id: number
          created_at?: string
          id?: number
        }
        Update: {
          author?: string
          buziness_id?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "buzinessRecommendations_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buzinessRecommendations_buziness_id_fkey"
            columns: ["buziness_id"]
            isOneToOne: false
            referencedRelation: "buziness"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          id: number
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: number
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: number
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author: string
          created_at: string
          id: number
          image: string | null
          key: string
          text: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: number
          image?: string | null
          key: string
          text: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: number
          image?: string | null
          key?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_fkey1"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          author: string
          created_at: string
          data: string
          id: number
          public: boolean | null
          title: string | null
          type: Database["public"]["Enums"]["contact_type"]
        }
        Insert: {
          author: string
          created_at?: string
          data: string
          id?: number
          public?: boolean | null
          title?: string | null
          type: Database["public"]["Enums"]["contact_type"]
        }
        Update: {
          author?: string
          created_at?: string
          data?: string
          id?: number
          public?: boolean | null
          title?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
        }
        Relationships: []
      }
      eventResponses: {
        Row: {
          created_at: string
          event_id: number
          id: number
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          user_id?: string
          value: number
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "eventResponses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventResponses_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          author: string
          created_at: string
          date: string
          description: string | null
          duration: string | null
          id: number
          location: unknown
          locationName: string
          title: string
        }
        Insert: {
          author: string
          created_at?: string
          date: string
          description?: string | null
          duration?: string | null
          id?: number
          location?: unknown
          locationName: string
          title: string
        }
        Update: {
          author?: string
          created_at?: string
          date?: string
          description?: string | null
          duration?: string | null
          id?: number
          location?: unknown
          locationName?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author: string
          created_at: string
          id: number
          text: string
          to: string | null
        }
        Insert: {
          author: string
          created_at?: string
          id?: number
          text: string
          to?: string | null
        }
        Update: {
          author?: string
          created_at?: string
          id?: number
          text?: string
          to?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string
          categories: string
          created_at: string
          id: number
          location: unknown
          text: string
        }
        Insert: {
          author: string
          categories: string
          created_at?: string
          id?: number
          location?: unknown
          text: string
        }
        Update: {
          author?: string
          categories?: string
          created_at?: string
          id?: number
          location?: unknown
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profileRecommendations: {
        Row: {
          author: string
          created_at: string
          id: number
          profile_id: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: number
          profile_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profileRecommendations_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profileRecommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_logs: {
        Row: {
          id: string
          author: string
          rate: number
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          author: string
          rate: number
          log_date: string
          created_at?: string
        }
        Update: {
          id?: string
          author?: string
          rate?: number
          log_date?: string
          created_at?: string
        }
        Relationships: []
      }
      emotion_logs: {
        Row: {
          id: string
          author: string
          rate: number
          note: string | null
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          author: string
          rate: number
          note?: string | null
          log_date: string
          created_at?: string
        }
        Update: {
          id?: string
          author?: string
          rate?: number
          note?: string | null
          log_date?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bad_boy: boolean
          created_at: string | null
          emotion_daily_prompt: boolean
          full_name: string
          id: string
          location: unknown
          location_radius_m: number | null
          newsletter: boolean
          notify_email: boolean
          notify_push: boolean
          push_token: string | null
          updated_at: string | null
          username: string | null
          viewed_functions: string[] | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bad_boy?: boolean
          created_at?: string | null
          emotion_daily_prompt?: boolean
          full_name: string
          id: string
          location?: unknown
          location_radius_m?: number | null
          newsletter?: boolean
          notify_email?: boolean
          notify_push?: boolean
          push_token?: string | null
          updated_at?: string | null
          username?: string | null
          viewed_functions?: string[] | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bad_boy?: boolean
          created_at?: string | null
          emotion_daily_prompt?: boolean
          full_name?: string
          id?: string
          location?: unknown
          location_radius_m?: number | null
          newsletter?: boolean
          notify_email?: boolean
          notify_push?: boolean
          push_token?: string | null
          updated_at?: string | null
          username?: string | null
          viewed_functions?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      query_embedding_cache: {
        Row: {
          created_at: string
          embedding: string
          embedding_text: string
          hit_count: number
          last_used_at: string
          model_version: string
          query_hash: string
          query_text: string
        }
        Insert: {
          created_at?: string
          embedding: string
          embedding_text: string
          hit_count?: number
          last_used_at?: string
          model_version: string
          query_hash: string
          query_text: string
        }
        Update: {
          created_at?: string
          embedding?: string
          embedding_text?: string
          hit_count?: number
          last_used_at?: string
          model_version?: string
          query_hash?: string
          query_text?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          author: string
          created_at: string
          description: string
          id: number
          reason: string
          reported_profile_id: string
        }
        Insert: {
          author: string
          created_at?: string
          description: string
          id?: number
          reason: string
          reported_profile_id: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          id?: number
          reason?: string
          reported_profile_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_notification_prefs: {
        Args: never
        Returns: {
          emotion_daily_prompt: boolean
          newsletter: boolean
          notify_email: boolean
          notify_push: boolean
        }[]
      }
      get_my_profile_location: {
        Args: never
        Returns: {
          location_radius_m: number
          location_wkt: string
        }[]
      }
      get_notification_prefs_for: {
        Args: { user_id: string }
        Returns: {
          email: string
          full_name: string
          newsletter: boolean
          notify_email: boolean
          notify_push: boolean
          push_token: string
        }[]
      }
      get_popular_search_queries: {
        Args: { p_limit?: number; p_prefix?: string }
        Returns: {
          hit_count: number
          query_text: string
        }[]
      }
      hybrid_buziness_search: {
        Args: {
          distance_sort?: number
          filter_bad_boy?: boolean
          filter_ingyen?: boolean
          fts_weight?: number
          lat: number
          long: number
          match_threshold?: number
          max_distance?: number
          query_embedding: string
          query_text: string
          recommendation_sort?: number
          score_sort?: number
          semantic_weight?: number
          skip?: number
          take?: number
        }
        Returns: {
          author: string
          created_at: string
          defaultcontact: number
          description: string
          distance: number
          id: number
          images: string[]
          ingyen: boolean
          lat: number
          location: unknown
          long: number
          recommendations: number
          score: number
          title: string
        }[]
      }
      is_bad_boy: { Args: never; Returns: boolean }
      nearby_buziness: {
        Args: {
          lat: number
          long: number
          maxdistance: number
          search: string
          skip: number
          take: number
        }
        Returns: {
          author: string
          created_at: string
          description: string
          distance: number
          id: number
          lat: number
          location: unknown
          long: number
          recommendations: number
          title: string
        }[]
      }
      nearby_posts: {
        Args: { lat: number; long: number; search: string; skip: number }
        Returns: {
          author: string
          categories: string
          created_at: string
          distance: number
          id: number
          lat: number
          location: unknown
          long: number
          text: string
        }[]
      }
      nearest_profiles: {
        Args: {
          p_distance: number
          p_lat: number
          p_long: number
          skip?: number
          take?: number
        }
        Returns: {
          avatar_url: string
          buzinesses: Json
          created_at: string
          distance: number
          full_name: string
          id: string
          lat: number
          long: number
          recommendations: number
          username: string
          website: string
        }[]
      }
      newest_buziness: {
        Args: {
          distance: number
          full_text_weight?: number
          lat: number
          long: number
          match_threshold?: number
          rrf_k?: number
          semantic_weight?: number
          skip?: number
          take?: number
        }
        Returns: {
          author: string
          created_at: string
          description: string
          distance: number
          id: number
          images: string[]
          lat: number
          location: unknown
          long: number
          recommendations: number
          title: string
        }[]
      }
      newest_users: {
        Args: {
          distance: number
          full_text_weight?: number
          lat: number
          long: number
          match_threshold?: number
          rrf_k?: number
          semantic_weight?: number
          skip?: number
          take?: number
        }
        Returns: {
          author: string
          created_at: string
          description: string
          distance: number
          id: number
          images: string[]
          lat: number
          location: unknown
          long: number
          recommendations: number
          title: string
        }[]
      }
      update_my_profile_location: {
        Args: { lat: number; long: number; radius_m: number }
        Returns: undefined
      }
      update_my_push_token: { Args: { token: string }; Returns: undefined }
    }
    Enums: {
      contact_type:
        | "TEL"
        | "EMAIL"
        | "WEB"
        | "OTHER"
        | "INSTAGRAM"
        | "FACEBOOK"
        | "PLACE"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contact_type: [
        "TEL",
        "EMAIL",
        "WEB",
        "OTHER",
        "INSTAGRAM",
        "FACEBOOK",
        "PLACE",
      ],
    },
  },
} as const

