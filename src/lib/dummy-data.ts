export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const angka = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const ONGKOS_PEMETIK_PER_KG = 2000;

export const panenBulanan = [
  { bulan: "Jan", manggis: 820, jambu: 640, sayur: 410, ternak: 120 },
  { bulan: "Feb", manggis: 910, jambu: 700, sayur: 455, ternak: 138 },
  { bulan: "Mar", manggis: 1180, jambu: 760, sayur: 520, ternak: 152 },
  { bulan: "Apr", manggis: 990, jambu: 830, sayur: 480, ternak: 165 },
  { bulan: "Mei", manggis: 1320, jambu: 910, sayur: 610, ternak: 180 },
  { bulan: "Jun", manggis: 1450, jambu: 870, sayur: 655, ternak: 174 },
  { bulan: "Jul", manggis: 1290, jambu: 940, sayur: 700, ternak: 196 },
  { bulan: "Ags", manggis: 1510, jambu: 1010, sayur: 720, ternak: 210 },
];

export const marginBulanan = [
  { bulan: "Jan", pendapatan: 42_500_000, biaya: 30_100_000 },
  { bulan: "Feb", pendapatan: 47_800_000, biaya: 32_400_000 },
  { bulan: "Mar", pendapatan: 55_200_000, biaya: 35_900_000 },
  { bulan: "Apr", pendapatan: 51_100_000, biaya: 34_200_000 },
  { bulan: "Mei", pendapatan: 63_400_000, biaya: 39_800_000 },
  { bulan: "Jun", pendapatan: 66_900_000, biaya: 41_100_000 },
  { bulan: "Jul", pendapatan: 64_200_000, biaya: 40_050_000 },
  { bulan: "Ags", pendapatan: 71_800_000, biaya: 43_600_000 },
];

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

export const blokKebun: Blok[] = [
  {
    id: "BLK-01",
    nama: "Blok 1 — Lereng Timur",
    komoditas: "Manggis",
    luas: "2,4 Ha",
    pohon: 480,
    status: "Panen",
    kelembaban: 72,
    targetKg: 1800,
    realisasiKg: 1510,
    mandor: "Pak Sukirman",
  },
  {
    id: "BLK-02",
    nama: "Blok 2 — Bantaran Kali",
    komoditas: "Jambu Kristal",
    luas: "1,8 Ha",
    pohon: 620,
    status: "Panen",
    kelembaban: 65,
    targetKg: 1200,
    realisasiKg: 1010,
    mandor: "Bu Warsini",
  },
  {
    id: "BLK-03",
    nama: "Blok 3 — Green House",
    komoditas: "Sayur Campuran",
    luas: "0,6 Ha",
    pohon: 0,
    status: "Perawatan",
    kelembaban: 81,
    targetKg: 900,
    realisasiKg: 720,
    mandor: "Mas Tri",
  },
];

export const riwayatPanen = [
  { tanggal: "31 Agu 2026", blok: "Blok 1", komoditas: "Manggis", kg: 340, grade: "A", pemetik: 4 },
  { tanggal: "30 Agu 2026", blok: "Blok 2", komoditas: "Jambu Kristal", kg: 215, grade: "A", pemetik: 3 },
  { tanggal: "29 Agu 2026", blok: "Blok 3", komoditas: "Kangkung", kg: 96, grade: "B", pemetik: 2 },
  { tanggal: "28 Agu 2026", blok: "Blok 1", komoditas: "Manggis", kg: 410, grade: "A", pemetik: 5 },
  { tanggal: "27 Agu 2026", blok: "Blok 2", komoditas: "Jambu Kristal", kg: 180, grade: "B", pemetik: 3 },
];

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

export const stokTernak: Ternak[] = [
  { id: "TRN-01", jenis: "Sapi Limousin", kandang: "Kandang A", populasi: 24, satuan: "Ekor", bobot: "± 420 kg/ekor", status: "Sehat", pakanHarianKg: 240 },
  { id: "TRN-02", jenis: "Ayam Broiler", kandang: "Kandang B1", populasi: 1850, satuan: "Ekor", bobot: "± 1,8 kg/ekor", status: "Siap Jual", pakanHarianKg: 185 },
  { id: "TRN-03", jenis: "Ayam Petelur", kandang: "Kandang B2", populasi: 940, satuan: "Ekor", bobot: "± 1,6 kg/ekor", status: "Sehat", pakanHarianKg: 105 },
  { id: "TRN-04", jenis: "Ikan Nila", kandang: "Kolam 1-3", populasi: 6200, satuan: "Ekor", bobot: "± 250 gr/ekor", status: "Sehat", pakanHarianKg: 62 },
  { id: "TRN-05", jenis: "Ikan Lele", kandang: "Kolam 4-6", populasi: 4300, satuan: "Ekor", bobot: "± 200 gr/ekor", status: "Karantina", pakanHarianKg: 48 },
];

