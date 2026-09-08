-- S0 Fondasi Tani Baik
-- Jalankan sekali di SQL Editor proyek Supabase (https://supabase.com/dashboard).
-- Hukum: NIK tidak di GRANT ke authenticated; tarif rawat ≠ ongkos petik.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'peran_pengguna') THEN
    CREATE TYPE public.peran_pengguna AS ENUM (
      'admin', 'pengelola', 'mandor', 'kasir', 'gudang', 'investor'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profil (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  peran public.peran_pengguna NOT NULL DEFAULT 'investor',
  nama_tampilan text NOT NULL,
  warga_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  no_rumah text NOT NULL DEFAULT '',
  no_kk text NOT NULL DEFAULT '',
  status_tetap boolean NOT NULL DEFAULT true,
  dasawisma text NOT NULL DEFAULT '',
  nik_cipher bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT warga_identitas_unik UNIQUE (nama, no_rumah, no_kk)
);

ALTER TABLE public.profil
  DROP CONSTRAINT IF EXISTS profil_warga_id_fkey;
ALTER TABLE public.profil
  ADD CONSTRAINT profil_warga_id_fkey
  FOREIGN KEY (warga_id) REFERENCES public.warga (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.parameter_sistem (
  kunci text PRIMARY KEY,
  nilai_numerik numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.parameter_sistem (kunci, nilai_numerik)
VALUES
  ('tarif_rawat_harian', 2000),
  ('ongkos_pemetik_per_kg', 2000)
ON CONFLICT (kunci) DO NOTHING;

DROP VIEW IF EXISTS public.warga_publik;
CREATE VIEW public.warga_publik
WITH (security_invoker = true) AS
SELECT id, nama, no_rumah, no_kk, status_tetap, dasawisma, created_at, updated_at
FROM public.warga;

DROP TRIGGER IF EXISTS trg_profil_updated_at ON public.profil;
CREATE TRIGGER trg_profil_updated_at
  BEFORE UPDATE ON public.profil
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_warga_updated_at ON public.warga;
CREATE TRIGGER trg_warga_updated_at
  BEFORE UPDATE ON public.warga
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_parameter_updated_at ON public.parameter_sistem;
CREATE TRIGGER trg_parameter_updated_at
  BEFORE UPDATE ON public.parameter_sistem
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.peran_saya()
RETURNS public.peran_pengguna
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT peran FROM public.profil WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.peran_saya() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  nama text;
BEGIN
  SELECT count(*) INTO admin_count FROM public.profil WHERE peran = 'admin';
  nama := coalesce(
    NEW.raw_user_meta_data ->> 'nama',
    split_part(NEW.email, '@', 1),
    'Pengguna'
  );
  INSERT INTO public.profil (id, peran, nama_tampilan)
  VALUES (
    NEW.id,
    CASE WHEN admin_count = 0 THEN 'admin'::public.peran_pengguna ELSE 'investor'::public.peran_pengguna END,
    nama
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profil (id, peran, nama_tampilan)
SELECT
  u.id,
  'investor'::public.peran_pengguna,
  coalesce(u.raw_user_meta_data ->> 'nama', split_part(u.email, '@', 1), 'Pengguna')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

UPDATE public.profil
SET peran = 'admin'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.profil WHERE peran = 'admin');

ALTER TABLE public.profil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameter_sistem ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profil_select_own_or_admin ON public.profil;
CREATE POLICY profil_select_own_or_admin ON public.profil
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.peran_saya() = 'admin');

DROP POLICY IF EXISTS profil_update_own_nama ON public.profil;
CREATE POLICY profil_update_own_nama ON public.profil
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profil_admin_update ON public.profil;
CREATE POLICY profil_admin_update ON public.profil
  FOR UPDATE TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

DROP POLICY IF EXISTS warga_select_auth ON public.warga;
CREATE POLICY warga_select_auth ON public.warga
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS warga_write_admin ON public.warga;
CREATE POLICY warga_write_admin ON public.warga
  FOR ALL TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

DROP POLICY IF EXISTS parameter_select_auth ON public.parameter_sistem;
CREATE POLICY parameter_select_auth ON public.parameter_sistem
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS parameter_update_admin ON public.parameter_sistem;
CREATE POLICY parameter_update_admin ON public.parameter_sistem
  FOR UPDATE TO authenticated
  USING (public.peran_saya() IN ('admin', 'pengelola'))
  WITH CHECK (public.peran_saya() IN ('admin', 'pengelola'));

DROP POLICY IF EXISTS parameter_insert_admin ON public.parameter_sistem;
CREATE POLICY parameter_insert_admin ON public.parameter_sistem
  FOR INSERT TO authenticated
  WITH CHECK (public.peran_saya() IN ('admin', 'pengelola'));

GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON TABLE public.warga FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.warga TO authenticated;
REVOKE ALL (nik_cipher) ON TABLE public.warga FROM authenticated;

GRANT SELECT ON TABLE public.warga_publik TO authenticated, anon;
GRANT SELECT, UPDATE, INSERT ON TABLE public.profil TO authenticated;
GRANT SELECT, UPDATE, INSERT ON TABLE public.parameter_sistem TO authenticated;
