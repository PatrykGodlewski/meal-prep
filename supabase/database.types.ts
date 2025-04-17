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
      ingredients: {
        Row: {
          category: Database["public"]["Enums"]["ingredientCategory"] | null
          createdAt: string
          id: string
          name: string
          unit: Database["public"]["Enums"]["unit"] | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["ingredientCategory"] | null
          createdAt?: string
          id?: string
          name: string
          unit?: Database["public"]["Enums"]["unit"] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["ingredientCategory"] | null
          createdAt?: string
          id?: string
          name?: string
          unit?: Database["public"]["Enums"]["unit"] | null
        }
        Relationships: []
      }
      mealIngredients: {
        Row: {
          ingredientId: string
          isOptional: boolean | null
          mealId: string
          notes: string | null
          quantity: number
        }
        Insert: {
          ingredientId: string
          isOptional?: boolean | null
          mealId: string
          notes?: string | null
          quantity: number
        }
        Update: {
          ingredientId?: string
          isOptional?: boolean | null
          mealId?: string
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "mealIngredients_ingredientId_ingredients_id_fk"
            columns: ["ingredientId"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mealIngredients_mealId_meals_id_fk"
            columns: ["mealId"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      mealPlans: {
        Row: {
          date: string
          id: number
          userId: string
        }
        Insert: {
          date: string
          id?: number
          userId: string
        }
        Update: {
          date?: string
          id?: number
          userId?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          category: Database["public"]["Enums"]["mealCategory"] | null
          cookTimeMinutes: number | null
          createdAt: string
          createdBy: string | null
          description: string
          id: string
          imageUrl: string | null
          instructions: string | null
          isPublic: boolean | null
          name: string
          prepTimeMinutes: number | null
          servings: number | null
          updatedAt: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["mealCategory"] | null
          cookTimeMinutes?: number | null
          createdAt?: string
          createdBy?: string | null
          description: string
          id?: string
          imageUrl?: string | null
          instructions?: string | null
          isPublic?: boolean | null
          name: string
          prepTimeMinutes?: number | null
          servings?: number | null
          updatedAt?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["mealCategory"] | null
          cookTimeMinutes?: number | null
          createdAt?: string
          createdBy?: string | null
          description?: string
          id?: string
          imageUrl?: string | null
          instructions?: string | null
          isPublic?: boolean | null
          name?: string
          prepTimeMinutes?: number | null
          servings?: number | null
          updatedAt?: string
        }
        Relationships: []
      }
      plannedMeals: {
        Row: {
          createdAt: string
          mealId: string
          mealPlanId: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          mealId: string
          mealPlanId: number
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          mealId?: string
          mealPlanId?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "plannedMeals_mealId_meals_id_fk"
            columns: ["mealId"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plannedMeals_mealPlanId_mealPlans_id_fk"
            columns: ["mealPlanId"]
            isOneToOne: false
            referencedRelation: "mealPlans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: number
          nickname: string | null
          userId: string
        }
        Insert: {
          id?: number
          nickname?: string | null
          userId: string
        }
        Update: {
          id?: number
          nickname?: string | null
          userId?: string
        }
        Relationships: []
      }
      shoppingListItems: {
        Row: {
          amount: number | null
          createdAt: string
          id: string
          ingredientId: string | null
          isChecked: boolean
          shoppingListId: string
          updatedAt: string
        }
        Insert: {
          amount?: number | null
          createdAt?: string
          id?: string
          ingredientId?: string | null
          isChecked?: boolean
          shoppingListId: string
          updatedAt?: string
        }
        Update: {
          amount?: number | null
          createdAt?: string
          id?: string
          ingredientId?: string | null
          isChecked?: boolean
          shoppingListId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoppingListItems_ingredientId_ingredients_id_fk"
            columns: ["ingredientId"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoppingListItems_shoppingListId_shoppingLists_id_fk"
            columns: ["shoppingListId"]
            isOneToOne: false
            referencedRelation: "shoppingLists"
            referencedColumns: ["id"]
          },
        ]
      }
      shoppingLists: {
        Row: {
          createdAt: string
          id: string
          mealPlanWeekStart: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          mealPlanWeekStart?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          mealPlanWeekStart?: string | null
          userId?: string
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
      ingredientCategory:
        | "dairy"
        | "meat"
        | "poultry"
        | "seafood"
        | "vegetable"
        | "fruit"
        | "grain"
        | "legume"
        | "nut_seed"
        | "spice_herb"
        | "fat_oil"
        | "sweetener"
        | "condiment"
        | "beverage"
        | "baking"
        | "other"
      mealCategory: "breakfast" | "lunch" | "dinner" | "snack"
      unit:
        | "g"
        | "kg"
        | "ml"
        | "l"
        | "tsp"
        | "tbsp"
        | "cup"
        | "oz"
        | "lb"
        | "piece"
        | "pinch"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ingredientCategory: [
        "dairy",
        "meat",
        "poultry",
        "seafood",
        "vegetable",
        "fruit",
        "grain",
        "legume",
        "nut_seed",
        "spice_herb",
        "fat_oil",
        "sweetener",
        "condiment",
        "beverage",
        "baking",
        "other",
      ],
      mealCategory: ["breakfast", "lunch", "dinner", "snack"],
      unit: [
        "g",
        "kg",
        "ml",
        "l",
        "tsp",
        "tbsp",
        "cup",
        "oz",
        "lb",
        "piece",
        "pinch",
      ],
    },
  },
} as const
