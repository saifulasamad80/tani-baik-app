# Step 2 — Pengalaman dan Antarmuka

Spesifikasi wireframe/prototipe hi-fi dan pedoman state UI daring vs luring untuk **Tani Baik**. Naskah ini mengunci prototipe Lovable yang sudah ada (TanStack Start, emerald/slate, lima rute dummy) dan **tidak** menggantinya dengan ERP generik.

**Sumber kebenaran visual:** `src/styles.css`, `src/routes/__root.tsx`, `src/components/app-sidebar.tsx`, `src/components/page-header.tsx`, rute `index` / `kebun` / `peternakan` / `pos` / `laporan`.

**Hukum yang tidak boleh disimpangkan di UI:** Biaya Rawat (contoh Rp 2.000/hari/ekor) **tidak** masuk HPP; `Laba = Penjualan − HPP`; hak pengelola 50%; hak kolam investor 50% lalu dipecah menurut porsi; silsilah `induk_id` wajib untuk anak lahir kandang; NIK tidak tampil di UI publik.

---

## Wireframes & High-Fidelity Prototype Specifications

### 1. Sistem desain (mengunci prototipe)

| Token | Nilai baku | Pemakaian |
| --- | --- | --- |
| Font | Plus Jakarta Sans | Seluruh UI; jangan ganti ke Inter/Roboto |
| Radius | `--radius: 0.75rem` | Kartu, tombol, input |
| Primer | `oklch(0.6 0.13 168)` emerald | CTA, badge aktif, grafik panen |
| Latar | `oklch(0.985 0.005 180)` | Canvas halaman |
| Teks | `oklch(0.21 0.03 250)` slate | Judul dan isi |
| Success / warning / info / destructive | token `--success` `--warning` `--info` `--destructive` | Status, gembok, antrean |
| Sidebar | `--sidebar` slate gelap | Navigasi kiri |
| Chart 1–5 | token `--chart-*` yang sudah ada | Jangan palet baru |

**Tipografi**

- Eyebrow `PageHeader`: 11px, uppercase, tracking 0.18em, warna primer.
- Judul halaman: 24px (`text-2xl`) bold tracking-tight.
- Judul kartu/section: 14px (`text-sm`) semibold.
- Label form: 14px; helper 12px `text-muted-foreground`.
- Angka uang dan kg: `tabular-nums`. Formatter wajib: `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })` untuk Rupiah; `Intl.NumberFormat("id-ID")` untuk kg/ekor.

**Kerangka aplikasi (shell)**

Desktop ≥1024px: sidebar 16rem + header sticky + `main` padding 24px.  
Tablet 768–1023px: sidebar ikon 3rem.  
Ponsel &lt;768px (`useIsMobile`): sidebar menjadi Sheet/drawer; tambah **bilah bawah empat pintasan**: Beranda, Kebun, Ternak, Kasir. Laporan, konsinyasi, dan pengaturan tetap di drawer.

Header (sudah ada, ditambah indikator koneksi):

```text
[☰]  [🔍 Cari menu, produk, blok…]     [● Terhubung | ☁︎ Luring n antrean]  [🔔]  [?]  [SS Saiful · Admin]
```

Jika luring: pita amber setinggi 36px tepat di bawah header, teks: **Mode luring — data tersimpan di perangkat, dikirim saat jaringan kembali.**

**Nada:** data-dense SaaS, bukan ilustrasi agraris. CCTV tetap kotak placeholder (`cctv-scan`), bukan stream. Kartu datar berbatas (`rounded-xl border bg-card shadow-sm`).

**Komponen baku (sudah ada, jangan diciptakan ulang):** `PageHeader`, `StatCard`, `Badge`, `Button`, `Input`, `Select`, `Tabs`, `Progress`, `Table`, `Dialog`/`Sheet`, `Toaster` (Sonner), `Sidebar`.

---

### 2. Informasi arsitektur layar (sitemap)

