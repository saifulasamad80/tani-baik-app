import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Database, FileText, Sheet, TableProperties } from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { useKasHarianRows, useWorkbookRows } from "@/hooks/use-workbook-rows";
import { angka, rupiah } from "@/lib/farm-data";

export const Route = createFileRoute("/workbook")({
  head: () => ({
    meta: [
      { title: `Workbook Data — ${BRAND_NAME}` },
      {
        name: "description",
        content: "Seluruh baris workbook mentah dari Supabase workbook_rows.",
      },
    ],
  }),
  component: WorkbookPage,
});

function WorkbookPage() {
  const rowsQuery = useWorkbookRows();
  const kasQuery = useKasHarianRows();
  const rows = rowsQuery.data ?? [];
  const kasRows = kasQuery.data ?? [];

  const sheetSummary = useMemo(() => {
    const map = new Map<string, { sheet: string; rows: number; source: string; preview: string }>();
    for (const row of rows) {
      const values = rowValues(row.row_data);
      const existing = map.get(row.sheet_name);
      const preview = values.map((value) => String(value ?? "").trim()).filter(Boolean).slice(0, 3).join(" | ");
      if (existing) {
        existing.rows += 1;
        if (!existing.preview && preview) existing.preview = preview;
      } else {
        map.set(row.sheet_name, {
          sheet: row.sheet_name,
          rows: 1,
          source: row.source_file,
          preview,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.sheet.localeCompare(b.sheet));
  }, [rows]);

  const totalMasuk = kasRows.reduce((acc, row) => acc + row.masuk, 0);
  const totalKeluar = kasRows.reduce((acc, row) => acc + row.keluar, 0);
  const sumber = sheetSummary[0]?.source ?? "Supabase workbook_rows";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sumber Data"
        title="Workbook Data"
        description="Data di halaman ini dibaca langsung dari tabel Supabase workbook_rows."
        actions={
          <Badge variant={rowsQuery.isFetching ? "outline" : "secondary"}>
            {rowsQuery.isFetching ? "Memuat" : "Live Supabase"}
          </Badge>
        }
      />

      {rowsQuery.isError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gagal memuat workbook_rows dari Supabase.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sheet"
          value={angka(sheetSummary.length)}
          sub={sumber}
          icon={<Sheet className="size-4" />}
          tone="primary"
        />
        <StatCard
          label="Raw Rows"
          value={angka(rows.length)}
          sub="Semua baris workbook"
          icon={<Database className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Kas Harian"
          value={angka(kasRows.length)}
          sub="Baris ledger terstruktur"
          icon={<TableProperties className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Saldo CSV"
          value={rupiah(totalMasuk - totalKeluar)}
          sub={`${rupiah(totalMasuk)} masuk`}
          icon={<FileText className="size-4" />}
        />
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Sheet Workbook</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Sheet</th>
                <th className="px-4 py-2 text-right font-medium">Rows</th>
                <th className="px-4 py-2 text-left font-medium">Source File</th>
                <th className="px-4 py-2 text-left font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {sheetSummary.map((sheet) => (
                <tr key={sheet.sheet} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2 font-medium">{sheet.sheet}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{angka(sheet.rows)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{sheet.source}</td>
                  <td className="px-4 py-2 text-muted-foreground">{sheet.preview || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Kas Harian CSV</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                <th className="px-4 py-2 text-left font-medium">Uraian</th>
                <th className="px-4 py-2 text-right font-medium">Masuk</th>
                <th className="px-4 py-2 text-right font-medium">Keluar</th>
                <th className="px-4 py-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {kasRows.map((row) => (
                <tr key={row.row_index} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2 text-muted-foreground">{row.tanggal}</td>
                  <td className="px-4 py-2 font-medium">{row.uraian}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.masuk ? rupiah(row.masuk) : "-"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.keluar ? rupiah(row.keluar) : "-"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.saldo ? rupiah(row.saldo) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-xl border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold">Raw JSON Supabase workbook_rows</summary>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/40 p-4 text-xs leading-5">
          {JSON.stringify(rows, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function rowValues(rowData: { values?: unknown[] } | unknown[]): unknown[] {
  if (Array.isArray(rowData)) return rowData;
  return Array.isArray(rowData.values) ? rowData.values : [];
}
