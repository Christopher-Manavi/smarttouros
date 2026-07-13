
BEGIN;

-- =============================================================================
-- Sponsorship Engine Phase 1 — isolated schema
-- All objects are prefixed sponsorship_* and do not touch any existing object.
-- =============================================================================

-- Enum: single canonical workflow status
CREATE TYPE public.sponsorship_match_status AS ENUM (
  'draft',
  'ready',
  'agent_invitation_pending',
  'agent_invited',
  'agent_viewed',
  'agent_accepted',
  'agent_declined',
  'lender_notification_pending',
  'lender_notified',
  'lender_viewed',
  'payment_pending',
  'paid',
  'active',
  'expired',
  'reassigned',
  'cancelled'
);

-- =============================================================================
-- sponsorship_campaigns
-- =============================================================================
CREATE TABLE public.sponsorship_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  market_city text,
  market_state text,
  zip_codes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','active','archived')),
  feature_flag_snapshot boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorship_campaigns TO authenticated;
GRANT ALL ON public.sponsorship_campaigns TO service_role;

ALTER TABLE public.sponsorship_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin select campaigns"
  ON public.sponsorship_campaigns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin insert campaigns"
  ON public.sponsorship_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin update campaigns"
  ON public.sponsorship_campaigns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin delete campaigns"
  ON public.sponsorship_campaigns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER sponsorship_campaigns_set_updated_at
  BEFORE UPDATE ON public.sponsorship_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- sponsorship_agents
-- =============================================================================
CREATE TABLE public.sponsorship_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsorship_campaigns(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text NOT NULL CHECK (email = lower(email)),
  phone text,
  brokerage text,
  city text,
  state text,
  postal_code text,
  listing_count integer CHECK (listing_count IS NULL OR listing_count >= 0),
  profile_url text,
  import_source text NOT NULL DEFAULT 'manual'
    CHECK (import_source IN ('paste','csv','manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sponsorship_agents_campaign_email_uidx
  ON public.sponsorship_agents (campaign_id, lower(email));
CREATE INDEX sponsorship_agents_campaign_id_idx
  ON public.sponsorship_agents (campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorship_agents TO authenticated;
GRANT ALL ON public.sponsorship_agents TO service_role;

ALTER TABLE public.sponsorship_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin select agents"
  ON public.sponsorship_agents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin insert agents"
  ON public.sponsorship_agents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin update agents"
  ON public.sponsorship_agents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin delete agents"
  ON public.sponsorship_agents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER sponsorship_agents_set_updated_at
  BEFORE UPDATE ON public.sponsorship_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- sponsorship_lenders
-- =============================================================================
CREATE TABLE public.sponsorship_lenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsorship_campaigns(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text NOT NULL CHECK (email = lower(email)),
  phone text,
  company text,
  nmls_number text CHECK (nmls_number IS NULL OR nmls_number ~ '^[0-9]{5,10}$'),
  city text,
  state text,
  service_areas text[] NOT NULL DEFAULT '{}',
  service_zip_codes text[] NOT NULL DEFAULT '{}',
  max_current_sponsorships integer NOT NULL DEFAULT 5
    CHECK (max_current_sponsorships >= 0),
  headshot_url text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sponsorship_lenders_campaign_email_uidx
  ON public.sponsorship_lenders (campaign_id, lower(email));
CREATE INDEX sponsorship_lenders_campaign_id_idx
  ON public.sponsorship_lenders (campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorship_lenders TO authenticated;
GRANT ALL ON public.sponsorship_lenders TO service_role;

ALTER TABLE public.sponsorship_lenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin select lenders"
  ON public.sponsorship_lenders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin insert lenders"
  ON public.sponsorship_lenders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin update lenders"
  ON public.sponsorship_lenders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin delete lenders"
  ON public.sponsorship_lenders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER sponsorship_lenders_set_updated_at
  BEFORE UPDATE ON public.sponsorship_lenders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- sponsorship_matches
-- =============================================================================
CREATE TABLE public.sponsorship_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsorship_campaigns(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.sponsorship_agents(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL REFERENCES public.sponsorship_lenders(id) ON DELETE CASCADE,
  status public.sponsorship_match_status NOT NULL DEFAULT 'draft',
  annual_price_cents integer NOT NULL DEFAULT 99900
    CHECK (annual_price_cents >= 0),
  agent_invited_at timestamptz,
  agent_viewed_at timestamptz,
  agent_responded_at timestamptz,
  lender_notified_at timestamptz,
  lender_viewed_at timestamptz,
  lender_responded_at timestamptz,
  activated_at timestamptz,
  terminated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsorship_matches_terminal_has_terminated_at CHECK (
    status NOT IN ('agent_declined','expired','reassigned','cancelled')
    OR terminated_at IS NOT NULL
  )
);

-- One current (non-terminal) match per agent — hard backstop for idempotent matching.
CREATE UNIQUE INDEX sponsorship_matches_one_current_per_agent
  ON public.sponsorship_matches (agent_id)
  WHERE status IN (
    'draft','ready',
    'agent_invitation_pending','agent_invited','agent_viewed','agent_accepted',
    'lender_notification_pending','lender_notified','lender_viewed',
    'payment_pending','paid','active'
  );

CREATE INDEX sponsorship_matches_campaign_id_idx ON public.sponsorship_matches (campaign_id);
CREATE INDEX sponsorship_matches_lender_status_idx ON public.sponsorship_matches (lender_id, status);
CREATE INDEX sponsorship_matches_agent_status_idx ON public.sponsorship_matches (agent_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorship_matches TO authenticated;
GRANT ALL ON public.sponsorship_matches TO service_role;

ALTER TABLE public.sponsorship_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin select matches"
  ON public.sponsorship_matches FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin insert matches"
  ON public.sponsorship_matches FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin update matches"
  ON public.sponsorship_matches FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin delete matches"
  ON public.sponsorship_matches FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER sponsorship_matches_set_updated_at
  BEFORE UPDATE ON public.sponsorship_matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- sponsorship_audit_events (append-only)
-- =============================================================================
CREATE TABLE public.sponsorship_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NULL REFERENCES public.sponsorship_campaigns(id) ON DELETE CASCADE,
  match_id uuid NULL REFERENCES public.sponsorship_matches(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_type text NOT NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sanitized_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sponsorship_audit_events_campaign_id_idx
  ON public.sponsorship_audit_events (campaign_id, created_at DESC);
CREATE INDEX sponsorship_audit_events_match_id_idx
  ON public.sponsorship_audit_events (match_id, created_at DESC);

GRANT SELECT, INSERT ON public.sponsorship_audit_events TO authenticated;
GRANT ALL ON public.sponsorship_audit_events TO service_role;

ALTER TABLE public.sponsorship_audit_events ENABLE ROW LEVEL SECURITY;

-- Append-only: no UPDATE / DELETE policy for anyone but service_role.
CREATE POLICY "super_admin select audit"
  ON public.sponsorship_audit_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "super_admin insert audit"
  ON public.sponsorship_audit_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

COMMIT;