Rute yang sudah hidup dipertahankan; rute baru mengikuti konvensi file `src/routes/` (bukan `src/pages/`).

```text
/                         Dashboard operasional
/kebun                    Daftar blok + input panen
/kebun/$blokId            Detail blok: siklus, hama, kiriman
/peternakan               Hub ternak (individu + batch + pakan) — rute lama tetap
/ternak                   Daftar kambing/sapi per ekor
/ternak/$hewanId          Kartu aset + silsilah + porsi
/batch                    Unggas & ikan per kelompok
/pakan                    Stok & pembelian + flag HPP
/limbah                   Fermentasi → SKU pupuk
/konsinyasi               Kontrak, tagihan rawat, closing
/investor                 Portal warga (baca saja)
/pos                      Kasir 4 menu (rute lama)
/laporan                  Tab laba kebun vs bagi hasil ternak (rute lama, dipecah)
/warga                    Impor & master investor (admin)
/pengaturan               Tarif rawat, peran
```

Navigasi sidebar (perluasan `app-sidebar.tsx`):

1. Dashboard Utama  
2. Manajemen Kebun  
3. Manajemen Peternakan (anak: Individu, Batch, Pakan, Limbah)  
4. Konsinyasi  
5. POS / Kasir UMKM  
6. Laporan Keuangan  
7. Warga & Investor (admin / pengelola)  
8. Pengaturan (admin)

Portal investor memakai sidebar terpotong: Aset saya, Tagihan rawat, Bagi hasil. Tanpa Kasir, tanpa Closing, tanpa Impor.

---

### 3. Matriks peran × layar

| Layar | Pengelola | Mandor | Kasir | Investor | Admin |
| --- | --- | --- | --- | --- | --- |
| Dashboard | penuh | operasional (tanpa uang closing) | ringkas POS | aset sendiri | penuh |
| Kebun / panen / hama | ya | ya | tidak | tidak | ya |
| Kartu hewan + silsilah | ya | input metrik; tidak ubah porsi | tidak | lihat miliknya | ya |
| Batch / pakan / limbah | ya | ya | tidak | tidak | ya |
| Closing konsinyasi | ya | tidak | tidak | tidak | ya |
| Tagihan rawat (catat) | ya | ya (harian) | tidak | lihat tagihan sendiri | ya |
| POS Transaksi | ya | tidak | ya | tidak | ya |
| POS Penerimaan & Opname | ya | tidak | terkunci gembok | tidak | ya |
| POS Produk | ya | tidak | lihat | tidak | ya |
| Impor warga / tarif | tidak* | tidak | tidak | tidak | ya |
| NIK | tidak | tidak | tidak | tidak | kolom terenkripsi, bukan tabel publik |

\*Pengelola boleh melihat daftar warga sebagai calon pemilik, tanpa NIK dan tanpa tombol impor.

Gembok POS: ikon `Lock` di pojok kanan atas kartu 2×2 **dan** `pointer-events-none` + toast “Menu ini hanya untuk gudang/admin” jika peran kasir menekan. Ikon kosmetik tanpa penegakan peran **dilarang** (penyimpangan prototipe saat ini yang harus diperbaiki di S6).

---

### 4. Spesifikasi wireframe per layar

#### W-01 Dashboard (`/`)

Evolusi dari `src/routes/index.tsx`. Empat StatCard **tidak** boleh mencampur rumus kebun dengan pecahan 50/50.