export const stokPakan = [
  { nama: "Konsentrat Sapi", stok: 1200, satuan: "Kg", minimum: 500, harga: 6500, supplier: "CV Sumber Ternak" },
  { nama: "Pakan Ayam BR-1", stok: 380, satuan: "Kg", minimum: 400, harga: 8900, supplier: "PT Charoen" },
  { nama: "Pelet Ikan 781", stok: 640, satuan: "Kg", minimum: 300, harga: 12500, supplier: "Toko Mina Jaya" },
  { nama: "Hijauan Fermentasi", stok: 2100, satuan: "Kg", minimum: 800, harga: 1800, supplier: "Kelompok Tani Rukun" },
];

export const produkPos = [
  { sku: "SKU-001", nama: "Manggis Grade A", kategori: "Buah", stok: 320, satuan: "Kg", hpp: 12000, harga: 22000 },
  { sku: "SKU-002", nama: "Jambu Kristal", kategori: "Buah", stok: 210, satuan: "Kg", hpp: 9000, harga: 17000 },
  { sku: "SKU-003", nama: "Kangkung Segar", kategori: "Sayur", stok: 95, satuan: "Ikat", hpp: 1500, harga: 3500 },
  { sku: "SKU-004", nama: "Telur Ayam Kampung", kategori: "Peternakan", stok: 420, satuan: "Butir", hpp: 2200, harga: 3200 },
  { sku: "SKU-005", nama: "Ayam Broiler Potong", kategori: "Peternakan", stok: 68, satuan: "Ekor", hpp: 32000, harga: 45000 },
  { sku: "SKU-006", nama: "Nila Segar", kategori: "Perikanan", stok: 140, satuan: "Kg", hpp: 24000, harga: 36000 },
  { sku: "SKU-007", nama: "Bibit Cabai Rawit", kategori: "Bibit", stok: 500, satuan: "Polybag", hpp: 2000, harga: 5000 },
  { sku: "SKU-008", nama: "Pupuk Kandang 5kg", kategori: "Saprotan", stok: 88, satuan: "Sak", hpp: 12000, harga: 20000 },
];

export const penerimaanBarang = [
  { no: "TRM-2409", tanggal: "01 Sep 2026", supplier: "Kelompok Tani Rukun", item: 6, total: 4_250_000, status: "Selesai" },
  { no: "TRM-2408", tanggal: "30 Agu 2026", supplier: "PT Charoen", item: 2, total: 7_120_000, status: "Selesai" },
  { no: "TRM-2407", tanggal: "28 Agu 2026", supplier: "Toko Mina Jaya", item: 3, total: 2_980_000, status: "Menunggu" },
];

export const stokOpname = [
  { sku: "SKU-001", nama: "Manggis Grade A", sistem: 320, fisik: 314, satuan: "Kg" },
  { sku: "SKU-003", nama: "Kangkung Segar", sistem: 95, fisik: 95, satuan: "Ikat" },
  { sku: "SKU-004", nama: "Telur Ayam Kampung", sistem: 420, fisik: 408, satuan: "Butir" },
  { sku: "SKU-008", nama: "Pupuk Kandang 5kg", sistem: 88, fisik: 90, satuan: "Sak" },
];

export const bebanOperasional = [
  { pos: "Upah Pemetik & Harian", nilai: 12_400_000 },
  { pos: "Pakan Ternak & Ikan", nilai: 15_800_000 },
  { pos: "Pupuk & Saprotan", nilai: 6_300_000 },
  { pos: "Logistik & Distribusi", nilai: 4_150_000 },
  { pos: "Listrik, Air & Pemeliharaan", nilai: 2_950_000 },
  { pos: "Gaji Staf Toko", nilai: 2_000_000 },
];

export const pendapatanUnit = [
  { unit: "Kebun (Buah & Sayur)", nilai: 34_600_000 },
  { unit: "Peternakan", nilai: 21_400_000 },
  { unit: "Perikanan", nilai: 9_300_000 },
  { unit: "Toko UMKM (POS)", nilai: 6_500_000 },
];

export const cctvFeeds = [
  { id: "CAM-01", lokasi: "Gerbang Utama", status: "Online" },
  { id: "CAM-02", lokasi: "Blok 1 Manggis", status: "Online" },
  { id: "CAM-03", lokasi: "Kandang Sapi A", status: "Online" },
  { id: "CAM-04", lokasi: "Kolam Ikan 1-3", status: "Gangguan" },
];
