import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Flame, Recycle, ShieldCheck, TabletSmartphone } from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import {
  aktivitasLimbah,
  angka,
  sumberDaya,
  templateAktivitas,
} from "@/lib/farm-data";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: `Sumber Daya — ${BRAND_NAME}` },
      {
        name: "description",
        content:
          "Persediaan, alat, pakan, pupuk, limbah organik, CCTV, dan template form lapangan.",
      },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const totalItem = sumberDaya.reduce((a, b) => a + b.stok, 0);
  const kritis = sumberDaya.filter((item) => item.status === "Kritis").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resources"
        title="Sumber Daya"
        description="Persediaan, limbah, alat, dan template kerja lapangan"
        actions={<Badge variant="secondary">Terhubung ke outbox offline</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Item" value={angka(totalItem)} sub="Akumulasi semua stok" icon={<Boxes className="size-4" />} tone="primary" />
        <StatCard label="Item Kritis" value={angka(kritis)} sub="Segera restock" icon={<ShieldCheck className="size-4" />} tone="warning" />
        <StatCard label="Batch Limbah" value={angka(aktivitasLimbah.length)} sub="KOHE & sayur pasar" icon={<Recycle className="size-4" />} tone="info" />
        <StatCard label="Template Form" value={angka(templateAktivitas.length)} sub="BTB-001 s.d. BTB-007" icon={<TabletSmartphone className="size-4" />} tone="primary" />
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Master Persediaan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Kode</th>
                <th className="px-4 py-2 text-left font-medium">Nama</th>
                <th className="px-4 py-2 text-left font-medium">Kategori</th>
                <th className="px-4 py-2 text-right font-medium">Stok</th>
                <th className="px-4 py-2 text-left font-medium">Lokasi</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sumberDaya.map((item) => (
                <tr key={item.kode} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.kode}</td>
                  <td className="px-4 py-2 font-medium">{item.nama}</td>
                  <td className="px-4 py-2">{item.kategori}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {angka(item.stok)} {item.satuan}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.lokasi}</td>
                  <td className="px-4 py-2">
                    <Badge variant={item.status === "Kritis" ? "destructive" : "secondary"}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Template Form Lapangan</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Struktur form workbook yang bisa dipakai di PWA saat offline.
          </p>
          <div className="space-y-2">
            {templateAktivitas.map((form) => (
              <div key={form.kode} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{form.nama}</p>
                  <Badge variant="outline">{form.kode}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{form.ringkas}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Limbah KOHE & Organik</h2>
          <p className="mb-4 text-xs text-muted-foreground">Bahan kompos dan pakan olahan.</p>
          <div className="space-y-2">
            {aktivitasLimbah.map((item, index) => (
              <div key={`${item.tanggal}-${index}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.kegiatan}</p>
                  <span className="text-xs text-muted-foreground">{item.tanggal}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium tabular-nums">{item.jumlah}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.keterangan}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Flame className="size-4 text-warning" />
              Monitoring Harian
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Cocok untuk pencatatan pH air, pupuk jadi, pakan jadi, dan foto CCTV area
              kebun/kandang.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
