
-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'agent');
CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE public.media_type AS ENUM ('youtube','vimeo','matterport','mux','cloudpano','iframe','video_url');
CREATE TYPE public.event_type AS ENUM ('page_view','media_click','video_play','cta_click','outbound_click');
CREATE TYPE public.page_type AS ENUM ('branded','unbranded');
CREATE TYPE public.visitor_status AS ENUM ('new','exported','suppressed');

-- Utility: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#0a0a0a',
  phone TEXT,
  email TEXT,
  custom_domain_placeholder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  price NUMERIC,
  beds INT,
  baths NUMERIC,
  sqft INT,
  description TEXT,
  hero_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  primary_media_type public.media_type,
  primary_media_url TEXT,
  secondary_media_url TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  agent_email TEXT,
  brokerage_name TEXT,
  brokerage_logo_url TEXT,
  mls_number TEXT,
  status public.listing_status NOT NULL DEFAULT 'draft',
  slug TEXT NOT NULL UNIQUE,
  show_address_on_unbranded BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_listings_company ON public.listings(company_id);
CREATE INDEX idx_listings_slug ON public.listings(slug);

-- Tracking settings
CREATE TABLE public.tracking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  untitled_script TEXT,
  ga_script TEXT,
  meta_pixel_script TEXT,
  custom_header_script TEXT,
  custom_footer_script TEXT,
  enable_branded_tracking BOOLEAN DEFAULT TRUE,
  enable_unbranded_tracking BOOLEAN DEFAULT TRUE,
  enable_analytics_dashboard BOOLEAN DEFAULT TRUE,
  enable_privacy_banner BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracking_settings TO authenticated;
GRANT SELECT ON public.tracking_settings TO anon;
GRANT ALL ON public.tracking_settings TO service_role;
ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tracking_updated BEFORE UPDATE ON public.tracking_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Privacy settings
CREATE TABLE public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  privacy_policy_url TEXT,
  terms_url TEXT,
  show_privacy_notice BOOLEAN DEFAULT TRUE,
  direct_mail_enabled BOOLEAN DEFAULT FALSE,
  crm_export_enabled BOOLEAN DEFAULT FALSE,
  privacy_notice_text TEXT DEFAULT 'This page may use cookies and similar technologies for analytics, marketing attribution, and listing performance measurement.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_settings TO authenticated;
GRANT SELECT ON public.privacy_settings TO anon;
GRANT ALL ON public.privacy_settings TO service_role;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_privacy_updated BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  page_type public.page_type NOT NULL,
  event_type public.event_type NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  device_type TEXT,
  visitor_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.events TO authenticated;
GRANT INSERT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_listing ON public.events(listing_id);
CREATE INDEX idx_events_company ON public.events(company_id);
CREATE INDEX idx_events_created ON public.events(created_at DESC);

-- Resolved visitors
CREATE TABLE public.resolved_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  mailing_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  status public.visitor_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resolved_visitors TO authenticated;
GRANT ALL ON public.resolved_visitors TO service_role;
ALTER TABLE public.resolved_visitors ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- companies
CREATE POLICY "super admin all companies" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "members view own company" ON public.companies FOR SELECT TO authenticated
  USING (id = public.get_my_company_id());
CREATE POLICY "company admins update own" ON public.companies FOR UPDATE TO authenticated
  USING (id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'))
  WITH CHECK (id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'));
CREATE POLICY "anon view companies" ON public.companies FOR SELECT TO anon USING (true);

-- profiles
CREATE POLICY "user reads own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin')
         OR (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin')));
CREATE POLICY "user updates own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "super admin manages profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- user_roles
CREATE POLICY "user reads own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- listings
CREATE POLICY "super admin listings all" ON public.listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "company members read listings" ON public.listings FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());
CREATE POLICY "company admins manage listings" ON public.listings FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'))
  WITH CHECK (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'));
CREATE POLICY "anon read active listings" ON public.listings FOR SELECT TO anon USING (status='active');

-- tracking_settings
CREATE POLICY "super admin tracking all" ON public.tracking_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "company members read tracking" ON public.tracking_settings FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());
CREATE POLICY "company admins manage tracking" ON public.tracking_settings FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'))
  WITH CHECK (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'));
CREATE POLICY "anon read tracking" ON public.tracking_settings FOR SELECT TO anon USING (true);

-- privacy_settings
CREATE POLICY "super admin privacy all" ON public.privacy_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "company members read privacy" ON public.privacy_settings FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());
CREATE POLICY "company admins manage privacy" ON public.privacy_settings FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'))
  WITH CHECK (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'));
CREATE POLICY "anon read privacy" ON public.privacy_settings FOR SELECT TO anon USING (true);

-- events
CREATE POLICY "super admin reads events" ON public.events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "company members read events" ON public.events FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());
CREATE POLICY "anon inserts events" ON public.events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated inserts events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);

-- resolved_visitors
CREATE POLICY "super admin visitors all" ON public.resolved_visitors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "company members read visitors" ON public.resolved_visitors FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());
CREATE POLICY "company admins manage visitors" ON public.resolved_visitors FOR ALL TO authenticated
  USING (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'))
  WITH CHECK (company_id = public.get_my_company_id() AND public.has_role(auth.uid(),'company_admin'));

-- ============ Signup trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  user_count INT;
  new_company_id UUID;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF user_count <= 1 THEN
    -- First user = super_admin + creates a default company
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
    INSERT INTO public.companies (name, email) VALUES ('SmartTourOS HQ', NEW.email)
      RETURNING id INTO new_company_id;
    UPDATE public.profiles SET company_id = new_company_id WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'company_admin');
    INSERT INTO public.tracking_settings (company_id) VALUES (new_company_id);
    INSERT INTO public.privacy_settings (company_id) VALUES (new_company_id);
  ELSE
    -- Subsequent users: create their own company as company_admin (simple MVP behavior)
    INSERT INTO public.companies (name, email)
      VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'), NEW.email)
      RETURNING id INTO new_company_id;
    UPDATE public.profiles SET company_id = new_company_id WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'company_admin');
    INSERT INTO public.tracking_settings (company_id) VALUES (new_company_id);
    INSERT INTO public.privacy_settings (company_id) VALUES (new_company_id);
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
