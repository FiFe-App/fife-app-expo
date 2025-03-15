export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      buziness: {
        Row: {
          author: string;
          created_at: string;
          defaultContact: number | null;
          description: string;
          embedding: string | null;
          id: number;
          images: string[] | null;
          location: unknown | null;
          radius: number | null;
          title: string;
        };
        Insert: {
          author: string;
          created_at?: string;
          defaultContact?: number | null;
          description: string;
          embedding?: string | null;
          id?: number;
          images?: string[] | null;
          location?: unknown | null;
          radius?: number | null;
          title: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          defaultContact?: number | null;
          description?: string;
          embedding?: string | null;
          id?: number;
          images?: string[] | null;
          location?: unknown | null;
          radius?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "buziness_author_fkey1";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "buziness_defaultContact_fkey";
            columns: ["defaultContact"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      buzinessRecommendations: {
        Row: {
          author: string;
          buziness_id: number;
          created_at: string;
          id: number;
        };
        Insert: {
          author: string;
          buziness_id: number;
          created_at?: string;
          id?: number;
        };
        Update: {
          author?: string;
          buziness_id?: number;
          created_at?: string;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "buzinessRecommendations_author_fkey";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "buzinessRecommendations_buziness_id_fkey";
            columns: ["buziness_id"];
            isOneToOne: false;
            referencedRelation: "buziness";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author: string;
          created_at: string;
          id: number;
          image: string | null;
          key: string;
          text: string;
        };
        Insert: {
          author: string;
          created_at?: string;
          id?: number;
          image?: string | null;
          key: string;
          text: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          id?: number;
          image?: string | null;
          key?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_fkey1";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          author: string;
          created_at: string;
          data: string;
          id: number;
          public: boolean | null;
          title: string | null;
          type: Database["public"]["Enums"]["contact_type"];
        };
        Insert: {
          author: string;
          created_at?: string;
          data: string;
          id?: number;
          public?: boolean | null;
          title?: string | null;
          type: Database["public"]["Enums"]["contact_type"];
        };
        Update: {
          author?: string;
          created_at?: string;
          data?: string;
          id?: number;
          public?: boolean | null;
          title?: string | null;
          type?: Database["public"]["Enums"]["contact_type"];
        };
        Relationships: [];
      };
      eventResponses: {
        Row: {
          created_at: string;
          event_id: number;
          id: number;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          event_id: number;
          id?: number;
          user_id?: string;
          value: number;
        };
        Update: {
          created_at?: string;
          event_id?: number;
          id?: number;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "eventResponses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "eventResponses_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          author: string;
          created_at: string;
          date: string;
          description: string | null;
          duration: string | null;
          id: number;
          location: unknown | null;
          locationName: string;
          title: string;
        };
        Insert: {
          author: string;
          created_at?: string;
          date: string;
          description?: string | null;
          duration?: string | null;
          id?: number;
          location?: unknown | null;
          locationName: string;
          title: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          date?: string;
          description?: string | null;
          duration?: string | null;
          id?: number;
          location?: unknown | null;
          locationName?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_author_fkey";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          author: string;
          created_at: string;
          id: number;
          text: string;
          to: string | null;
        };
        Insert: {
          author: string;
          created_at?: string;
          id?: number;
          text: string;
          to?: string | null;
        };
        Update: {
          author?: string;
          created_at?: string;
          id?: number;
          text?: string;
          to?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author: string;
          categories: string;
          created_at: string;
          id: number;
          location: unknown | null;
          text: string;
        };
        Insert: {
          author: string;
          categories: string;
          created_at?: string;
          id?: number;
          location?: unknown | null;
          text: string;
        };
        Update: {
          author?: string;
          categories?: string;
          created_at?: string;
          id?: number;
          location?: unknown | null;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_fkey";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profileRecommendations: {
        Row: {
          author: string;
          created_at: string;
          id: number;
          profile_id: string;
        };
        Insert: {
          author: string;
          created_at?: string;
          id?: number;
          profile_id: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          id?: number;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profileRecommendations_author_fkey";
            columns: ["author"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profileRecommendations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
          viewed_functions: string[] | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
          viewed_functions?: string[] | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          viewed_functions?: string[] | null;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      hybrid_buziness_search: {
        Args: {
          query_text: string;
          query_embedding: string;
          lat: number;
          long: number;
          distance: number;
          skip: number;
          take: number;
          full_text_weight?: number;
          semantic_weight?: number;
          rrf_k?: number;
        };
        Returns: {
          author: string;
          created_at: string;
          defaultContact: number | null;
          description: string;
          embedding: string | null;
          id: number;
          images: string[] | null;
          location: unknown;
          recommendations: number;
          lat: number;
          long: number;
          distance: number;
          relevance: number;
          defaultcontact: number;
        }[];
      };
      nearby_buziness: {
        Args: {
          lat: number;
          long: number;
          maxdistance: number;
          search: string;
          take: number;
          skip: number;
        };
        Returns: {
          id: number;
          title: string;
          description: string;
          author: string;
          created_at: string;
          location: unknown;
          recommendations: number;
          lat: number;
          long: number;
          distance: number;
        }[];
      };
      nearby_posts: {
        Args: {
          lat: number;
          long: number;
          search: string;
          skip: number;
        };
        Returns: {
          id: number;
          categories: string;
          text: string;
          author: string;
          created_at: string;
          location: unknown;
          lat: number;
          long: number;
          distance: number;
        }[];
      };
      send_email_mailersend: {
        Args: {
          message: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      contact_type:
        | "TEL"
        | "EMAIL"
        | "WEB"
        | "OTHER"
        | "INSTAGRAM"
        | "FACEBOOK"
        | "PLACE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

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
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
