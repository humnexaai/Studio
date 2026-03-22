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
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          price_inr: number;
          monthly_credits: number;
          hard_cap: number;
          daily_cap: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["plans"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          plan_id: string | null;
          credits_balance: number;
          monthly_used: number;
          onboarding_completed?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      user_settings: {
        Row: {
          id: string;
          theme: "dark" | "light" | "system";
          chat_mode: "chat" | "chat_code" | "full_control";
          hindi_mode: boolean;
          editor_font_size: number;
          editor_tab_size: number;
          editor_font_family: string;
          onboarding_step: number;
          category_preference: string | null;
          app_category?: string | null;
          work_preference?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_settings"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Row"]>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          framework: string;
          status: string;
          github_url: string | null;
          github_full_name?: string | null;
          vercel_project_id?: string | null;
          deployed_url: string | null;
          branch_name?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          file_path: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_files"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_files"]["Row"]>;
      };
      project_versions: {
        Row: {
          id: string;
          project_id: string;
          label: string;
          snapshot: Json;
          bookmarked: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_versions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_versions"]["Row"]>;
      };
      conversations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          credits_used: number;
          code_diffs: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: "usage" | "purchase" | "refund" | "bonus";
          reason: string | null;
          metadata?: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_transactions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_transactions"]["Row"]>;
      };
      deployments: {
        Row: {
          id: string;
          project_id: string;
          provider: string;
          status: string;
          logs: string | null;
          deployed_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deployments"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deployments"]["Row"]>;
      };
      payment_orders: {
        Row: {
          id: string;
          user_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          amount: number;
          currency: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["payment_orders"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_orders"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
