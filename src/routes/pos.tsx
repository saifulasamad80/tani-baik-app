import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Boxes,
  ClipboardCheck,
  Inbox,
  Lock,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { angka, penerimaanBarang, produkPos, rupiah, stokOpname } from "@/lib/dummy-data";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS / Kasir UMKM — Tani Baik" },
      {
        name: "description",
        content:
          "Kasir UMKM Benih Tani Baik: transaksi penjualan, penerimaan barang, manajemen produk, dan stok opname.",
      },
      { property: "og:title", content: "POS / Kasir UMKM — Tani Baik" },
      {
        property: "og:description",
        content: "Modul kasir offline UMKM: penjualan, penerimaan barang, produk, stok opname.",
      },
    ],
  }),
  component: PosPage,
});

type Item = { sku: string; nama: string; harga: number; qty: number };

const menuKasir = [
  { id: "penjualan", label: "Transaksi Penjualan", icon: ShoppingCart, tone: "bg-destructive text-primary-foreground", locked: false },
  { id: "penerimaan", label: "Penerimaan Barang", icon: Inbox, tone: "bg-warning text-warning-foreground", locked: true },
  { id: "produk", label: "Manajemen Produk", icon: Boxes, tone: "bg-primary text-primary-foreground", locked: false },
  { id: "opname", label: "Stok Opname", icon: ClipboardCheck, tone: "bg-info text-info-foreground", locked: true },
] as const;

