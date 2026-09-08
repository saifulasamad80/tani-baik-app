import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, ShoppingBag, Truck, Wallet } from "lucide-react";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { hargaPasar, orderPasar, rupiah } from "@/lib/farm-data";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: `Market — ${BRAND_NAME}` },
      {
        name: "description",
        content: "Harga pasar, order penjualan, kanal distribusi, dan ringkasan margin.",
      },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const omzet = orderPasar.reduce((a, b) => a + b.qty * b.harga, 0);
  const tertinggi = hargaPasar.reduce((a, b) => (b.harga > a.harga ? b : a), hargaPasar[0]!);
  const marginRata = hargaPasar.reduce((a, b) => a + (b.harga - b.hpp), 0) / hargaPasar.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Market"
        title="Pasar"
        description="Pantau harga jual, order, dan distribusi produk kebun dan ternak"
        actions={<Badge variant="secondary">Siap sinkron dengan POS</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Omzet Order" value={rupiah(omzet)} sub="Order aktif dan selesai" icon={<ShoppingBag className="size-4" />} tone="primary" />
        <StatCard label="Harga Tertinggi" value={rupiah(tertinggi.harga)} sub={tertinggi.komoditas} icon={<ArrowUpRight className="size-4" />} tone="warning" />
        <StatCard label="Rata-rata Margin" value={rupiah(Math.round(marginRata))} sub="Harga jual minus HPP" icon={<Wallet className="size-4" />} tone="info" />
        <StatCard label="Pengiriman Hari Ini" value={`${orderPasar.length} Order`} sub="Workbook-backed" icon={<Truck className="size-4" />} tone="primary" />
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Order Penjualan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">No</th>
                <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                <th className="px-4 py-2 text-left font-medium">Pembeli</th>
                <th className="px-4 py-2 text-left font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Nilai</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orderPasar.map((order) => (
                <tr key={order.no} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{order.no}</td>
                  <td className="px-4 py-2 text-muted-foreground">{order.tanggal}</td>
                  <td className="px-4 py-2 font-medium">{order.pembeli}</td>
                  <td className="px-4 py-2">{order.item}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {order.qty} {order.satuan}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{rupiah(order.qty * order.harga)}</td>
                  <td className="px-4 py-2">
                    <Badge variant={order.status === "Selesai" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Harga Pasar</h2>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {hargaPasar.map((item) => (
            <div key={item.komoditas} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.komoditas}</p>
                  <p className="text-xs text-muted-foreground">{item.kanal}</p>
                </div>
                <ArrowDownRight className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-lg font-bold tabular-nums">{rupiah(item.harga)}</p>
              <p className="text-xs text-muted-foreground">HPP {rupiah(item.hpp)} / {item.satuan}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
