import { supabase } from "@/lib/supabase";

export type WorkbookRowRecord = {
  sheet_name: string;
  row_index: number;
  row_data: { values?: unknown[] } | unknown[];
  source_file: string;
};

export type LedgerRow = {
  tanggal: string;
  uraian: string;
  masuk: number;
  keluar: number;
  saldo: number;
  row_index: number;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"] as const;

const toValues = (row_data: WorkbookRowRecord["row_data"]): unknown[] => {
  if (Array.isArray(row_data)) return row_data;
  if (row_data && typeof row_data === "object" && Array.isArray(row_data.values)) {
    return row_data.values;
  }
  return [];
};

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = toText(value).replace(/[^\d.-]/g, "");
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function muatWorkbookRows(sheetName?: string): Promise<WorkbookRowRecord[]> {
  let query = supabase
    .from("workbook_rows")
    .select("sheet_name,row_index,row_data,source_file")
    .order("sheet_name", { ascending: true })
    .order("row_index", { ascending: true });

  if (sheetName) {
    query = query.eq("sheet_name", sheetName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WorkbookRowRecord[];
}

export function parseKasHarian(rows: WorkbookRowRecord[]): LedgerRow[] {
  const ordered = [...rows].sort((a, b) => a.row_index - b.row_index);
  const headerIndex = ordered.findIndex((row) => {
    const values = toValues(row.row_data);
    return toText(values[0]).toLowerCase() === "tanggal";
  });
  if (headerIndex < 0) return [];

  let currentDate = "";
  const result: LedgerRow[] = [];

  for (const row of ordered.slice(headerIndex + 1)) {
    const values = toValues(row.row_data);
    const tanggal = toText(values[0]);
    const uraian = toText(values[1]);
    const masuk = toNumber(values[2]);
    const keluar = toNumber(values[3]);
    const saldo = toNumber(values[4]);

    if (!tanggal && !uraian && !masuk && !keluar && !saldo) continue;
    if (/^t\s*o\s*t\s*a\s*l$/i.test(uraian) || /^t\s*o\s*t\s*a\s*l$/i.test(tanggal)) continue;
    if (tanggal) currentDate = tanggal;

    if (!currentDate || !uraian) continue;

    result.push({
      tanggal: currentDate,
      uraian,
      masuk,
      keluar,
      saldo,
      row_index: row.row_index,
    });
  }

  return result;
}

export function ringkasKasHarian(rows: LedgerRow[]) {
  const totalPendapatan = rows.reduce((acc, row) => acc + row.masuk, 0);
  const totalBiaya = rows.reduce((acc, row) => acc + row.keluar, 0);
  const laba = totalPendapatan - totalBiaya;
  const margin = totalPendapatan > 0 ? (laba / totalPendapatan) * 100 : 0;

  const perBulan = new Map<number, { masuk: number; keluar: number }>();
  for (const row of rows) {
    const match = row.tanggal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!match) continue;
    const bulan = Number(match[1]);
    const bucket = perBulan.get(bulan) ?? { masuk: 0, keluar: 0 };
    bucket.masuk += row.masuk;
    bucket.keluar += row.keluar;
    perBulan.set(bulan, bucket);
  }

  const chartData = MONTH_LABELS.map((bulan, index) => {
    const bucket = perBulan.get(index + 1) ?? { masuk: 0, keluar: 0 };
    return {
      bulan,
      Pendapatan: bucket.masuk / 1_000_000,
      Biaya: bucket.keluar / 1_000_000,
      Laba: (bucket.masuk - bucket.keluar) / 1_000_000,
    };
  });

  const kategori = new Map<string, number>();
  for (const row of rows) {
    const label = kategoriKas(row.uraian);
    kategori.set(label, (kategori.get(label) ?? 0) + row.masuk + row.keluar);
  }

  const pendapatanUnit = [...kategori.entries()]
    .filter(([, nilai]) => nilai > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([unit, nilai]) => ({ unit, nilai }));

  const bebanOperasional = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      if (!row.keluar) return acc;
      const key = row.uraian.split(" ").slice(0, 3).join(" ");
      acc[key] = (acc[key] ?? 0) + row.keluar;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([pos, nilai]) => ({ pos, nilai }));

  return { totalPendapatan, totalBiaya, laba, margin, chartData, pendapatanUnit, bebanOperasional };
}

function kategoriKas(uraian: string): string {
  const text = uraian.toLowerCase();
  if (text.includes("dana investor")) return "Pendanaan";
  if (text.includes("kambing") || text.includes("cempe") || text.includes("doka") || text.includes("ayam") || text.includes("ikan")) {
    return "Peternakan";
  }
  if (text.includes("manggis") || text.includes("kebun") || text.includes("tanam") || text.includes("lahan")) {
    return "Kebun";
  }
  if (text.includes("transport") || text.includes("mobil") || text.includes("supir") || text.includes("tol") || text.includes("makan")) {
    return "Logistik";
  }
  return "Operasional";
}
