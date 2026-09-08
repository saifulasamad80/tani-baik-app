-- Workbook rows source of truth for Tani Baik demo data

CREATE TABLE IF NOT EXISTS public.workbook_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name text NOT NULL,
  row_index integer NOT NULL,
  row_data jsonb NOT NULL,
  source_file text NOT NULL DEFAULT 'Workbook_Profesional_Benih_Tani_Baik R00.xlsx',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workbook_rows_unique UNIQUE (sheet_name, row_index)
);

CREATE INDEX IF NOT EXISTS idx_workbook_rows_sheet_name ON public.workbook_rows (sheet_name);
CREATE INDEX IF NOT EXISTS idx_workbook_rows_row_index ON public.workbook_rows (row_index);

DROP TRIGGER IF EXISTS trg_workbook_rows_updated_at ON public.workbook_rows;
CREATE TRIGGER trg_workbook_rows_updated_at
  BEFORE UPDATE ON public.workbook_rows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workbook_rows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workbook_rows FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workbook_rows TO authenticated;

DROP POLICY IF EXISTS workbook_rows_authenticated_all ON public.workbook_rows;
CREATE POLICY workbook_rows_authenticated_all
  ON public.workbook_rows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