```text
┌─────────────────────────────────────────────────────────────────┐
│ Ringkasan Operasional                                           │
│ Dashboard Utama                         [Data per 12:40] [Unduh]│
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Panen kebun  │ Populasi     │ Piutang rawat│ Laba kontrak       │
│ 8.420 Kg     │ 13.314 ekor  │ Rp 1.240.000 │ tertutup bulan ini │
│ Jan–Ags      │ kambing/sapi │ jatuh tempo  │ Rp … (bukan margin │
│              │ + batch      │  (bukan HPP) │    kebun)          │
├───────────────────────────────┬─────────────────────────────────┤
│ Hasil Panen Kebun (Kg)        │ Panen Ternak (Ekor)             │
│ [bar manggis / jambu / sayur] │ [line ekor siap jual]           │
├───────────────────────────────┴─────────────────────────────────┤
│ Perlu tindakan                                                  │
│ • 3 tagihan rawat jatuh tempo  • Pakan BR-1 di bawah minimum    │
│ • KMB-104 lahir kandang tanpa induk  • 4 transaksi POS antrean  │
├─────────────────────────────────────────────────────────────────┤
│ CCTV placeholder 2×2 (CAM-01…04) — bukan live; badge Gangguan   │
└─────────────────────────────────────────────────────────────────┘
```

**Aturan kartu:**

- “Piutang rawat” menampilkan jumlah tagihan Biaya Rawat yang belum lunas. Subteks wajib: **bukan komponen HPP**.
- “Laba kontrak tertutup” = Σ `Penjualan − HPP` kontrak yang closing di periode berjalan. Jangan pakai `(pendapatan − biaya operasional) / pendapatan` seperti dummy saat ini.
- Grafik panen kg tetap Recharts BarChart; grafik ekor LineChart. Satuan di badge.
- CCTV tetap placeholder. Status “Gangguan” memakai `bg-destructive`; jangan fetch stream.

**Empty:** jika belum ada panen, tabel aktivitas menampilkan “Belum ada panen tercatat. Catat dari Manajemen Kebun.”

---

#### W-02 Manajemen Kebun (`/kebun`)

Mempertahankan grid Blok 1–3 dan formulir panen yang sudah ada. Ongkos petik **selalu** `kg × 2.000` (`ONGKOS_PEMETIK_PER_KG`).

```text
[Stat: 3 blok | realisasi kg | ongkos pemetik bulan ini | kelembaban]

┌──────────┐ ┌──────────┐ ┌──────────┐
│ BLK-01   │ │ BLK-02   │ │ BLK-03   │
│ Manggis  │ │ Jambu    │ │ Sayur    │
│ 84% ████ │ │ 84% ████ │ │ 80% ███  │
│ [Detail] │ │ [Detail] │ │ [Detail] │
└──────────┘ └──────────┘ └──────────┘

┌ Input Hasil Panen ─────────┐  ┌ Riwayat Panen & Ongkos ──────────┐
│ Blok / Komoditas / Kg      │  │ Tgl | Blok | Kg | Pemetik | Ongkos│
│ Jumlah pemetik             │  │ …                                 │
│ ─ pratinjau ─              │  │ ongkos = kg × 2.000               │
│ Berat · Ongkos · Per orang │  └───────────────────────────────────┘
│ [Simpan Hasil Panen]       │
└────────────────────────────┘
Tab: Panen | Kiriman pasca-panen
```

**Form panen (wajib):** Blok, komoditas, berat kg, jumlah pemetik, grade (A/B). Pratinjau langsung di kotak dashed `bg-accent/40`. Tombol simpan disabled jika `kg ≤ 0`.

**Tab Kiriman:** papan monitoring kg terkirim vs sisa per blok (bukan rumus konsinyasi).

**Luring:** titik oranye pada kartu blok jika ada `pending_panen`.

---

#### W-03 Detail blok (`/kebun/$blokId`)

```text
Blok 1 — Lereng Timur          [Panen]  Mandor: Pak Sukirman
Manggis · 2,4 Ha · 480 pohon

[Linimasa siklus]  Pembibitan ── Perawatan ──● Panen

Kolom kiri: Log hama (tanggal, gejala, tindakan, foto opsional ≤200 KB)
Kolom kanan: Grafik kg dipanen vs dikirim vs sisa
```

Tidak ada pecahan 50/50 di layar ini. Jika blok kelak dikonsinyasikan, tampilkan badge “Konsinyasi terpisah” yang menaut ke kontrak — MVP default: milik pengelola.

