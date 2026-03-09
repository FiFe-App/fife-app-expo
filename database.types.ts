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
    PostgrestVersion: "12.2.3 (519615d)"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          location: unknown
          updated_at: string | null
          username: string | null
          viewed_functions: string[] | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          location?: unknown
          location_radius_m?: number | null
          updated_at?: string | null
          username?: string | null
          viewed_functions?: string[] | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          location?: unknown
          location_radius_m?: number | null
          updated_at?: string | null
          username?: string | null
          viewed_functions?: string[] | null
          website?: string | null
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
      hybrid_buziness_search: {
        Args: {
          distance: number
          full_text_weight?: number
          lat: number
          long: number
          match_threshold?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
          skip: number
          take: number
        }
        Returns: {
          author: string
          created_at: string
          defaultcontact: number
          description: string
          distance: number
          id: number
          images: string[]
          lat: number
          location: unknown
          long: number
          recommendations: number
          relevance: number
          title: string
        }[]
      }
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
      nearest_profiles: {
        Args: {
          distance: number
          lat: number
          long: number
          skip?: number
          take?: number
        }
        Returns: {
          id: string
          full_name: string
          username: string
          avatar_url: string
          website: string
          created_at: string
          recommendations: number
          lat: number
          long: number
          distance: number
          buzinesses: Json
        }[]
      }
      get_my_profile_location: {
        Args: Record<string, never>
        Returns: {
          location_wkt: string | null
          location_radius_m: number | null
        }[]
      }
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
