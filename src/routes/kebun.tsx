import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Droplets, Leaf, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ONGKOS_PEMETIK_PER_KG,
  angka,
  blokKebun,
  riwayatPanen,
  rupiah,
} from "@/lib/dummy-data";

export const Route = createFileRoute("/kebun")({
  head: () => ({
    meta: [
      { title: "Manajemen Kebun — Tani Baik" },
      {
        name: "description",
        content:
          "Monitor Blok 1-3 manggis, jambu kristal, dan sayur beserta input hasil panen serta ongkos pemetik.",
      },
      { property: "og:title", content: "Manajemen Kebun — Tani Baik" },
      {
        property: "og:description",
        content: "Monitoring blok kebun dan kalkulasi ongkos pemetik Rp 2.000/kg.",
      },
    ],
  }),
  component: KebunPage,
});

function KebunPage() {
  const [blok, setBlok] = useState("BLK-01");
  const [komoditas, setKomoditas] = useState("Manggis");
  const [kg, setKg] = useState("");
  const [pemetik, setPemetik] = useState("3");
  const [riwayat, setRiwayat] = useState(riwayatPanen);

  const berat = Number(kg) || 0;
  const ongkos = berat * ONGKOS_PEMETIK_PER_KG;
  const perOrang = Number(pemetik) > 0 ? ongkos / Number(pemetik) : 0;

  const totalRealisasi = useMemo(
    () => blokKebun.reduce((a, b) => a + b.realisasiKg, 0),
    [],
  );
  const totalTarget = blokKebun.reduce((a, b) => a + b.targetKg, 0);

  const simpan = () => {
    if (berat <= 0) {
      toast.error("Isi berat panen terlebih dahulu.");
      return;
    }
    setRiwayat((r) => [
      {
        tanggal: "03 Sep 2026",
        blok: blokKebun.find((b) => b.id === blok)?.nama.split(" — ")[0] ?? "Blok 1",
        komoditas,
        kg: berat,
        grade: "A",
        pemetik: Number(pemetik) || 1,
      },
      ...r,
    ]);
    toast.success(`Panen ${angka(berat)} Kg tercatat · ongkos pemetik ${rupiah(ongkos)}`);
    setKg("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unit Kebun"
        title="Manajemen Kebun"
        description="Monitoring Blok 1–3 dan pencatatan hasil panen harian"
        actions={<Badge variant="secondary">Ongkos pemetik Rp 2.000 / Kg</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Blok Aktif" value="3 Blok" sub="4,8 Ha lahan produktif" icon={<Leaf className="size-4" />} tone="primary" />
        <StatCard label="Realisasi Panen" value={`${angka(totalRealisasi)} Kg`} sub={`Target ${angka(totalTarget)} Kg`} icon={<Leaf className="size-4" />} />
        <StatCard label="Ongkos Pemetik Bulan Ini" value={rupiah(totalRealisasi * ONGKOS_PEMETIK_PER_KG)} sub="Dihitung otomatis dari berat panen" icon={<Users className="size-4" />} tone="warning" />
        <StatCard label="Rata-rata Kelembaban" value="72,6%" sub="Sensor tanah 3 blok" icon={<Droplets className="size-4" />} tone="info" />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {blokKebun.map((b) => {
          const pct = Math.round((b.realisasiKg / b.targetKg) * 100);
          return (
            <article key={b.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{b.id}</p>
                  <h3 className="truncate text-sm font-semibold">{b.nama}</h3>
                  <p className="text-xs text-muted-foreground">
                    {b.komoditas} · {b.luas} · {b.pohon > 0 ? `${angka(b.pohon)} pohon` : "bedengan"}
                  </p>
                </div>
                <Badge
                  variant={
                    b.status === "Panen" ? "default" : b.status === "Perawatan" ? "secondary" : "outline"
                  }
                  className="shrink-0"
                >
                  {b.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Capaian target</span>
                  <span className="font-medium tabular-nums">{pct}%</span>
                </div>
                <Progress value={pct} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/60 p-2">
                  <dt className="text-muted-foreground">Realisasi</dt>
                  <dd className="font-semibold tabular-nums">{angka(b.realisasiKg)} Kg</dd>
                </div>
                <div className="rounded-lg bg-muted/60 p-2">
                  <dt className="text-muted-foreground">Kelembaban</dt>
                  <dd className="font-semibold tabular-nums">{b.kelembaban}%</dd>
                </div>
                <div className="col-span-2 rounded-lg bg-muted/60 p-2">
                  <dt className="text-muted-foreground">Ongkos pemetik</dt>
                  <dd className="font-semibold tabular-nums">
                    {rupiah(b.realisasiKg * ONGKOS_PEMETIK_PER_KG)} · Mandor {b.mandor}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Input Hasil Panen</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Ongkos pemetik dihitung otomatis Rp 2.000 per Kg.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Blok</Label>
              <Select value={blok} onValueChange={setBlok}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {blokKebun.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Komoditas</Label>
              <Select value={komoditas} onValueChange={setKomoditas}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Manggis", "Jambu Kristal", "Kangkung", "Bayam", "Cabai Rawit"].map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kg">Berat (Kg)</Label>
                <Input id="kg" inputMode="numeric" placeholder="0" value={kg} onChange={(e) => setKg(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pemetik">Jumlah Pemetik</Label>
                <Input id="pemetik" inputMode="numeric" value={pemetik} onChange={(e) => setPemetik(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border border-dashed bg-accent/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat panen</span>
                <span className="font-medium tabular-nums">{angka(berat)} Kg</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Ongkos pemetik</span>
                <span className="font-semibold tabular-nums">{rupiah(ongkos)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Per orang</span>
                <span className="font-medium tabular-nums">{rupiah(Math.round(perOrang))}</span>
              </div>
            </div>

            <Button className="w-full" onClick={simpan}>
              <Plus className="size-4" /> Simpan Hasil Panen
            </Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Riwayat Panen &amp; Ongkos Pemetik</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-2 text-left font-medium">Blok</th>
                  <th className="px-4 py-2 text-left font-medium">Komoditas</th>
                  <th className="px-4 py-2 text-right font-medium">Kg</th>
                  <th className="px-4 py-2 text-right font-medium">Pemetik</th>
                  <th className="px-4 py-2 text-right font-medium">Ongkos</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-2 text-muted-foreground">{r.tanggal}</td>
                    <td className="px-4 py-2 font-medium">{r.blok}</td>
                    <td className="px-4 py-2">{r.komoditas}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{angka(r.kg)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.pemetik} org</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {rupiah(r.kg * ONGKOS_PEMETIK_PER_KG)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