---

#### W-04 Ternak individu (`/ternak`)

Mengganti tabel populasi massal di prototipe untuk **kambing/sapi**. Ayam/ikan pindah ke `/batch`.

```text
[Filter: Hidup | Kontes | Siap jual | Mati]  [Daftarkan kelahiran]

ID     | Nama | Kelamin | Bobot | Induk     | Pemilik (porsi) | Status
KMB-12 | Sari | Betina  | 38 kg | KMB-03    | 2 warga · 50/50 | Hidup
KMB-18 | —    | Jantan  | 42 kg | (kosong!) | 1 warga · 100%  | Kontes
```

**Daftarkan kelahiran** (Dialog):

- Induk (wajib, combobox hewan betina hidup di cache).
- Pejantan (opsional).
- Tanggal lahir, bobot lahir, pemilik awal (salin dari induk atau pilih N warga; jumlah porsi = 1,0).
- Submit ditolak jika induk kosong. Copy: **Anak lahir di kandang wajib punya induk.**

Baris dengan `induk_id` kosong + `asal = lahir_kandang` memakai badge destructive “Tanpa induk”.

---

#### W-05 Kartu hewan + silsilah (`/ternak/$hewanId`)

Layar kritikal valuasi kontes. Tiga kolom desktop; tumpuk di ponsel: metrik → pohon → pemilik.

```text
┌ Metrik ekor ─────────────┐  ┌ Silsilah maternal (3 gen) ┐  ┌ Pemilik ──────────┐
│ ID KMB-12  Betina  Hidup │  │         [Nenek]           │  │ Warga A  50%      │
│ Bobot 38 kg              │  │            │              │  │ Warga B  50%      │
│ Kesehatan: Sehat         │  │         [Induk]           │  │ Jumlah   100% ✓   │
│ HPP berjalan             │  │            │              │  │ [Ubah porsi]      │
│  bibit + pakan dasar     │  │       [Individu]          │  └───────────────────┘
│  Rp 4.000.000            │  │         /    \            │
│  (bukan biaya rawat)     │  │     [Anak1] [Anak2]       │
│ Piutang rawat terpisah   │  │ Jalur pejantan opsional   │
│  Rp 180.000              │  │ ditampilkan garis putus   │
└──────────────────────────┘  └───────────────────────────┘
```

**Aturan tampilan HPP:** label persis **HPP berjalan (bibit + pakan dasar)**. Biaya Rawat **tidak** boleh berada dalam rumus yang sama; tampilkan di kartu terpisah “Piutang Biaya Rawat”.

**Pohon:**

- Tiga generasi tampak: nenek → induk → individu → anak.
- Jalur maternal solid; pejantan dashed + teks “(opsional)”.
- Klik node menuju kartu hewan itu.
- Siklus tidak mungkin dari UI: combobox induk menolak diri sendiri dan keturunan (daftar disaring). Jika server menolak, toast: **Silsilah sirkular ditolak.**

**Porsi:** slider/input persen. Simpan disabled jika jumlah ≠ 100%. Peringatan merah: **Jumlah porsi harus 100%.**

**Valuasi kontes:** panel bawah menampilkan jalur maternal sebagai teks berantai `Nenek → Induk → Individu` untuk disalin ke lembar juri. Bukan harga otomatis.

---

#### W-06 Batch unggas/ikan (`/batch`)

Tidak ada tautan silsilah, tidak ada `induk_id`.

```text
┌ Kandang B1 Broiler ┐  ┌ Kolam 1–3 Nila ┐
│ 1.850 ekor         │  │ 6.200 ekor     │
│ Siap jual          │  │ Sehat          │
│ Pakan 185 kg/hari  │  │ Pakan 62 kg/hr │
│ Penyusutan −12 hr  │  │ [Catat mati]   │
└────────────────────┘  └────────────────┘
```

Form penyusutan: tanggal, jumlah ekor, alasan (mati/hilang/afkir). Populasi tidak boleh negatif.

