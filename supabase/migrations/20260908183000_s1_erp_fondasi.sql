-- S1 ERP Fondasi Tani Baik
-- Skema inti untuk livestock, lineage, financial ledger, ownership, dan waste conversion.

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

CREATE TABLE IF NOT EXISTS public.livestock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text NOT NULL UNIQUE,
  species text NOT NULL,
  breed text NOT NULL DEFAULT '',
  sex text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'active',
  mother_id uuid REFERENCES public.livestock (id) ON DELETE SET NULL,
  father_id uuid REFERENCES public.livestock (id) ON DELETE SET NULL,
  birth_date date,
  acquired_on date NOT NULL DEFAULT current_date,
  current_weight_kg numeric(10,2) NOT NULL DEFAULT 0,
  contest_value numeric(14,2) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT livestock_sex_check CHECK (sex IN ('male', 'female', 'unknown')),
  CONSTRAINT livestock_status_check CHECK (status IN ('active', 'quarantine', 'sold', 'archived', 'deceased')),
  CONSTRAINT livestock_weight_check CHECK (current_weight_kg >= 0),
  CONSTRAINT livestock_contest_value_check CHECK (contest_value >= 0)
);

CREATE TABLE IF NOT EXISTS public.investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT investors_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS public.ownership_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL REFERENCES public.livestock (id) ON DELETE RESTRICT,
  investor_id uuid NOT NULL REFERENCES public.investors (id) ON DELETE RESTRICT,
  ownership_role text NOT NULL DEFAULT 'investor',
  share_percent numeric(5,2) NOT NULL,
  effective_from date NOT NULL DEFAULT current_date,
  effective_to date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ownership_shares_percent_check CHECK (share_percent > 0 AND share_percent <= 100),
  CONSTRAINT ownership_shares_role_check CHECK (ownership_role IN ('investor', 'manager', 'partner', 'custodian')),
  CONSTRAINT ownership_shares_date_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT ownership_shares_unique UNIQUE (livestock_id, investor_id)
);

CREATE TABLE IF NOT EXISTS public.financial_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_date date NOT NULL DEFAULT current_date,
  ledger_type text NOT NULL,
  livestock_id uuid REFERENCES public.livestock (id) ON DELETE SET NULL,
  investor_id uuid REFERENCES public.investors (id) ON DELETE SET NULL,
  reference_code text,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'day/head',
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  currency char(3) NOT NULL DEFAULT 'IDR',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_ledgers_type_check CHECK (ledger_type IN ('hpp', 'maintenance', 'purchase', 'sale', 'adjustment')),
  CONSTRAINT financial_ledgers_quantity_check CHECK (quantity > 0),
  CONSTRAINT financial_ledgers_unit_cost_check CHECK (unit_cost >= 0)
);

CREATE TABLE IF NOT EXISTS public.waste_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_date date NOT NULL DEFAULT current_date,
  livestock_id uuid NOT NULL REFERENCES public.livestock (id) ON DELETE RESTRICT,
  source_material text NOT NULL DEFAULT 'manure',
  output_inventory_name text NOT NULL,
  output_form text NOT NULL,
  output_unit text NOT NULL,
  source_quantity numeric(12,2) NOT NULL,
  output_quantity numeric(12,2) NOT NULL,
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waste_conversions_form_check CHECK (output_form IN ('solid', 'liquid')),
  CONSTRAINT waste_conversions_unit_check CHECK (output_unit IN ('Kg', 'Drum')),
  CONSTRAINT waste_conversions_source_quantity_check CHECK (source_quantity > 0),
  CONSTRAINT waste_conversions_output_quantity_check CHECK (output_quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_livestock_mother_id ON public.livestock (mother_id);
CREATE INDEX IF NOT EXISTS idx_livestock_father_id ON public.livestock (father_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledgers_livestock_id ON public.financial_ledgers (livestock_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledgers_investor_id ON public.financial_ledgers (investor_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledgers_date ON public.financial_ledgers (ledger_date);
CREATE INDEX IF NOT EXISTS idx_ownership_shares_livestock_id ON public.ownership_shares (livestock_id);
CREATE INDEX IF NOT EXISTS idx_ownership_shares_investor_id ON public.ownership_shares (investor_id);
CREATE INDEX IF NOT EXISTS idx_waste_conversions_livestock_id ON public.waste_conversions (livestock_id);

DROP TRIGGER IF EXISTS trg_livestock_updated_at ON public.livestock;
CREATE TRIGGER trg_livestock_updated_at
  BEFORE UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_investors_updated_at ON public.investors;
CREATE TRIGGER trg_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ownership_shares_updated_at ON public.ownership_shares;
CREATE TRIGGER trg_ownership_shares_updated_at
  BEFORE UPDATE ON public.ownership_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_financial_ledgers_updated_at ON public.financial_ledgers;
CREATE TRIGGER trg_financial_ledgers_updated_at
  BEFORE UPDATE ON public.financial_ledgers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_waste_conversions_updated_at ON public.waste_conversions;
CREATE TRIGGER trg_waste_conversions_updated_at
  BEFORE UPDATE ON public.waste_conversions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_conversions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.livestock FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.investors FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.ownership_shares FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.financial_ledgers FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.waste_conversions FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.livestock TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.investors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ownership_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_ledgers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.waste_conversions TO authenticated;

DROP POLICY IF EXISTS livestock_authenticated_all ON public.livestock;
CREATE POLICY livestock_authenticated_all
  ON public.livestock
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS investors_authenticated_all ON public.investors;
CREATE POLICY investors_authenticated_all
  ON public.investors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS ownership_shares_authenticated_all ON public.ownership_shares;
CREATE POLICY ownership_shares_authenticated_all
  ON public.ownership_shares
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS financial_ledgers_authenticated_all ON public.financial_ledgers;
CREATE POLICY financial_ledgers_authenticated_all
  ON public.financial_ledgers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS waste_conversions_authenticated_all ON public.waste_conversions;
CREATE POLICY waste_conversions_authenticated_all
  ON public.waste_conversions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
