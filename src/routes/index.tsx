import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Beef, Camera, Trees, TrendingUp, Wallet } from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  angka,
  cctvFeeds,
  marginBulanan,
  panenBulanan,
  riwayatPanen,
  rupiah,
} from "@/lib/dummy-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Utama — Tani Baik" },
      {
        name: "description",
        content:
          "Ringkasan hasil panen, populasi ternak, profit margin, dan pantauan CCTV kebun Tani Baik.",
      },
      { property: "og:title", content: "Dashboard Utama — Tani Baik" },
      {
        property: "og:description",
        content: "Ringkasan operasional integrated farming dan POS UMKM Tani Baik.",
      },
    ],
  }),
  component: Dashboard,
});

const marginData = marginBulanan.map((m) => ({
  bulan: m.bulan,
  margin: Number((((m.pendapatan - m.biaya) / m.pendapatan) * 100).toFixed(1)),
  laba: m.pendapatan - m.biaya,
}));

function Dashboard() {
  const bulanIni = marginBulanan[marginBulanan.length - 1]!;
  const laba = bulanIni.pendapatan - bulanIni.biaya;
  const margin = ((laba / bulanIni.pendapatan) * 100).toFixed(1);
  const totalPanenKg = panenBulanan.reduce(
    (a, b) => a + b.manggis + b.jambu + b.sayur,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ringkasan Operasional"
        title="Dashboard Utama"
        description="Periode Agustus 2026 · UMKM Benih Tani Baik, Kabupaten Bogor"
        actions={
          <>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Data diperbarui 5 menit lalu
            </Badge>
            <Button size="sm">Unduh Ringkasan</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Panen Kebun"
          value={`${angka(totalPanenKg)} Kg`}
          sub="Akumulasi Jan–Ags 2026"
          icon={<Trees className="size-4" />}
          tone="primary"
        />
        <StatCard
          label="Populasi Ternak & Ikan"
          value={`${angka(13314)} Ekor`}
          sub="Sapi 24 · Ayam 2.790 · Ikan 10.500"
          icon={<Beef className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={rupiah(bulanIni.pendapatan)}
          sub={`Biaya operasional ${rupiah(bulanIni.biaya)}`}
          icon={<Wallet className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Profit Margin"
          value={`${margin}%`}
          sub={`Laba bersih ${rupiah(laba)}`}
          icon={<TrendingUp className="size-4" />}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-4 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Hasil Panen Kebun (Kg)</h2>
              <p className="text-xs text-muted-foreground">
                Perbandingan komoditas per bulan
              </p>
            </div>
            <Badge variant="outline">Satuan: Kg</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={panenBulanan} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={44} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="manggis" name="Manggis" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jambu" name="Jambu Kristal" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sayur" name="Sayur" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Panen Ternak (Ekor)</h2>
            <p className="text-xs text-muted-foreground">Ayam & ikan siap jual per bulan</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={panenBulanan}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ternak"
                  name="Ekor"
                  stroke="var(--chart-4)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Tren Profit Margin</h2>
          <p className="mb-3 text-xs text-muted-foreground">Persentase laba terhadap pendapatan</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis unit="%" tickLine={false} axisLine={false} fontSize={12} width={44} />
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="margin"
                  name="Margin"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Layar Pantau CCTV Kebun</h2>
              <p className="text-xs text-muted-foreground">4 titik kamera · simulasi feed</p>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1">
              <Camera className="size-3" /> Live
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cctvFeeds.map((f) => (
              <div
                key={f.id}
                className="cctv-scan panel-grid relative aspect-video rounded-lg border bg-slate-900/90"
              >
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-2 py-1.5 text-[10px] font-medium text-primary-foreground">
                  <span className="rounded bg-black/45 px-1.5 py-0.5">{f.id} · {f.lokasi}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      f.status === "Online" ? "bg-success/80" : "bg-destructive/80"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
                <div className="absolute bottom-1.5 right-2 z-10 font-mono text-[10px] text-primary-foreground/70">
                  03/09/2026 20:03
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Aktivitas Panen Terakhir</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                <th className="px-4 py-2 text-left font-medium">Blok</th>
                <th className="px-4 py-2 text-left font-medium">Komoditas</th>
                <th className="px-4 py-2 text-right font-medium">Berat (Kg)</th>
                <th className="px-4 py-2 text-left font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {riwayatPanen.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">{r.tanggal}</td>
                  <td className="px-4 py-2 font-medium">{r.blok}</td>
                  <td className="px-4 py-2">{r.komoditas}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{angka(r.kg)}</td>
                  <td className="px-4 py-2">
                    <Badge variant={r.grade === "A" ? "default" : "secondary"}>{r.grade}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