---

#### W-07 Pakan (`/pakan`)

Evolusi formulir pembelian di `peternakan.tsx`.

**Tabel stok:** nama, stok, minimum, harga, supplier. Progress bar; `stok < minimum` teks destructive + ikon `TriangleAlert`.

**Form pembelian:** jenis, supplier, jumlah, catatan, total = qty × harga.

**Alokasi harian (wajib, baru):**

- Pilih tujuan: hewan individu **atau** batch.
- Kg dialokasikan.
- Checkbox **Pakan dasar (masuk HPP hewan/batch)** vs **Pakan operasional (beban pengelola, tidak masuk HPP bagi hasil)**.
- Default: tidak tercentang sebagai HPP — pengguna harus sadar menandai pakan dasar.
- Helper: **Hanya pakan dasar yang masuk rumus Laba = Penjualan − HPP. Biaya Rawat bukan pakan.**

---

#### W-08 Limbah → pupuk (`/limbah`)

Stepper 3 langkah, bukan stok “hadiah”.

```text
1. Input kotoran (kg) dari kandang/batch
2. Hasil fermentasi (kg atau karung) + biaya pengumpulan/fermentasi/kemasan
3. SKU gudang “Pupuk Organik”
   HPP unit = (biaya pengumpulan + fermentasi + kemasan) / unit jadi
   [pratinjau HPP] → [Masukkan stok]
```

SKU hasil langkah 3 muncul di POS. Penjualan pupuk memakai HPP ini, terpisah dari HPP hewan. Jangan menampilkan “gratis dari kandang”.

---

#### W-09 Konsinyasi & closing (`/konsinyasi`)

Layar mesin keuangan. Hanya pengelola/admin.

**Daftar:** kontrak per ekor/batch: ID aset, pemilik, porsi, status (berjalan / closing / rugi tercatat), piutang rawat.

**Lembar closing (Dialog lebar):**

```text
Closing KMB-12
Penjualan          Rp 10.000.000     ← input
HPP
  Bibit/nilai masuk   Rp 3.200.000
  Pakan dasar         Rp   800.000
  ───────────────────────────────
  Total HPP           Rp 4.000.000    ← tidak memuat rawat
Laba bersih           Rp 6.000.000    Penjualan − HPP

Hak pengelola 50%     Rp 3.000.000
Hak kolam investor    Rp 3.000.000
  Warga A  50% porsi → 25% laba = Rp 1.500.000
  Warga B  50% porsi → 25% laba = Rp 1.500.000

┌ Piutang Biaya Rawat (tidak mengurangi laba) ─────────┐
│ Tarif Rp 2.000/hari/ekor × hari × porsi              │
│ Warga A Rp 90.000  ·  Warga B Rp 90.000  · tetap     │
│ piutang meski kontrak ditutup                        │
└──────────────────────────────────────────────────────┘

[Batal]                    [Tutup kontrak]
```

**Jika Laba &lt; 0:** hak bagi hasil = 0; status “Rugi tercatat”; **jangan** menagih bagi rugi. Piutang rawat tetap ada. Copy: **MVP tidak membagi rugi. Hak bagi hasil Rp 0.**

**Luring:** tombol “Tutup kontrak” **disabled**. Teks: **Butuh jaringan untuk menutup kontrak.** Tagihan rawat harian tetap bisa diantrekan.

Contoh uji UI wajib (dua pemilik setara): penjualan Rp 10.000.000, HPP Rp 4.000.000 → laba Rp 6.000.000 → pengelola Rp 3.000.000 → tiap investor Rp 1.500.000.

---

#### W-10 POS (`/pos`)

Replikasi referensi visual yang sudah ada: hero teal “UMKM Benih Tani Baik”, search pill, ringkasan 3 kolom, **kisi 2×2**.

