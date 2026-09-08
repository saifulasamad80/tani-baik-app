import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
import {
  AlertTriangle,
  Beef,
  CalendarCheck2,
  Camera,
  CloudSun,
  Leaf,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useKasHarianRows } from "@/hooks/use-workbook-rows";
import {
  angka,
  cuacaKebun,
  cctvFeeds,
  dashboardPopulasi,
  dashboardProgress,
  peringatanOperasional,
  panenBulanan,
  riwayatPanen,
  tugasMendatang,
  rupiah,
} from "@/lib/farm-data";
import { ringkasKasHarian } from "@/lib/workbook-rows";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Dashboard Utama — ${BRAND_NAME}` },
      {
        name: "description",
        content:
          `Ringkasan hasil panen, populasi ternak, profit margin, dan pantauan CCTV kebun ${BRAND_NAME}.`,
      },
      { property: "og:title", content: `Dashboard Utama — ${BRAND_NAME}` },
      {
        property: "og:description",
        content: `Ringkasan operasional integrated farming dan POS UMKM ${BRAND_NAME}.`,
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const kasQuery = useKasHarianRows();
  const kasRows = kasQuery.data ?? [];
  const ledgerSummary = useMemo(() => ringkasKasHarian(kasRows), [kasRows]);
  const marginData = ledgerSummary.chartData.map((m) => ({
    bulan: m.bulan,
    margin: m.Pendapatan > 0 ? Number((((m.Pendapatan - m.Biaya) / m.Pendapatan) * 100).toFixed(1)) : 0,
  }));
  const bulanIni =
    [...ledgerSummary.chartData].reverse().find((m) => m.Pendapatan > 0 || m.Biaya > 0) ??
    ledgerSummary.chartData[ledgerSummary.chartData.length - 1]!;
  const pendapatanBulanIni = bulanIni.Pendapatan * 1_000_000;
  const biayaBulanIni = bulanIni.Biaya * 1_000_000;
  const laba = pendapatanBulanIni - biayaBulanIni;
  const margin = pendapatanBulanIni > 0 ? ((laba / pendapatanBulanIni) * 100).toFixed(1) : "0.0";
  const totalPanenKg = panenBulanan.reduce(
    (a, b) => a + b.manggis + b.jambu + b.sayur,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ringkasan Operasional"
        title="Dashboard Utama"
        description={`Periode Agustus 2026 · ${BRAND_NAME}, Kabupaten Bogor`}
        actions={
          <>
            <Badge variant={kasQuery.isFetching ? "outline" : "secondary"} className="hidden sm:inline-flex">
              {kasQuery.isFetching ? "Memuat Kas_Harian" : "Live Supabase"}
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
          icon={<Leaf className="size-4" />}
          tone="primary"
        />
        <StatCard
          label="Populasi Ternak & Ikan"
          value={`${angka(dashboardPopulasi)} Ekor`}
          sub="Workbook inventory"
          icon={<Beef className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={rupiah(pendapatanBulanIni)}
          sub={`Biaya operasional ${rupiah(biayaBulanIni)}`}
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
              <h2 className="text-sm font-semibold">Alerts, Cuaca, dan Tugas</h2>
              <p className="text-xs text-muted-foreground">
                Fokus kerja harian yang paling perlu ditindak
              </p>
            </div>
            <Badge variant="outline">Scout ready</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-warning" />
                Alerts
              </div>
              <div className="space-y-2">
                {peringatanOperasional.map((item) => (
                  <div key={item.judul} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={
                          item.prioritas === "Tinggi"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-warning/20 text-warning-foreground"
                        }
                      >
                        {item.prioritas}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{item.modul}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-tight">{item.judul}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CloudSun className="size-4 text-info" />
                Weather
              </div>
              <div className="space-y-2">
                {cuacaKebun.map((item) => (
                  <div key={item.hari} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.hari}</p>
                      <p className="text-xs text-muted-foreground">{item.kondisi}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-muted/60 p-2">
                        <p className="text-muted-foreground">Suhu</p>
                        <p className="font-semibold tabular-nums">{item.suhu}</p>
                      </div>
                      <div className="rounded-md bg-muted/60 p-2">
                        <p className="text-muted-foreground">Hujan</p>
                        <p className="font-semibold tabular-nums">{item.hujan}</p>
                      </div>
                      <div className="rounded-md bg-muted/60 p-2">
                        <p className="text-muted-foreground">Angin</p>
                        <p className="font-semibold tabular-nums">{item.angin}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarCheck2 className="size-4 text-success" />
                Upcoming tasks
              </div>
              <div className="space-y-2">
                {tugasMendatang.map((item) => (
                  <div key={`${item.jam}-${item.judul}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">{item.jam}</Badge>
                      <span className="text-[11px] text-muted-foreground">{item.frekuensi}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-tight">{item.judul}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.modul}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Offline Scout Mode</h2>
              <p className="text-xs text-muted-foreground">Simpan data sebelum ke area tanpa sinyal</p>
            </div>
            <Badge variant="secondary">Sync later</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {[
              "Sinkron data blok dan kandang",
              "Unduh master tugas hari ini",
              "Buka template BTB-001 s.d. BTB-007",
              "Siapkan foto dan catatan lapangan",
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-2">
                <div className="mt-0.5 grid size-5 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="text-sm leading-snug text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-accent/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Status antrean lokal</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Item tersimpan</span>
              <span className="font-semibold tabular-nums">{angka(kasRows.length)}</span>
            </div>
            <Progress value={dashboardProgress} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Aktivitas lapangan tetap masuk perangkat dan disinkronkan saat online.
            </p>
          </div>
        </section>
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
              <h2 className="text-sm font-semibold">Ringkasan Lokasi Workbook</h2>
              <p className="text-xs text-muted-foreground">4 blok persediaan · status operasional</p>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1">
              <Camera className="size-3" /> Ready
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
