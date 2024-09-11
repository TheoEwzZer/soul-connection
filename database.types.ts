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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Clothe: {
        Row: {
          customer_id: number
          id: number
          type: string
        }
        Insert: {
          customer_id: number
          id?: number
          type: string
        }
        Update: {
          customer_id?: number
          id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Clothe_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          address: string
          birth_date: string
          created_at: string
          description: string
          email: string
          employee_id: number | null
          gender: Database["public"]["Enums"]["Gender"]
          id: number
          name: string
          phone_number: string
          profil_picture_url: string | null
          surname: string
        }
        Insert: {
          address: string
          birth_date: string
          created_at?: string
          description: string
          email: string
          employee_id?: number | null
          gender: Database["public"]["Enums"]["Gender"]
          id?: number
          name: string
          phone_number: string
          profil_picture_url?: string | null
          surname: string
        }
        Update: {
          address?: string
          birth_date?: string
          created_at?: string
          description?: string
          email?: string
          employee_id?: number | null
          gender?: Database["public"]["Enums"]["Gender"]
          id?: number
          name?: string
          phone_number?: string
          profil_picture_url?: string | null
          surname?: string
        }
        Relationships: [
          {
            foreignKeyName: "Customer_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
        ]
      }
      Employee: {
        Row: {
          birth_date: string
          email: string
          gender: Database["public"]["Enums"]["Gender"]
          id: number
          image: string | null
          name: string
          password: string
          phone_number: string
          profil_picture_url: string | null
          surname: string
          work: string
        }
        Insert: {
          birth_date: string
          email: string
          gender: Database["public"]["Enums"]["Gender"]
          id?: number
          image?: string | null
          name: string
          password: string
          phone_number: string
          profil_picture_url?: string | null
          surname: string
          work: string
        }
        Update: {
          birth_date?: string
          email?: string
          gender?: Database["public"]["Enums"]["Gender"]
          id?: number
          image?: string | null
          name?: string
          password?: string
          phone_number?: string
          profil_picture_url?: string | null
          surname?: string
          work?: string
        }
        Relationships: []
      }
      Encounter: {
        Row: {
          comment: string | null
          customer_id: number
          date: string
          id: number
          rating: number
          source: string
        }
        Insert: {
          comment?: string | null
          customer_id: number
          date?: string
          id?: number
          rating: number
          source: string
        }
        Update: {
          comment?: string | null
          customer_id?: number
          date?: string
          id?: number
          rating?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "Encounter_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Event: {
        Row: {
          date: string
          duration: number
          employee_id: number | null
          id: number
          location_name: string
          location_x: string
          location_y: string
          max_participants: number
          name: string
          registered_participants: number
          type: string
        }
        Insert: {
          date?: string
          duration: number
          employee_id?: number | null
          id?: number
          location_name: string
          location_x: string
          location_y: string
          max_participants: number
          name: string
          registered_participants?: number
          type: string
        }
        Update: {
          date?: string
          duration?: number
          employee_id?: number | null
          id?: number
          location_name?: string
          location_x?: string
          location_y?: string
          max_participants?: number
          name?: string
          registered_participants?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Event_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
        ]
      }
      PaymentHistory: {
        Row: {
          amount: number
          comment: string | null
          customer_id: number
          date: string
          id: number
          payment_method: string
        }
        Insert: {
          amount: number
          comment?: string | null
          customer_id: number
          date?: string
          id?: number
          payment_method: string
        }
        Update: {
          amount?: number
          comment?: string | null
          customer_id?: number
          date?: string
          id?: number
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "PaymentHistory_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Tip: {
        Row: {
          id: number
          tip: string
          title: string
        }
        Insert: {
          id?: number
          tip: string
          title: string
        }
        Update: {
          id?: number
          tip?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      Gender: "Male" | "Female"
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