| Kartu | Warna prototipe | Kunci |
| --- | --- | --- |
| Transaksi Penjualan | `bg-destructive` | terbuka untuk kasir |
| Penerimaan Barang | `bg-warning` | gembok kecuali gudang/admin |
| Manajemen Produk | `bg-primary` | terbuka (kasir lihat; ubah = admin) |
| Stok Opname | `bg-info` | gembok kecuali gudang/admin |

Kasir penjualan: grid produk + keranjang kanan + Bayar. SKU dari closing ternak dan pupuk organik muncul otomatis (setelah S5).

Struk: nama toko, item, total, catatan **luring** jika transaksi masih di outbox: “Struk lokal — menunggu sinkron”.

---

#### W-11 Laporan (`/laporan`)

Dua tab yang **tidak** dijumlahkan menjadi satu angka.

- **Tab A — Laba kebun:** `ProfitKebun = Penjualan − BiayaPetani` (termasuk ongkos petik Rp 2.000/kg). Grafik dan tabel unit kebun.
- **Tab B — Bagi hasil ternak:** hanya kontrak tertutup: Penjualan, HPP (bibit + pakan dasar), Laba, Hak pengelola, Hak investor per warga. Kolom terpisah “Piutang rawat masih terbuka”.

Banner di atas tab: **Dua laporan ini memakai rumus berbeda. Jangan dijumlahkan.**

Ekspor: CSV di klien (tanpa layanan PDF berbayar). CSV investor **tanpa NIK**.

Dummy saat ini (`Pendapatan − Biaya operasional = Profit`) diganti agar tidak mencampur Biaya Rawat ke laba.

---

#### W-12 Portal investor (`/investor`)

```text
Aset saya
  KMB-12 porsi 50%  status Hidup
  Tagihan rawat Agustus  Rp 90.000  belum lunas
  Estimasi hak (hanya tampil setelah closing)  —

Tanpa: NIK, tombol closing, POS, impor, pengaturan tarif
```

Empty: “Belum ada aset atas nama Anda. Hubungi pengelola kandang.”

---

#### W-13 Impor warga (`/warga`) — admin

Sumber: Excel *Data Lama warga RT07 sebelum ada carik.xlsx* (731 jiwa, 217 KK, 143 rumah, 6 dasawisma). **Bukan** buku ternak.

Kolom UI: Nama, No. Rumah, KK, status tetap/tidak tetap, dasawisma.  
**NIK tidak dirender** di tabel, toast, CSV ekspor investor, atau `console`.

Pratinjau impor: jumlah baris, KK unik, peringatan duplikat nama+rumah. Tombol “Terapkan impor” hanya daring.

---

#### W-14 Pengaturan (`/pengaturan`) — admin

- Tarif Biaya Rawat baku: **Rp 2.000 / hari / ekor** (dapat diubah; tagihan memakai tarif efektif per periode).
- Ongkos pemetik kebun: **Rp 2.000 / kg** (konstanta terpisah, jangan disatukan dengan tarif rawat).
- Peran pengguna.
- Helper: **Tarif rawat ditagihkan ke investor dan tidak masuk HPP.**

---

### 5. Pola interaksi hi-fi

- **Loading:** `Skeleton` pada StatCard dan tabel; jangan spinner penuh halaman kecuali rute pertama.
- **Empty:** satu kalimat tindakan, tanpa ilustrasi. Contoh: “Daftarkan kelahiran dengan memilih induk.”
- **Validasi:** inline di bawah field; toast hanya untuk hasil simpan/gagal.
- **Toast sukses finansial** wajib memuat angka rumus, contoh: `Hak Anda Rp 1.500.000 (25% laba)`. Jangan toast generik “Berhasil”.
- **Toast luring:** `Disimpan di perangkat, akan dikirim saat daring.` Dilarang: “Gagal terhubung ke server” untuk mutasi yang sengaja diantrekan.
- **Dialog merusak (closing, hapus porsi):** `AlertDialog` dengan ringkasan angka. Closing tidak bisa diurungkan dari UI MVP.
- **Mode gelap:** ikuti token `.dark` yang ada; jangan palet baru.
- **Sentuhan:** target tombol kasir ≥44px; kartu POS 2×2 tinggi 7rem (`h-28`) seperti prototipe.

