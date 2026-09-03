import { createFileRoute } from "@tanstack/react-router";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bebanOperasional, marginBulanan, pendapatanUnit, rupiah } from "@/lib/dummy-data";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan Keuangan — Tani Baik" },
      {
        name: "description",
        content:
          "Kalkulasi harga jual, biaya operasional, dan profit unit kebun, peternakan, serta toko UMKM.",
      },
      { property: "og:title", content: "Laporan Keuangan — Tani Baik" },
      {
        property: "og:description",
        content: "Laba rugi bulanan Tani Baik: pendapatan vs biaya operasional.",
      },
    ],
  }),
  component: LaporanPage,
});

const warna = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function LaporanPage() {
  const totalPendapatan = pendapatanUnit.reduce((a, b) => a + b.nilai, 0);
  const totalBiaya = bebanOperasional.reduce((a, b) => a + b.nilai, 0);
  const laba = totalPendapatan - totalBiaya;
  const margin = ((laba / totalPendapatan) * 100).toFixed(1);

  const chartData = marginBulanan.map((m) => ({
    bulan: m.bulan,
    Pendapatan: m.pendapatan / 1_000_000,
    Biaya: m.biaya / 1_000_000,
    Laba: (m.pendapatan - m.biaya) / 1_000_000,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Laporan Keuangan"
        description="Periode Agustus 2026 · Harga jual vs biaya operasional"
        actions={
          <>
            <Badge variant="secondary" className="hidden sm:inline-flex">Belum diaudit</Badge>
            <Button size="sm" variant="outline">Ekspor Excel</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pendapatan" value={rupiah(totalPendapatan)} sub="4 unit usaha" icon={<ArrowUpRight className="size-4" />} tone="primary" />
        <StatCard label="Biaya Operasional" value={rupiah(totalBiaya)} sub="6 pos biaya" icon={<ArrowDownRight className="size-4" />} tone="destructive" />
        <StatCard label="Laba Bersih" value={rupiah(laba)} sub="Pendapatan − Biaya" icon={<Wallet className="size-4" />} tone="info" />
        <StatCard label="Profit Margin" value={`${margin}%`} sub="Target perusahaan 35%" icon={<Percent className="size-4" />} tone="warning" />
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
                <Pie data={pendapatanUnit} dataKey="nilai" nameKey="unit" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pendapatanUnit.map((_, i) => (
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
                    {((b.nilai / totalBiaya) * 100).toFixed(1)}%
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
    </div>
  );
}
