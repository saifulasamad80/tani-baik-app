import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Percent, Wallet } from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKasHarianRows } from "@/hooks/use-workbook-rows";
import { rupiah } from "@/lib/farm-data";
import { ringkasKasHarian } from "@/lib/workbook-rows";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: `Laporan Keuangan — ${BRAND_NAME}` },
      {
        name: "description",
        content:
          "Kalkulasi harga jual, biaya operasional, dan profit unit kebun, peternakan, serta toko UMKM.",
      },
      { property: "og:title", content: `Laporan Keuangan — ${BRAND_NAME}` },
      {
        property: "og:description",
        content: `Laba rugi bulanan ${BRAND_NAME}: pendapatan vs biaya operasional.`,
      },
    ],
  }),
  component: LaporanPage,
});

const warna = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function LaporanPage() {
  const kasQuery = useKasHarianRows();
  const kasHarian = kasQuery.data ?? [];
  const ringkas = useMemo(() => ringkasKasHarian(kasHarian), [kasHarian]);
  const { totalPendapatan, totalBiaya, laba, chartData, bebanOperasional } = ringkas;
  const margin = ringkas.margin.toFixed(1);
  const pendapatanUnit = ringkas.pendapatanUnit;
  const pieData = pendapatanUnit.length > 0 ? pendapatanUnit : [{ unit: "Belum ada data", nilai: 1 }];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Laporan Keuangan"
        description="Periode Agustus 2026 · Harga jual vs biaya operasional"
        actions={
          <>
            <Badge variant={kasQuery.isFetching ? "outline" : "secondary"} className="hidden sm:inline-flex">
              {kasQuery.isFetching ? "Memuat Kas_Harian" : "Live Supabase"}
            </Badge>
            <Button size="sm" variant="outline">Ekspor Excel</Button>
          </>
        }
      />

      {kasQuery.isError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gagal memuat data Kas_Harian dari Supabase workbook_rows.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pendapatan" value={rupiah(totalPendapatan)} sub="CSV Kas_Harian" icon={<ArrowUpRight className="size-4" />} tone="primary" />
        <StatCard label="Biaya Operasional" value={rupiah(totalBiaya)} sub="CSV Kas_Harian" icon={<ArrowDownRight className="size-4" />} tone="destructive" />
        <StatCard label="Laba Bersih" value={rupiah(laba)} sub="Pendapatan − Biaya" icon={<Wallet className="size-4" />} tone="info" />
        <StatCard label="Profit Margin" value={`${margin}%`} sub="Dihitung dari ledger CSV" icon={<Percent className="size-4" />} tone="warning" />
      </div>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Pendapatan vs Biaya vs Laba</h2>
        <p className="mb-4 text-xs text-muted-foreground">Dalam juta Rupiah</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis unit=" jt" tickLine={false} axisLine={false} fontSize={12} width={56} />
              <Tooltip
                formatter={(v: number) => `Rp ${v.toFixed(1)} jt`}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Pendapatan" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Biaya" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Laba" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Kontribusi Pendapatan per Unit</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="nilai" nameKey="unit" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={warna[i % warna.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => rupiah(v)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Rincian Biaya Operasional</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {bebanOperasional.map((b) => (
                <tr key={b.pos} className="border-b last:border-0">
                  <td className="px-4 py-2.5">{b.pos}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{rupiah(b.nilai)}</td>
                  <td className="w-20 px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                    {totalBiaya > 0 ? ((b.nilai / totalBiaya) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/60 font-semibold">
                <td className="px-4 py-2.5">Total Biaya</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{rupiah(totalBiaya)}</td>
                <td className="px-4 py-2.5 text-right text-xs">100%</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Kalkulasi Laba Rugi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              {pendapatanUnit.map((p) => (
                <tr key={p.unit} className="border-b">
                  <td className="px-4 py-2.5 text-muted-foreground">Pendapatan · {p.unit}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-primary">
                    + {rupiah(p.nilai)}
                  </td>
                </tr>
              ))}
              <tr className="border-b">
                <td className="px-4 py-2.5 text-muted-foreground">Total Biaya Operasional</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-destructive">
                  − {rupiah(totalBiaya)}
                </td>
              </tr>
              <tr className="bg-accent/50 text-base font-bold">
                <td className="px-4 py-3">Profit Bersih ({margin}%)</td>
                <td className="px-4 py-3 text-right tabular-nums">{rupiah(laba)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Kas Harian Workbook</h2>
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
              {kasHarian.map((row, index) => (
                <tr key={`${row.tanggal}-${index}`} className="border-t hover:bg-muted/40">
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
    </div>
  );
}