---

### 6. Copy mikro (bahasa Indonesia)

| Situasi | Teks baku |
| --- | --- |
| Banner luring | Mode luring — data tersimpan di perangkat, dikirim saat jaringan kembali. |
| Closing luring | Butuh jaringan untuk menutup kontrak. |
| Induk belum di cache | Induk belum ada di perangkat. Buka kartu induk saat daring, lalu coba lagi. |
| Porsi ≠ 100% | Jumlah porsi harus 100%. |
| Anak tanpa induk | Anak lahir di kandang wajib punya induk. |
| Siklus silsilah | Silsilah sirkular ditolak. |
| Gembok POS | Menu ini hanya untuk gudang atau admin. |
| Impor luring | Impor master warga memerlukan jaringan. |
| Rawat ≠ HPP | Biaya rawat ditagihkan ke investor dan tidak masuk laba. |
| Rugi | Hak bagi hasil Rp 0. Rugi dicatat, tidak ditagihkan ke investor. |
| NIK | (tidak ada copy — field tidak ada di UI publik) |

---

## Offline UI State Guidelines

Deteksi luring: `navigator.onLine === false` **atau** ping health Supabase gagal dua kali. Banner “Mode luring” selalu di header pada kedua kasus. Titik hijau **Terhubung** hanya jika keduanya lulus.

Format di bawah: per permukaan, **keadaan daring** vs **keadaan luring**.

### Cangkang aplikasi

- **Daring:** navigasi penuh; data server sumber kebenaran; titik hijau “Terhubung”.
- **Luring:** navigasi tetap terlihat; rute yang belum pernah dibuka menampilkan “Belum tersedia luring — buka sekali saat daring.”; pita amber + ikon cloud-off + badge jumlah item antrean.

### Dashboard

- **Daring:** angka live; badge “Data diperbarui {relatif}”.
- **Luring:** angka dari snapshot IndexedDB terakhir; lencana “Data per {waktu}”; grafik **tidak** dikosongkan — pakai snapshot; kartu “Perlu tindakan” menyembunyikan item yang butuh server (kecuali antrean lokal).

### Kebun / panen / hama / kiriman

- **Daring:** simpan langsung; ongkos petik terhitung; riwayat dari server.
- **Luring:** formulir panen dan log hama **aktif**; tulis `pending_panen` / `pending_hama`; kartu blok menandai titik oranye “menunggu kirim”; tab kiriman memakai cache; tidak ada ekspor CSV.

### Kartu hewan dan silsilah

- **Daring:** pohon dari CTE server; validasi anti-siklus di server; porsi disimpan atomik.
- **Luring:** pohon dari salinan lokal (maks. yang pernah diunduh); pendaftaran kelahiran diizinkan **hanya jika induk ada di cache**; jika induk belum diunduh, tombol dinonaktifkan: “Induk belum ada di perangkat.”; ubah porsi pemilik **diblokir** (kebenaran N:M tidak boleh pecah).

### Batch, pakan, limbah

- **Daring:** stok dan HPP pupuk terbarui di server.
- **Luring:** input populasi/penyusutan, pembelian pakan, dan langkah fermentasi **diantrekan**; HPP unit ditampilkan sebagai **pratinjau lokal** (angka abu-abu) dan dikunci ulang di server saat sinkron; checkbox “masuk HPP” tetap bisa dipilih, tetapi closing tidak membaca pratinjau klien.

### Konsinyasi / closing

- **Daring:** closing mengunci kontrak, menulis jurnal, memunculkan SKU POS; tagihan rawat tetap piutang terpisah.
- **Luring:** closing **diblokir**. Alasan: pecahan 50/50 dan piutang rawat tidak boleh dihitung ganda saat antrean bertabrakan. Tombol menjadi “Butuh jaringan untuk menutup kontrak”. Pencatatan tagihan rawat harian **boleh** masuk antrean (bukan closing).

