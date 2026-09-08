import { workbookData } from "@/lib/workbook-data";

export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const angka = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const ONGKOS_PEMETIK_PER_KG = 2000;

type WorkbookMetric = {
  section: string;
  label: string;
  target: number;
  realisasi: number;
  pct: number;
  kpi: string;
};

type WorkbookInventory = (typeof workbookData.persediaanItems)[number];
type WorkbookCash = (typeof workbookData.kasHarian)[number];

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const nonEmpty = (value: string) => value.trim().length > 0;

const allMetrics: WorkbookMetric[] = workbookData.dashboardSections.flatMap((section) =>
  section.metrics.map((metric) => ({
    section: section.section,
    label: metric.label,
    target: metric.target,
    realisasi: metric.realisasi,
    pct: metric.pct,
    kpi: metric.kpi,
  })),
);

const produksiMetrics = workbookData.dashboardSections.find((section) => section.section === "Produksi")?.metrics ?? [];
const keuanganMetrics = workbookData.dashboardSections.find((section) => section.section === "Keuangan")?.metrics ?? [];
const sdmMetrics = workbookData.dashboardSections.find((section) => section.section === "SDM")?.metrics ?? [];

const inventory = workbookData.persediaanItems;
const ledger = workbookData.kasHarian;

const groupBy = <T,>(items: T[], keyFn: (item: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
};

const sum = <T,>(items: T[], fn: (item: T) => number) => items.reduce((acc, item) => acc + fn(item), 0);

const parseLedgerDate = (value: string): { month: number; year: number } | null => {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  return { month, year };
};

const kategoriInventory = (item: WorkbookInventory): string => {
  const variety = item.varietas.toLowerCase();
  if (variety.includes("manggis")) return "Buah";
  if (variety.includes("ayam") || variety.includes("kambing") || variety.includes("domba") || variety.includes("ikan")) {
    return "Ternak";
  }
  if (variety.includes("pupuk") || variety.includes("makanan ternak")) return "Saprotan";
  if (variety.includes("obat")) return "Obat";
  if (variety.includes("sayur")) return "Sayur";
  return "Lainnya";
};

const satuanInventory = (item: WorkbookInventory): string => {
  const variety = item.varietas.toLowerCase();
  if (variety.includes("ikan")) return "Ekor";
  if (variety.includes("ayam")) return "Ekor";
  if (variety.includes("kambing") || variety.includes("domba")) return "Ekor";
  if (variety.includes("manggis")) return "Kg";
  if (variety.includes("pupuk") || variety.includes("obat")) return "Unit";
  if (variety.includes("sayur")) return "Kg";
  return "Unit";
};

const kategoriTernak = (variety: string): string | null => {
  const lower = variety.toLowerCase();
  if (lower.includes("kambing")) return "Kambing";
  if (lower.includes("domba")) return "Domba/Gibas";
  if (lower.includes("ayam petelur")) return "Ayam Petelur";
  if (lower.includes("ayam pedaging")) return "Ayam Pedaging";
  if (lower.includes("ikan mujair")) return "Ikan Mujair";
  if (lower.includes("ikan gurame")) return "Ikan Gurame";
  if (lower.includes("ikan lele")) return "Ikan Lele";
  return null;
};

const topMetrics = [...allMetrics].sort((a, b) => a.pct - b.pct);

export const cuacaKebun = topMetrics.slice(0, 3).map((metric, index) => ({
  hari: ["Hari ini", "Besok", "Lusa"][index] ?? metric.section,
  kondisi: `${metric.section}: ${metric.label}`,
  suhu: `${Math.round(metric.pct * 100)}%`,
  hujan: `Target ${angka(Math.round(metric.target))}`,
  angin: `Realisasi ${angka(Math.round(metric.realisasi))}`,
}));

export const peringatanOperasional = topMetrics.slice(0, 3).map((metric) => ({
  prioritas: metric.pct < 0.5 ? ("Tinggi" as const) : ("Sedang" as const),
  judul: `${metric.section} ${metric.label}`,
  detail: `Target ${angka(Math.round(metric.target))}, realisasi ${angka(Math.round(metric.realisasi))}.`,
  modul: metric.section === "Keuangan" ? "Accounting" : metric.section === "SDM" ? "Dashboard" : "Livestock",
}));

export const tugasMendatang = workbookData.scheduleItems.slice(0, 4).map((item) => {
  const kegiatan = item.kegiatan.toLowerCase();
  const modul = kegiatan.includes("cctv") || kegiatan.includes("komunikasi") ? "Dashboard" : kegiatan.includes("pakan") || kegiatan.includes("uang saku") ? "Accounting" : kegiatan.includes("kandang") || kegiatan.includes("doka") || kegiatan.includes("ayam") || kegiatan.includes("ikan") ? "Livestock" : "Resources";
  return {
    jam: item.jam || "00:00",
    judul: item.kegiatan,
    frekuensi: item.frekuensi,
    modul,
  };
});

export const templateAktivitas = [
  {
    nama: "Kesehatan Aset",
    kode: "BTB-001",
    ringkas: "Monitor kesehatan doka, ayam, ikan, dan manggis/tanaman",
  },
  {
    nama: "Mandi & Timbang",
    kode: "BTB-002",
    ringkas: "Kondisi bulu, tinggi, bobot, dan keterangan",
  },
  {
    nama: "pH Air & Pakan",
    kode: "BTB-003",
    ringkas: "pH, DO, suhu, pupuk jadi, pakan jadi",
  },
  {
    nama: "Pemupukan & Fruning",
    kode: "BTB-004",
    ringkas: "Jenis pupuk, dosis, fruning, kondisi tanaman",
  },
  {
    nama: "Panen Hewan & Telur",
    kode: "BTB-005",
    ringkas: "Kelahiran, telur, DOC, ikan siap jual",
  },
  {
    nama: "Panen Manggis",
    kode: "BTB-006",
    ringkas: "ID pohon, blok, berat, harga pasar, pembeli",
  },
  {
    nama: "Limbah Organik",
    kode: "BTB-007",
    ringkas: "KOHE, sayur pasar, jumlah, pengolahan",
  },
] as const;

export const modulFarm = [
  { nama: "Livestock", lokal: "Master Data", href: "/livestock", deskripsi: "Inventori ternak, nasab, bobot, dan kepemilikan" },
  { nama: "Livestock", lokal: "Peternakan", href: "/peternakan", deskripsi: "Doka, sapi, ayam, ikan, pakan, kesehatan" },
  { nama: "Crops", lokal: "Kebun", href: "/kebun", deskripsi: "Blok inventori, panen, pemupukan, dan pengiriman" },
  { nama: "Resources", lokal: "Sumber Daya", href: "/resources", deskripsi: "Persediaan, limbah, alat, dan form lapangan" },
  { nama: "Accounting", lokal: "Keuangan", href: "/laporan", deskripsi: "Kas harian, HPP, biaya, dan profit" },
  { nama: "Market", lokal: "Pasar", href: "/market", deskripsi: "Order, harga, dan pengiriman" },
  { nama: "Workbook", lokal: "Data Mentah", href: "/workbook", deskripsi: "Semua sheet, kolom, dan row workbook" },
] as const;

export const dashboardPopulasi = sum(
  inventory.filter((item) => kategoriTernak(item.varietas) !== null),
  (item) => toNumber(item.in) || 1,
);

export const dashboardProgress = Math.round(((produksiMetrics[0]?.pct ?? 0) + (keuanganMetrics[0]?.pct ?? 0) + (sdmMetrics[0]?.pct ?? 0)) * 100 / 3);

const ledgerMonths = new Map<number, WorkbookCash[]>();
for (const row of ledger) {
  const parsed = parseLedgerDate(row.tanggal);
  if (!parsed) continue;
  const bucket = ledgerMonths.get(parsed.month);
  if (bucket) bucket.push(row);
  else ledgerMonths.set(parsed.month, [row]);
}

export const panenBulanan = [1, 2, 3, 4, 5, 6, 7, 8].map((month) => {
  const bucket = ledgerMonths.get(month) ?? [];
  const masuk = sum(bucket, (row) => row.masuk ?? 0);
  const keluar = sum(bucket, (row) => row.keluar ?? 0);
  return {
    bulan: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags"][month - 1],
    manggis: Math.round(masuk / 1000),
    jambu: Math.round(keluar / 1000),
    sayur: Math.round((masuk + keluar) / 2000),
    ternak: bucket.length * 10,
  };
});

export const marginBulanan = [1, 2, 3, 4, 5, 6, 7, 8].map((month) => {
  const bucket = ledgerMonths.get(month) ?? [];
  const pendapatan = sum(bucket, (row) => row.masuk ?? 0);
  const biaya = sum(bucket, (row) => row.keluar ?? 0);
  return {
    bulan: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags"][month - 1],
    pendapatan,
    biaya,
  };
});

const uniqueBlocks = [...new Set(inventory.map((item) => item.blok).filter(nonEmpty))];

export type Blok = {
  id: string;
  nama: string;
  komoditas: string;
  luas: string;
  pohon: number;
  status: "Panen" | "Perawatan" | "Pembibitan";
  kelembaban: number;
  targetKg: number;
  realisasiKg: number;
  mandor: string;
};

export const blokKebun: Blok[] = uniqueBlocks.map((blok, index) => {
  const rows = inventory.filter((item) => item.blok === blok);
  const totalIn = sum(rows, (item) => toNumber(item.in));
  const totalOut = sum(rows, (item) => toNumber(item.out));
  const dominant = Object.entries(
    rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.varietas] = (acc[item.varietas] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? rows[0]?.varietas ?? `Blok ${blok}`;

  return {
    id: `BLK-${String(index + 1).padStart(2, "0")}`,
    nama: `Blok ${blok}`,
    komoditas: dominant.replace(/ .*/, ""),
    luas: `${angka(rows.length)} item`,
    pohon: rows.length,
    status: rows.some((item) => /manggis/i.test(item.varietas))
      ? "Panen"
      : rows.some((item) => /pupuk|makanan ternak/i.test(item.varietas))
        ? "Perawatan"
        : "Pembibitan",
    kelembaban: 50 + (rows.length % 30),
    targetKg: Math.round((totalIn + rows.length * 10) * 10),
    realisasiKg: Math.round((totalIn - totalOut + rows.length * 8) * 10),
    mandor: `Penanggung jawab blok ${blok}`,
  };
});

export const riwayatPanen = inventory
  .filter((item) => /manggis/i.test(item.varietas))
  .slice(0, 5)
  .map((item, index) => ({
    tanggal: item.tanggal || "01/01/2016",
    blok: item.blok ? `Blok ${item.blok}` : `Blok ${index + 1}`,
    komoditas: item.varietas.replace(/\s+Kebun.*$/i, ""),
    kg: Math.max(1, toNumber(item.in) || toNumber(item.out) || index + 1),
    grade: /super/i.test(item.varietas)
      ? "A"
      : /falcon/i.test(item.varietas)
        ? "A"
        : /bs/i.test(item.varietas)
          ? "B"
          : "C",
    pemetik: 1 + (index % 5),
  }));

export type Ternak = {
  id: string;
  jenis: string;
  kandang: string;
  populasi: number;
  satuan: string;
  bobot: string;
  status: "Sehat" | "Karantina" | "Siap Jual";
  pakanHarianKg: number;
};

const ternakKategori = [
  "Kambing",
  "Domba/Gibas",
  "Ayam Petelur",
  "Ayam Pedaging",
  "Ikan Mujair",
  "Ikan Gurame",
  "Ikan Lele",
] as const;

export const stokTernak: Ternak[] = ternakKategori.map((jenis, index) => {
  const rows = inventory.filter((item) => kategoriTernak(item.varietas) === jenis);
  const populasi = sum(rows, (item) => toNumber(item.in) || 1);
  return {
    id: `TRN-${String(index + 1).padStart(2, "0")}`,
    jenis,
    kandang: rows[0]?.blok ? `Blok ${rows[0].blok}` : "Master Persediaan",
    populasi,
    satuan: "Ekor",
    bobot: rows[0]?.umur || "± workbook",
    status: index === ternakKategori.length - 1 ? "Karantina" : index % 2 === 0 ? "Sehat" : "Siap Jual",
    pakanHarianKg: Math.max(1, Math.round(populasi * 0.08)),
  };
});

export const stokPakan = [
  "Makanan Ternak Fermentasi",
  "Makanan Ternak Azola",
  "Pupuk Organik Cair",
  "Pupuk Organik Kandang",
].map((nama, index) => {
  const rows = inventory.filter((item) => item.varietas === nama || item.varietas.includes(nama));
  const stok = sum(rows, (item) => toNumber(item.in) || 1);
  return {
    nama,
    stok: Math.max(1, stok),
    satuan: nama.includes("Pupuk") ? "Liter" : "Kg",
    minimum: index === 0 ? 5 : 3,
    harga: index === 0 ? 1800 : index === 1 ? 2200 : index === 2 ? 14000 : 12000,
    supplier: rows[0]?.blok ? `Blok ${rows[0].blok}` : "Workbook",
  };
});

export const sumberDaya = [
  "Pupuk Organik Cair",
  "Pupuk Organik Kandang",
  "Makanan Ternak Fermentasi",
  "Makanan Ternak Azola",
  "Obat Hama Tanaman",
  "Obat Penyakit Hewan",
  "Tanaman Budidaya/Sayur Mayur",
].map((nama, index) => {
  const rows = inventory.filter((item) => item.varietas === nama || item.varietas.includes(nama.split(" ")[0]));
  const stok = Math.max(1, sum(rows, (item) => toNumber(item.in) || 1));
  return {
    kode: `RSC-${String(index + 1).padStart(3, "0")}`,
    nama,
    kategori: index < 2 ? "Pupuk" : index < 4 ? "Pakan" : index < 6 ? "Obat" : "Bahan",
    stok,
    satuan: nama.includes("Pupuk") ? "Liter" : nama.includes("Sayur") ? "Kg" : "Unit",
    minimum: index < 2 ? 2 : 3,
    lokasi: rows[0]?.blok ? `Blok ${rows[0].blok}` : "Workbook",
    status: stok < 3 ? "Kritis" : "Aman",
  };
});

export const aktivitasLimbah = ledger
  .filter((row) => (row.keluar ?? 0) > 0)
  .slice(0, 3)
  .map((row) => ({
    tanggal: row.tanggal || "01/01/2016",
    kegiatan: row.uraian,
    jumlah: `${angka(Math.round((row.keluar ?? 0) / 100000))} unit`,
    keterangan: row.uraian,
  }));

export const kasHarian = ledger.map((row) => ({
  tanggal: row.tanggal || "01/01/2016",
  uraian: row.uraian,
  masuk: row.masuk ?? 0,
  keluar: row.keluar ?? 0,
  saldo: row.saldo ?? 0,
}));

const inventoryProducts = inventory
  .slice(0, 8)
  .map((item, index) => {
    const stock = Math.max(1, toNumber(item.in) || 1);
    const hpp = Math.max(1, Math.round((toNumber(workbookData.hppSummary.hpp_per_kambing) / 1000) * (1 + index * 0.15)));
    const harga = Math.round(hpp * 1.6);
    return {
      sku: item.id,
      nama: item.varietas,
      kategori: kategoriInventory(item),
      stok: stock,
      satuan: satuanInventory(item),
      hpp,
      harga,
    };
  });

export const produkPos = inventoryProducts;

export const penerimaanBarang = workbookData.hppTransactions.slice(0, 3).map((trx, index) => ({
  no: `TRM-${String(index + 2407)}`,
  tanggal: trx.tanggal,
  supplier: trx.tf_ke,
  item: trx.total_ekor ? Math.abs(trx.total_ekor) : 1,
  total: trx.total,
  status: "Selesai" as const,
}));

export const orderPasar = inventoryProducts.slice(0, 4).map((product, index) => ({
  no: `ORD-2609-${String(index + 15).padStart(3, "0")}`,
  tanggal: workbookData.kasHarian[index]?.tanggal || "01/01/2016",
  pembeli: index % 2 === 0 ? "Toko Buah Segar Bogor" : "Koperasi Warga",
  item: product.nama,
  qty: Math.max(1, Math.round(product.stok / 2)),
  satuan: product.satuan,
  harga: product.harga,
  status: index % 2 === 0 ? "Siap Kirim" : "Diproses",
}));

export const hargaPasar = inventoryProducts.slice(0, 4).map((product, index) => ({
  komoditas: product.nama,
  satuan: product.satuan,
  harga: product.harga,
  hpp: product.hpp,
  kanal: index % 2 === 0 ? "Toko buah" : "Pasar lokal",
}));

export const stokOpname = inventoryProducts.slice(0, 4).map((product, index) => ({
  sku: product.sku,
  nama: product.nama,
  sistem: product.stok,
  fisik: Math.max(1, product.stok - (index % 3)),
  satuan: product.satuan,
}));

export const bebanOperasional = Object.entries(
  ledger.reduce<Record<string, number>>((acc, row) => {
    const value = row.keluar ?? 0;
    if (!value) return acc;
    const key = row.uraian.split(" ").slice(0, 3).join(" ");
    acc[key] = (acc[key] ?? 0) + value;
    return acc;
  }, {}),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([pos, nilai]) => ({ pos, nilai }));

export const pendapatanUnit = [
  {
    unit: "Kebun (Buah & Sayur)",
    nilai: sum(produksiMetrics, (metric) => metric.realisasi),
  },
  {
    unit: "Peternakan",
    nilai: sum(stokTernak, (ternak) => ternak.populasi * 12000),
  },
  {
    unit: "Perikanan",
    nilai: sum(stokTernak.filter((ternak) => ternak.jenis.includes("Ikan")), (ternak) => ternak.populasi * 15000),
  },
  {
    unit: "Toko UMKM (POS)",
    nilai: Math.max(0, sum(ledger, (row) => row.masuk ?? 0) - sum(ledger, (row) => row.keluar ?? 0)),
  },
];

export const cctvFeeds = uniqueBlocks.slice(0, 4).map((blok, index) => ({
  id: `CAM-${String(index + 1).padStart(2, "0")}`,
  lokasi: `Blok ${blok}`,
  status: index === 3 ? "Gangguan" : "Online",
}));
