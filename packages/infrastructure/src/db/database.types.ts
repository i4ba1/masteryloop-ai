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
      audit_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          object_id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          object_id: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          object_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_memberships: {
        Row: {
          active: boolean
          class_id: string
          organization_id: string
          student_id: string
        }
        Insert: {
          active?: boolean
          class_id: string
          organization_id: string
          student_id: string
        }
        Update: {
          active?: boolean
          class_id?: string
          organization_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_memberships_class_id_organization_id_fkey"
            columns: ["class_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "class_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_memberships_student_id_organization_id_fkey"
            columns: ["student_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      classes: {
        Row: {
          active: boolean
          created_at: string
          grade_level: string
          id: string
          name: string
          organization_id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          grade_level: string
          id?: string
          name: string
          organization_id: string
          subject?: string
          teacher_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          grade_level?: string
          id?: string
          name?: string
          organization_id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_organization_id_fkey"
            columns: ["teacher_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      concepts: {
        Row: {
          code: string
          grade_level: string
          id: string
          name: string
          organization_id: string
          subject: string
        }
        Insert: {
          code: string
          grade_level: string
          id?: string
          name: string
          organization_id: string
          subject?: string
        }
        Update: {
          code?: string
          grade_level?: string
          id?: string
          name?: string
          organization_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          active: boolean
          organization_id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          active?: boolean
          organization_id: string
          parent_id: string
          student_id: string
        }
        Update: {
          active?: boolean
          organization_id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_parent_id_organization_id_fkey"
            columns: ["parent_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_organization_id_fkey"
            columns: ["student_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      students: {
        Row: {
          grade_level: string
          id: string
          organization_id: string
          school_year: number
        }
        Insert: {
          grade_level: string
          id: string
          organization_id: string
          school_year: number
        }
        Update: {
          grade_level?: string
          id?: string
          organization_id?: string
          school_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_id_organization_id_fkey"
            columns: ["id", "organization_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      class_enrollment_counts: {
        Args: { class_ids: string[] }
        Returns: {
          class_id: string
          enrollment_count: number
        }[]
      }
      complete_account_provisioning: {
        Args: {
          request_id: string
          target_email: string
          target_user_id: string
        }
        Returns: undefined
      }
      create_class: {
        Args: {
          class_grade_level: string
          class_name: string
          class_subject: string
          class_teacher_id: string
        }
        Returns: string
      }
      reserve_account: {
        Args: {
          account_email: string
          account_name: string
          account_role: Database["public"]["Enums"]["app_role"]
          grade_level: string
          request_id: string
          school_year: number
        }
        Returns: string
      }
      set_guardian_link: {
        Args: {
          is_active: boolean
          target_parent_id: string
          target_student_id: string
        }
        Returns: undefined
      }
      set_membership: {
        Args: {
          is_active: boolean
          target_class_id: string
          target_student_id: string
        }
        Returns: undefined
      }
      update_account: {
        Args: {
          account_name: string
          account_role: Database["public"]["Enums"]["app_role"]
          change_reason: string
          expected_version: number
          grade_level: string
          is_active: boolean
          school_year: number
          target_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "STUDENT" | "PARENT" | "TEACHER" | "ADMIN"
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
    Enums: {
      app_role: ["STUDENT", "PARENT", "TEACHER", "ADMIN"],
    },
  },
} as const

