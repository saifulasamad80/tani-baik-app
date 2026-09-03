import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Beef, Egg, Fish, PackagePlus, TriangleAlert } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { angka, rupiah, stokPakan, stokTernak } from "@/lib/dummy-data";

export const Route = createFileRoute("/peternakan")({
  head: () => ({
    meta: [
      { title: "Manajemen Peternakan — Tani Baik" },
      {
        name: "description",
        content:
          "Monitor populasi sapi, ayam, dan ikan serta kelola stok dan pembelian pakan ternak.",
      },
      { property: "og:title", content: "Manajemen Peternakan — Tani Baik" },
      {
        property: "og:description",
        content: "Stok hewan ternak dan modul manajemen pembelian pakan Tani Baik.",
      },
    ],
  }),
  component: PeternakanPage,
});

function PeternakanPage() {
  const [pakan, setPakan] = useState(stokPakan[0].nama);
  const [jumlah, setJumlah] = useState("");
  const [supplier, setSupplier] = useState("CV Sumber Ternak");
  const [catatan, setCatatan] = useState("");

  const item = stokPakan.find((p) => p.nama === pakan)!;
  const qty = Number(jumlah) || 0;
  const total = qty * item.harga;

  const beli = () => {
    if (qty <= 0) {
      toast.error("Masukkan jumlah pembelian pakan.");
      return;
    }
    toast.success(`Pembelian ${angka(qty)} Kg ${pakan} senilai ${rupiah(total)} dicatat.`);
    setJumlah("");
    setCatatan("");
  };

  const totalPakanHarian = stokTernak.reduce((a, b) => a + b.pakanHarianKg, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unit Peternakan & Perikanan"
        title="Manajemen Peternakan"
        description="Monitoring populasi hewan dan pengelolaan pakan harian"
        actions={<Badge variant="secondary">5 kandang & kolam aktif</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sapi" value="24 Ekor" sub="Kandang A · rata-rata 420 kg" icon={<Beef className="size-4" />} tone="warning" />
        <StatCard label="Ayam" value={`${angka(2790)} Ekor`} sub="Broiler 1.850 · Petelur 940" icon={<Egg className="size-4" />} tone="primary" />
        <StatCard label="Ikan" value={`${angka(10500)} Ekor`} sub="Nila 6.200 · Lele 4.300" icon={<Fish className="size-4" />} tone="info" />
        <StatCard label="Kebutuhan Pakan Harian" value={`${angka(totalPakanHarian)} Kg`} sub="Seluruh unit ternak & kolam" icon={<PackagePlus className="size-4" />} />
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Stok Hewan Ternak</h2>
          <Badge variant="outline">Diperbarui 03 Sep 2026</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Kode</th>
                <th className="px-4 py-2 text-left font-medium">Jenis</th>
                <th className="px-4 py-2 text-left font-medium">Kandang / Kolam</th>
                <th className="px-4 py-2 text-right font-medium">Populasi</th>
                <th className="px-4 py-2 text-left font-medium">Bobot Rata-rata</th>
                <th className="px-4 py-2 text-right font-medium">Pakan / Hari</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stokTernak.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-2 font-medium">{t.jenis}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.kandang}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{angka(t.populasi)} {t.satuan}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.bobot}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{angka(t.pakanHarianKg)} Kg</td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        t.status === "Sehat" ? "default" : t.status === "Siap Jual" ? "secondary" : "destructive"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Stok Pakan</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Indikator merah menandakan stok di bawah batas minimum.
          </p>
          <div className="space-y-4">
            {stokPakan.map((p) => {
              const pct = Math.min(100, Math.round((p.stok / (p.minimum * 3)) * 100));
              const kritis = p.stok < p.minimum;
              return (
                <div key={p.nama} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.supplier} · {rupiah(p.harga)}/{p.satuan}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${kritis ? "text-destructive" : ""}`}>
                      {angka(p.stok)} {p.satuan}
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2" />
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {kritis && <TriangleAlert className="size-3 text-destructive" />}
                    Minimum {angka(p.minimum)} {p.satuan}
                    {kritis && " · segera lakukan pembelian"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Pembelian Pakan</h2>
          <p className="mb-4 text-xs text-muted-foreground">Form pengadaan pakan ke supplier.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Jenis Pakan</Label>
              <Select value={pakan} onValueChange={setPakan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stokPakan.map((p) => (
                    <SelectItem key={p.nama} value={p.nama}>{p.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["CV Sumber Ternak", "PT Charoen", "Toko Mina Jaya", "Kelompok Tani Rukun"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Jumlah ({item.satuan})</Label>
              <Input id="qty" inputMode="numeric" placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat">Catatan</Label>
              <Textarea id="cat" rows={3} placeholder="Contoh: kirim ke gudang belakang" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            </div>
            <div className="rounded-lg border border-dashed bg-accent/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga satuan</span>
                <span className="tabular-nums">{rupiah(item.harga)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Total pembelian</span>
                <span className="font-semibold tabular-nums">{rupiah(total)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={beli}>
              <PackagePlus className="size-4" /> Catat Pembelian
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
