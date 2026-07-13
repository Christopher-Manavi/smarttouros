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
      companies: {
        Row: {
          brand_color: string | null
          created_at: string
          custom_domain_placeholder: string | null
          email: string | null
          id: string
          logo_storage_path: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          custom_domain_placeholder?: string | null
          email?: string | null
          id?: string
          logo_storage_path?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          custom_domain_placeholder?: string | null
          email?: string | null
          id?: string
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          company_id: string
          created_at: string
          device_type: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          listing_id: string
          page_type: Database["public"]["Enums"]["page_type"]
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_source: string | null
          visitor_hash: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          device_type?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          listing_id: string
          page_type: Database["public"]["Enums"]["page_type"]
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_hash?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          device_type?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          listing_id?: string
          page_type?: Database["public"]["Enums"]["page_type"]
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          assigned_agent_id: string | null
          baths: number | null
          beds: number | null
          brokerage_logo_storage_path: string | null
          brokerage_logo_url: string | null
          brokerage_name: string | null
          city: string | null
          company_id: string
          created_at: string
          description: string | null
          gallery_storage_paths: string[]
          gallery_urls: string[] | null
          hero_image_storage_path: string | null
          hero_image_url: string | null
          id: string
          mls_number: string | null
          price: number | null
          primary_media_storage_path: string | null
          primary_media_type: Database["public"]["Enums"]["media_type"] | null
          primary_media_url: string | null
          secondary_media_storage_path: string | null
          secondary_media_url: string | null
          show_address_on_unbranded: boolean | null
          slug: string
          sqft: number | null
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          zip: string | null
        }
        Insert: {
          address: string
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          assigned_agent_id?: string | null
          baths?: number | null
          beds?: number | null
          brokerage_logo_storage_path?: string | null
          brokerage_logo_url?: string | null
          brokerage_name?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          gallery_storage_paths?: string[]
          gallery_urls?: string[] | null
          hero_image_storage_path?: string | null
          hero_image_url?: string | null
          id?: string
          mls_number?: string | null
          price?: number | null
          primary_media_storage_path?: string | null
          primary_media_type?: Database["public"]["Enums"]["media_type"] | null
          primary_media_url?: string | null
          secondary_media_storage_path?: string | null
          secondary_media_url?: string | null
          show_address_on_unbranded?: boolean | null
          slug: string
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          assigned_agent_id?: string | null
          baths?: number | null
          beds?: number | null
          brokerage_logo_storage_path?: string | null
          brokerage_logo_url?: string | null
          brokerage_name?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          gallery_storage_paths?: string[]
          gallery_urls?: string[] | null
          hero_image_storage_path?: string | null
          hero_image_url?: string | null
          id?: string
          mls_number?: string | null
          price?: number | null
          primary_media_storage_path?: string | null
          primary_media_type?: Database["public"]["Enums"]["media_type"] | null
          primary_media_url?: string | null
          secondary_media_storage_path?: string | null
          secondary_media_url?: string | null
          show_address_on_unbranded?: boolean | null
          slug?: string
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      media_sign_rate_limit: {
        Row: {
          bucket_key: string
          request_count: number
          window_started_at: string
        }
        Insert: {
          bucket_key: string
          request_count?: number
          window_started_at: string
        }
        Update: {
          bucket_key?: string
          request_count?: number
          window_started_at?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          company_id: string
          created_at: string
          crm_export_enabled: boolean | null
          direct_mail_enabled: boolean | null
          id: string
          privacy_notice_text: string | null
          privacy_policy_url: string | null
          show_privacy_notice: boolean | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          crm_export_enabled?: boolean | null
          direct_mail_enabled?: boolean | null
          id?: string
          privacy_notice_text?: string | null
          privacy_policy_url?: string | null
          show_privacy_notice?: boolean | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          crm_export_enabled?: boolean | null
          direct_mail_enabled?: boolean | null
          id?: string
          privacy_notice_text?: string | null
          privacy_policy_url?: string | null
          show_privacy_notice?: boolean | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resolved_visitors: {
        Row: {
          city: string | null
          company_id: string
          created_at: string
          email: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          listing_id: string | null
          mailing_address: string | null
          name: string | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["visitor_status"]
          zip: string | null
        }
        Insert: {
          city?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          listing_id?: string | null
          mailing_address?: string | null
          name?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["visitor_status"]
          zip?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          listing_id?: string | null
          mailing_address?: string | null
          name?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["visitor_status"]
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resolved_visitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolved_visitors_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_agents: {
        Row: {
          brokerage: string | null
          campaign_id: string
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          import_source: string
          last_name: string | null
          listing_count: number | null
          phone: string | null
          postal_code: string | null
          profile_url: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          brokerage?: string | null
          campaign_id: string
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          import_source?: string
          last_name?: string | null
          listing_count?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          brokerage?: string | null
          campaign_id?: string
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          import_source?: string
          last_name?: string | null
          listing_count?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_agents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_audit_events: {
        Row: {
          actor_type: string
          actor_user_id: string | null
          campaign_id: string | null
          created_at: string
          event_type: string
          id: string
          match_id: string | null
          sanitized_metadata: Json
        }
        Insert: {
          actor_type: string
          actor_user_id?: string | null
          campaign_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          match_id?: string | null
          sanitized_metadata?: Json
        }
        Update: {
          actor_type?: string
          actor_user_id?: string | null
          campaign_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string | null
          sanitized_metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_audit_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_audit_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          created_by: string | null
          feature_flag_snapshot: boolean
          id: string
          market_city: string | null
          market_state: string | null
          status: string
          updated_at: string
          zip_codes: string[]
        }
        Insert: {
          campaign_name: string
          created_at?: string
          created_by?: string | null
          feature_flag_snapshot?: boolean
          id?: string
          market_city?: string | null
          market_state?: string | null
          status?: string
          updated_at?: string
          zip_codes?: string[]
        }
        Update: {
          campaign_name?: string
          created_at?: string
          created_by?: string | null
          feature_flag_snapshot?: boolean
          id?: string
          market_city?: string | null
          market_state?: string | null
          status?: string
          updated_at?: string
          zip_codes?: string[]
        }
        Relationships: []
      }
      sponsorship_lenders: {
        Row: {
          campaign_id: string
          city: string | null
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          headshot_url: string | null
          id: string
          last_name: string | null
          logo_url: string | null
          max_current_sponsorships: number
          nmls_number: string | null
          phone: string | null
          service_areas: string[]
          service_zip_codes: string[]
          state: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          city?: string | null
          company?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          headshot_url?: string | null
          id?: string
          last_name?: string | null
          logo_url?: string | null
          max_current_sponsorships?: number
          nmls_number?: string | null
          phone?: string | null
          service_areas?: string[]
          service_zip_codes?: string[]
          state?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          headshot_url?: string | null
          id?: string
          last_name?: string | null
          logo_url?: string | null
          max_current_sponsorships?: number
          nmls_number?: string | null
          phone?: string | null
          service_areas?: string[]
          service_zip_codes?: string[]
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_lenders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_matches: {
        Row: {
          activated_at: string | null
          agent_id: string
          agent_invited_at: string | null
          agent_responded_at: string | null
          agent_viewed_at: string | null
          annual_price_cents: number
          campaign_id: string
          created_at: string
          id: string
          lender_id: string
          lender_notified_at: string | null
          lender_responded_at: string | null
          lender_viewed_at: string | null
          status: Database["public"]["Enums"]["sponsorship_match_status"]
          terminated_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          agent_id: string
          agent_invited_at?: string | null
          agent_responded_at?: string | null
          agent_viewed_at?: string | null
          annual_price_cents?: number
          campaign_id: string
          created_at?: string
          id?: string
          lender_id: string
          lender_notified_at?: string | null
          lender_responded_at?: string | null
          lender_viewed_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_match_status"]
          terminated_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          agent_id?: string
          agent_invited_at?: string | null
          agent_responded_at?: string | null
          agent_viewed_at?: string | null
          annual_price_cents?: number
          campaign_id?: string
          created_at?: string
          id?: string
          lender_id?: string
          lender_notified_at?: string | null
          lender_responded_at?: string | null
          lender_viewed_at?: string | null
          status?: Database["public"]["Enums"]["sponsorship_match_status"]
          terminated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_matches_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_matches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_matches_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_settings: {
        Row: {
          company_id: string
          created_at: string
          custom_footer_script: string | null
          custom_header_script: string | null
          enable_analytics_dashboard: boolean | null
          enable_branded_tracking: boolean | null
          enable_privacy_banner: boolean | null
          enable_unbranded_tracking: boolean | null
          ga_script: string | null
          id: string
          meta_pixel_script: string | null
          untitled_script: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_footer_script?: string | null
          custom_header_script?: string | null
          enable_analytics_dashboard?: boolean | null
          enable_branded_tracking?: boolean | null
          enable_privacy_banner?: boolean | null
          enable_unbranded_tracking?: boolean | null
          ga_script?: string | null
          id?: string
          meta_pixel_script?: string | null
          untitled_script?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_footer_script?: string | null
          custom_header_script?: string | null
          enable_analytics_dashboard?: boolean | null
          enable_branded_tracking?: boolean | null
          enable_privacy_banner?: boolean | null
          enable_unbranded_tracking?: boolean | null
          ga_script?: string | null
          id?: string
          meta_pixel_script?: string | null
          untitled_script?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
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
          role: Database["public"]["Enums"]["app_role"]
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
      extract_supabase_object_path: {
        Args: { p_bucket: string; p_url: string }
        Returns: string
      }
      get_my_company_id: { Args: never; Returns: string }
      get_public_branded_tour: { Args: { p_slug: string }; Returns: Json }
      get_public_unbranded_tour: { Args: { p_slug: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_public_event: {
        Args: {
          p_device_type: string
          p_event_type: string
          p_page_type: string
          p_referrer: string
          p_slug: string
          p_user_agent: string
          p_utm_campaign: string
          p_utm_source: string
          p_visitor_hash: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "agent"
      event_type:
        | "page_view"
        | "media_click"
        | "video_play"
        | "cta_click"
        | "outbound_click"
      listing_status: "draft" | "active" | "archived"
      media_type:
        | "youtube"
        | "vimeo"
        | "matterport"
        | "mux"
        | "cloudpano"
        | "iframe"
        | "video_url"
      page_type: "branded" | "unbranded"
      sponsorship_match_status:
        | "draft"
        | "ready"
        | "agent_invitation_pending"
        | "agent_invited"
        | "agent_viewed"
        | "agent_accepted"
        | "agent_declined"
        | "lender_notification_pending"
        | "lender_notified"
        | "lender_viewed"
        | "payment_pending"
        | "paid"
        | "active"
        | "expired"
        | "reassigned"
        | "cancelled"
      visitor_status: "new" | "exported" | "suppressed"
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
      app_role: ["super_admin", "company_admin", "agent"],
      event_type: [
        "page_view",
        "media_click",
        "video_play",
        "cta_click",
        "outbound_click",
      ],
      listing_status: ["draft", "active", "archived"],
      media_type: [
        "youtube",
        "vimeo",
        "matterport",
        "mux",
        "cloudpano",
        "iframe",
        "video_url",
      ],
      page_type: ["branded", "unbranded"],
      sponsorship_match_status: [
        "draft",
        "ready",
        "agent_invitation_pending",
        "agent_invited",
        "agent_viewed",
        "agent_accepted",
        "agent_declined",
        "lender_notification_pending",
        "lender_notified",
        "lender_viewed",
        "payment_pending",
        "paid",
        "active",
        "expired",
        "reassigned",
        "cancelled",
      ],
      visitor_status: ["new", "exported", "suppressed"],
    },
  },
} as const