function PosPage() {
  const [tab, setTab] = useState<string>("penjualan");
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState<Item[]>([]);

  const produkTampil = useMemo(
    () =>
      produkPos.filter(
        (p) =>
          p.nama.toLowerCase().includes(cari.toLowerCase()) ||
          p.kategori.toLowerCase().includes(cari.toLowerCase()),
      ),
    [cari],
  );

  const subtotal = keranjang.reduce((a, b) => a + b.harga * b.qty, 0);
  const transaksiHariIni = keranjang.length > 0 ? 1 : 0;
  const terlaris = keranjang.length
    ? [...keranjang].sort((a, b) => b.qty - a.qty)[0]!.nama
    : "-";

  const tambah = (sku: string) => {
    const p = produkPos.find((x) => x.sku === sku)!;
    setKeranjang((k) => {
      const ada = k.find((i) => i.sku === sku);
      if (ada) return k.map((i) => (i.sku === sku ? { ...i, qty: i.qty + 1 } : i));
      return [...k, { sku, nama: p.nama, harga: p.harga, qty: 1 }] as Item[];
    });
  };
  const kurang = (sku: string) =>
    setKeranjang((k) =>
      k.flatMap((i) => (i.sku === sku ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i])),
    );

  const bayar = () => {
    if (!keranjang.length) {
      toast.error("Keranjang masih kosong.");
      return;
    }
    toast.success(`Transaksi ${rupiah(subtotal)} berhasil. Struk dicetak.`);
    setKeranjang([]);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <div className="px-5 py-7 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary-foreground/15 text-2xl font-bold">
            TB
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">UMKM Benih Tani Baik</h1>
          <p className="mt-1 text-xs text-primary-foreground/80">
            Support by. Kasir Toko — Solusi Kasir offline UMKM
          </p>
        </div>
        <div className="rounded-t-3xl bg-background p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari menu..."
              className="h-11 rounded-full pl-9"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x rounded-xl border bg-card py-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Penjualan</p>
              <p className="text-sm font-bold tabular-nums">{rupiah(subtotal)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Transaksi</p>
              <p className="text-sm font-bold tabular-nums">{transaksiHariIni}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Terlaris Hari Ini</p>
              <p className="truncate px-1 text-sm font-bold">{terlaris}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {menuKasir.map((m) => (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={`relative flex h-28 flex-col justify-between rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 ${m.tone} ${
                  tab === m.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
                }`}
              >
                <m.icon className="size-6" />
                {m.locked && <Lock className="absolute right-3 top-3 size-4 opacity-70" />}
                <span className="text-sm font-bold leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex-wrap">
          {menuKasir.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>{m.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="penjualan">
          <PageHeader eyebrow="Kasir" title="Transaksi Penjualan" description="Pilih produk untuk menambahkan ke keranjang." />
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {produkTampil.map((p) => (
                <button
                  key={p.sku}
                  onClick={() => tambah(p.sku)}
                  className="rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary hover:bg-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">{p.kategori}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Stok {angka(p.stok)} {p.satuan}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{p.nama}</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-primary">{rupiah(p.harga)}</p>
                </button>
              ))}
            </div>

            <aside className="rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold">Keranjang</h3>
              <div className="mt-3 space-y-2">
                {keranjang.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Belum ada item.
                  </p>
                )}
                {keranjang.map((i) => (
                  <div key={i.sku} className="flex items-center gap-2 rounded-lg border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{i.nama}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {rupiah(i.harga)} × {i.qty}
                      </p>
                    </div>
                    <Button size="icon" variant="outline" className="size-7" onClick={() => kurang(i.sku)}>
                      <Minus className="size-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="size-7" onClick={() => tambah(i.sku)}>
                      <Plus className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Item</span>
                  <span className="tabular-nums">{keranjang.reduce((a, b) => a + b.qty, 0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{rupiah(subtotal)}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setKeranjang([])} aria-label="Kosongkan">
                  <Trash2 className="size-4" />
                </Button>
                <Button className="flex-1" onClick={bayar}>Bayar</Button>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="penerimaan">
          <PageHeader eyebrow="Gudang" title="Penerimaan Barang" description="Daftar penerimaan barang dari supplier." />
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">No. Terima</th>
                  <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-2 text-left font-medium">Supplier</th>
                  <th className="px-4 py-2 text-right font-medium">Item</th>
                  <th className="px-4 py-2 text-right font-medium">Nilai</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {penerimaanBarang.map((p) => (
                  <tr key={p.no} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono text-xs">{p.no}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.tanggal}</td>
                    <td className="px-4 py-2 font-medium">{p.supplier}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.item}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{rupiah(p.total)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.status === "Selesai" ? "default" : "secondary"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="produk">
          <PageHeader eyebrow="Master Data" title="Manajemen Produk" description="Daftar produk toko beserta HPP dan margin." />
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">SKU</th>
                  <th className="px-4 py-2 text-left font-medium">Nama Produk</th>
                  <th className="px-4 py-2 text-left font-medium">Kategori</th>
                  <th className="px-4 py-2 text-right font-medium">Stok</th>
                  <th className="px-4 py-2 text-right font-medium">HPP</th>
                  <th className="px-4 py-2 text-right font-medium">Harga Jual</th>
                  <th className="px-4 py-2 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {produkPos.map((p) => (
                  <tr key={p.sku} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-2 font-medium">{p.nama}</td>
                    <td className="px-4 py-2">{p.kategori}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{angka(p.stok)} {p.satuan}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{rupiah(p.hpp)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{rupiah(p.harga)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-primary">
                      {(((p.harga - p.hpp) / p.harga) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="opname">
          <PageHeader eyebrow="Audit Gudang" title="Stok Opname" description="Perbandingan stok sistem dan hitung fisik." />
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">SKU</th>
                  <th className="px-4 py-2 text-left font-medium">Produk</th>
                  <th className="px-4 py-2 text-right font-medium">Sistem</th>
                  <th className="px-4 py-2 text-right font-medium">Fisik</th>
                  <th className="px-4 py-2 text-right font-medium">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {stokOpname.map((s) => {
                  const selisih = s.fisik - s.sistem;
                  return (
                    <tr key={s.sku} className="border-t hover:bg-muted/40">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.sku}</td>
                      <td className="px-4 py-2 font-medium">{s.nama}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{angka(s.sistem)} {s.satuan}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{angka(s.fisik)} {s.satuan}</td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums font-medium ${
                          selisih === 0 ? "text-muted-foreground" : selisih < 0 ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {selisih > 0 ? "+" : ""}
                        {selisih}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
