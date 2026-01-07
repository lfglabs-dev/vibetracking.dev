export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          github_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          github_id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          tool: string;
          message_count: number;
          session_count: number;
          total_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          tool: string;
          message_count?: number;
          session_count?: number;
          total_tokens?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          tool?: string;
          message_count?: number;
          session_count?: number;
          total_tokens?: number;
          created_at?: string;
        };
      };
      token_usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          tool: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          tool: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          tool?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          total_tokens: number;
          total_sessions: number;
          favorite_model: string | null;
          favorite_tool: string | null;
          longest_session_ms: number;
          longest_streak_days: number;
          current_streak_days: number;
          first_activity_date: string | null;
          last_activity_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_tokens?: number;
          total_sessions?: number;
          favorite_model?: string | null;
          favorite_tool?: string | null;
          longest_session_ms?: number;
          longest_streak_days?: number;
          current_streak_days?: number;
          first_activity_date?: string | null;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_tokens?: number;
          total_sessions?: number;
          favorite_model?: string | null;
          favorite_tool?: string | null;
          longest_session_ms?: number;
          longest_streak_days?: number;
          current_streak_days?: number;
          first_activity_date?: string | null;
          last_activity_date?: string | null;
          updated_at?: string;
        };
      };
      sync_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