### POS penjualan

- **Daring:** stok berkurang segera; struk tersimpan di server.
- **Luring:** keranjang dan bayar tunai **aktif**; stok lokal dikurangi secara optimistik; transaksi masuk `outbox` dengan `client_mutation_id`; struk bertanda “lokal”; setelah daring, jika stok server &lt; terjual, modal: “Stok server {n} — pilih: batalkan item / paksa sesuaikan”.

### POS penerimaan barang dan stok opname

- **Daring:** terbuka hanya untuk gudang/admin; menulis stok server.
- **Luring:** tetap terkunci peran **dan** butuh daring — bahkan admin melihat “Opname dan penerimaan memerlukan jaringan.” Tidak masuk outbox.

### Portal investor

- **Daring:** piutang dan porsi live (RLS `warga_id`).
- **Luring:** baca cache milik sendiri; tidak ada tombol bayar (MVP tanpa gateway); jika cache kosong, “Buka portal ini sekali saat daring.”

### Impor warga / pengaturan tarif / peran

- **Daring:** admin saja; impor XLSX/CSV; ubah tarif Rp 2.000.
- **Luring:** dinonaktifkan penuh — “Impor master warga memerlukan jaringan.” / “Ubah tarif memerlukan jaringan.”

### Indikator dan kesalahan

- **Daring:** toast merah + kode singkat untuk gagal server; retry eksplisit.
- **Luring:** jangan toast “gagal server” untuk mutasi yang diantrekan; pakai “Disimpan di perangkat, akan dikirim saat daring.”
- **Daring:** titik hijau “Terhubung”.
- **Luring:** pita warning amber di bawah header; ikon cloud-off; jumlah item antrean; klik badge antrean membuka daftar outbox (jenis, waktu, status replay).

### Konflik setelah kembali daring

- Panen/hama: last-write-wins berdasar `updated_at`; toast “Panen {id} disinkronkan”.
- Stok POS: server menang; modal selisih wajib (lihat POS luring).
- Silsilah: replay kelahiran dengan `induk_id` yang sudah dihapus di server → gagal; UI “Induk tidak ditemukan, pilih ulang.”
- Closing tidak pernah di-replay dari outbox (tidak masuk antrean).

### Privasi luring

- Replica Dexie di perangkat mandor/kasir **tidak** berisi NIK.
- Logout membersihkan IndexedDB.
- Portal investor tidak men-cache data warga lain.

---

## Lampiran A — Pemetaan prototipe → target MVP

| Sekarang | Target Step 2 |
| --- | --- |
| `/` StatCard “Profit Margin” dari pendapatan−biaya | Ganti ke piutang rawat + laba kontrak tertutup |
| `/peternakan` satu tabel populasi campur | Pecah individu (`/ternak`) vs batch (`/batch`) |
| POS gembok hanya ikon | Gembok + penegakan peran |
| `/laporan` satu rumus operasional | Dua tab: laba kebun vs bagi hasil |
| Belum ada silsilah | W-05 pohon 3 generasi |
| Belum ada offline | Banner, outbox, closing diblokir luring |

## Lampiran B — Kriteria penerimaan UX (bukan tiket teknik)

1. Satu kambing dua pemilik setara, closing Rp 10.000.000 / HPP Rp 4.000.000 menampilkan pengelola Rp 3.000.000 dan tiap investor Rp 1.500.000, dengan piutang rawat di blok terpisah.
2. Formulir kelahiran tidak bisa disimpan tanpa induk.
3. Kasir luring dapat menekan Bayar; pengelola luring tidak dapat menekan Tutup kontrak.
4. NIK tidak muncul di DOM portal investor (inspeksi: tidak ada label “NIK”).
5. Kartu dashboard tidak menampilkan satu angka yang menjumlahkan laba kebun dengan hak bagi hasil.
