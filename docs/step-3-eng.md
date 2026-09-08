# Step 3 — Teknik dan Rekayasa

Dokumen arsitektur teknis (TAD), blueprint cache PWA, dan backlog tiket untuk **Tani Baik**. Naskah ini mengunci prototipe Lovable yang sudah ada (TanStack Start, Cloudflare/Nitro, data dummy) dan **tidak** menggantinya dengan ERP generik atau hosting berbayar.

**Sumber kebenaran teknik:** `package.json`, `vite.config.ts` (`@lovable.dev/vite-tanstack-config`, target Nitro/Cloudflare), `src/server.ts`, `src/start.ts`, `src/router.tsx` (QueryClient sudah terpasang, belum dipakai data), `src/lib/dummy-data.ts`, lima rute prototipe, Step 1 (PRD/roadmap), Step 2 (`docs/step-2-ux.md`).

**Hukum yang tidak boleh disimpangkan di skema, serverFn, maupun tes:**

- Biaya Rawat (baku Rp 2.000/hari/ekor) adalah **piutang investor**, **bukan** komponen HPP.
- `LabaBersih = Penjualan − HPP_hewan`; `HPP_hewan = bibit/nilai masuk + pakan dasar`.
- Hak pengelola 50%; hak kolam investor 50% lalu dipecah menurut porsi; 2 pemilik setara = 25% laba masing-masing.
- Jika laba &lt; 0: hak bagi hasil = 0; rugi dicatat; MVP **tidak** bagi rugi.
- Silsilah: `hewan.induk_id → hewan.id` wajib untuk `asal = lahir_kandang`; `pejantan_id` opsional; larangan siklus.
- NIK tidak tampil di UI publik, tidak masuk IndexedDB, tidak masuk log, tidak masuk CSV investor.
- Closing kontrak **hanya daring**; panen/POS/tagihan rawat harian boleh antrean.

File kode aplikasi **tidak** diubah pada fase cetak biru ini.

---

# Technical Architecture Document (TAD)

## 0. Keputusan stack (jangan diganti tanpa alasan kuota $0)

| Lapisan | Pilihan baku | Alasan | Dilarang |
| --- | --- | --- | --- |
| Frontend | React 19 + TanStack Start/Router/Query + Vite 8 + Tailwind 4 + shadcn yang sudah ada | Repo sudah jalan; QueryClient di `src/router.tsx` siap | Next.js, `src/pages/`, rewrite shell |
| PWA | `vite-plugin-pwa` (Workbox) + Dexie IndexedDB | Gratis, cocok Vite; local-first jika kuota cloud penuh | Firebase Hosting berbayar, Cordova |
| Auth / DB | Supabase Free: Auth + Postgres + RLS + Storage terkompresi | README menunda Supabase **hanya** untuk prototipe UI; MVP butuh Postgres | Firebase Auth/Firestore (ganda + risiko Blaze/CC) |
| Logika istimewa | TanStack `createServerFn` di Cloudflare Workers (Nitro yang sudah ada) | Closing, impor NIK, anti-siklus cadangan, replay outbox | Service-role key di klien; Edge function berbayar |
| Hosting UI | Lovable → Cloudflare (default `vite.config.ts`) | $0, sudah terpasang | Vercel/Netlify tambahan (pecah sumber kebenaran deploy) |
| Sumber kode | GitHub + sinkron Lovable | `AGENTS.md`: jangan rewrite history | Force-push, rebase komit yang sudah di-push |
| Paket | npm/bun yang sudah ada; tambah `@supabase/supabase-js`, `dexie`, `vite-plugin-pwa`, `xlsx` (impor RT07) | Semua gratis | ORM berbayar, PDF SaaS, gateway bayar |

Jika kuota Supabase Free terancam: mode **local-first IndexedDB** tetap mengoperasikan kandang dan POS; sinkron ditunda, closing tetap diblokir sampai daring.

---

## 1. Frontend

### 1.1 Cangkang yang dipertahankan

- Rute file di `src/routes/` (konvensi `src/routes/README.md`). Rute lama `/`, `/kebun`, `/peternakan`, `/pos`, `/laporan` **tetap hidup**; rute baru mengikuti sitemap Step 2.
- Shell: `src/routes/__root.tsx` + `src/components/app-sidebar.tsx` + `PageHeader`. Indikator koneksi dan pita luring ditambah di sini, bukan layout baru.
- Data dummy (`src/lib/dummy-data.ts`) diganti per sprint; konstanta `ONGKOS_PEMETIK_PER_KG = 2000` pindah ke tabel `parameter_sistem` dengan kunci terpisah dari tarif rawat.

### 1.2 Peta modul klien (target)

```text
src/
  lib/
    supabase.ts          # klien anon + session; dilarang service_role
    db/dexie.ts          # skema replica (tanpa NIK)
    outbox/              # client_mutation_id, replay, konflik
    finance/             # rumus murni; PR hanya sol atau Grok 4.6 + auto-review
    silsilah/            # pratinjau pohon 3 gen dari cache; server tetap otoritatif
    pwa/                 # register SW, ping health, banner luring
  routes/                # file routes TanStack (bukan src/pages)
  server/fns/            # createServerFn: closing, impor, anti-siklus, replay
```

### 1.3 Aliran data UI

1. **Daring:** TanStack Query memuat dari Supabase (RLS) atau serverFn. `staleTime` pendek untuk uang; snapshot ditulis ke Dexie.
2. **Luring:** Query `placeholderData` / `initialData` dari Dexie. Mutasi yang diizinkan Step 2 masuk outbox (`pending_*`). Mutasi terlarang (closing, opname, impor, ubah porsi, ubah tarif) **disabled** di UI — jangan mengandalkan gagal jaringan.
3. **Kembali daring:** pemutar outbox berurutan per jenis; closing **tidak pernah** ada di outbox.

### 1.4 Peran di klien

Klaim peran dari tabel `profil.peran` (`admin` | `pengelola` | `mandor` | `kasir` | `gudang` | `investor`). Gembok POS adalah **penegakan peran**, bukan ikon. Portal `/investor` memakai query yang sudah terfilter RLS `warga_id`; UI tidak “menyembunyikan” baris orang lain sebagai satu-satunya kontrol.

---

## 2. Backend

Tidak ada API domain hari ini (`src/server.ts` hanya pembungkus SSR + halaman error; `src/start.ts` memasang CSRF untuk `serverFn`). Backend MVP = **Postgres + RLS sebagai hukum**, plus **sedikit serverFn** untuk operasi yang tidak boleh dijalankan dari klien.

### 2.1 Batas tanggung jawab

| Operasi | Jalur | Alasan |
| --- | --- | --- |
| CRUD blok, panen, hama, hewan (non-silsilah), batch, pakan, tagihan rawat harian | Klien → Supabase (RLS) | Volume tinggi, cukup kebijakan baris |
| Ubah porsi N:M | Klien + constraint/trigger `SUM(porsi)=1` | Atomik di DB; UI luring diblokir |
| Daftar kelahiran (`induk_id`) | Klien + trigger anti-siklus + CHECK asal | DB menolak siklus meski UI disaring |
| **Closing kontrak** | **serverFn saja, daring** | Pecahan 50/50, HPP, piutang rawat tidak boleh dihitung ganda |
| Impor RT07 + enkripsi NIK | **serverFn admin** | Service role + `pgp_sym_encrypt`; NIK tidak lewat klien mentah |
| Replay outbox POS (konflik stok) | serverFn | Server menang pada stok; klien pilih batalkan/sesuaikan |
| Pratinjau silsilah 3 gen | VIEW / RPC `silsilah_tiga_generasi(hewan_id)` | CTE rekursif di Postgres |

### 2.2 ServerFn closing (kontrak semu)

Satu transaksi Postgres, urutan wajib:

1. Kunci baris `kontrak_konsinyasi` (`status = berjalan`).
2. Hitung `HPP = nilai_masuk + SUM(alokasi_pakan WHERE masuk_hpp)`.
3. **Jangan** baca `tagihan_rawat` ke dalam HPP.
4. `laba = penjualan − HPP`. Jika `laba < 0` → hak pengelola = 0, hak investor = 0, status `rugi_tercatat`.
5. Jika `laba ≥ 0` → hak pengelola = `0.50 * laba`; kolam investor = `0.50 * laba`; tiap pemilik `kolam * porsi_i`.
6. Tulis `closing_jurnal` + `closing_bagi_investor`; tutup kontrak; buat SKU POS jika aset dijual.
7. Piutang rawat yang belum lunas **tetap terbuka**.

Modul `src/lib/finance/` harus mengekspor fungsi murni yang sama dipakai tes unit dan serverFn. Mini/luna **dilarang** menyentuh file ini.

### 2.3 CSRF dan rahasia

CSRF `createCsrfMiddleware` di `src/start.ts` tetap untuk semua `serverFn`. Kunci `SUPABASE_SERVICE_ROLE` dan `NIK_PGP_PASSPHRASE` hanya di env Workers/Nitro, **bukan** `VITE_*`.

---

## 3. Database (self-referencing wajib)

Satu proyek Supabase Free, skema `public`. UUID di mana-mana. `updated_at` untuk last-write-wins panen/hama.

### 3.1 Identitas dan warga RT07

```text
profil (id = auth.uid())
  peran, nama_tampilan, warga_id nullable

warga
  id, nama, no_rumah, no_kk, status_tetap, dasawisma
  nik_cipher bytea          -- pgcrypto; NULL jika tidak diimpor
  UNIQUE (nama, no_rumah, no_kk) defensif duplikat impor

VIEW warga_publik AS
  SELECT id, nama, no_rumah, no_kk, status_tetap, dasawisma
  FROM warga;
  -- NIK tidak ada di view ini. Replica Dexie hanya menyalin view.
```

Impor: 731 jiwa, 217 KK, 143 rumah, 6 dasawisma dari *Data Lama warga RT07 sebelum ada carik.xlsx* — master calon investor, **bukan** ledger ternak.

### 3.2 Kebun

```text
blok (id, kode, nama, komoditas, luas_ha, pohon, status_siklus, mandor_profil_id)
siklus_tanam (blok_id, fase, mulai, selesai)
log_hama (blok_id, tanggal, gejala, tindakan, foto_path nullable ≤200 KB)
panen (blok_id, tanggal, kg, grade, jumlah_pemetik)
  ongkos_petik = kg × parameter ongkos_pemetik_per_kg (baku 2000)
kiriman_pasca_panen (panen_id, kg_dikirim, tanggal)
penjualan_kebun (… )  -- ProfitKebun = penjualan − biaya_petani (termasuk petik)
```

Laba kebun **bukan** rumus konsinyasi. Flag konsinyasi blok opsional; MVP default milik pengelola.

### 3.3 Ternak individu — self-referencing

```text
hewan
  id uuid PK
  kode text UNIQUE          -- contoh KMB-12
  nama text
  spesies text CHECK IN ('kambing','sapi')
  kelamin text CHECK IN ('jantan','betina')
  asal text CHECK IN ('lahir_kandang','beli','hibah')
  status text CHECK IN ('hidup','jual','mati','kontes')
  bobot_kg numeric
  nilai_masuk numeric NOT NULL DEFAULT 0   -- bibit / nilai masuk → HPP
  induk_id uuid REFERENCES hewan(id)       -- SELF-REF maternal
  pejantan_id uuid REFERENCES hewan(id)    -- SELF-REF paternal, opsional
  CHECK (induk_id IS DISTINCT FROM id)
  CHECK (pejantan_id IS DISTINCT FROM id)
  CHECK (asal <> 'lahir_kandang' OR induk_id IS NOT NULL)
```

**Trigger `hewan_anti_siklus` (BEFORE INSERT OR UPDATE OF induk_id, pejantan_id):** CTE rekursif menelusuri rantai `induk_id` (dan terpisah `pejantan_id`). Jika `NEW.id` muncul sebagai leluhur → `RAISE` setara copy UI: silsilah sirkular ditolak. Hewan tidak boleh nenek moyang dirinya.

**RPC tampilan 3 generasi** (nenek → induk → individu → anak): rekursif terbatas `depth ≤ 2` ke atas pada jalur maternal (valuasi kontes) plus satu tingkat anak. Pejantan tidak mengganti jalur maternal.

### 3.4 Kepemilikan N:M

```text
hewan_kepemilikan
  hewan_id FK, warga_id FK, porsi numeric(6,4)
  PRIMARY KEY (hewan_id, warga_id)
  CHECK (porsi > 0 AND porsi <= 1)

TRIGGER: SUM(porsi) per hewan_id = 1.0000 (deferrable dalam satu transaksi ubah porsi)
```

### 3.5 Batch unggas/ikan dan pakan

```text
batch (id, jenis, lokasi, populasi, satuan, status)  -- tidak ada induk_id
batch_penyusutan (batch_id, tanggal, jumlah, alasan)
pakan_sku (nama, stok, minimum, harga, supplier)
pakan_beli (pakan_sku_id, qty, total)
pakan_alokasi
  tujuan_hewan_id XOR tujuan_batch_id
  kg, masuk_hpp boolean     -- true = pakan dasar (HPP); false = operasional pengelola
```

Hanya baris `masuk_hpp = true` yang masuk `HPP_hewan` / HPP batch saat closing.

### 3.6 Limbah → pupuk

```text
limbah_input (sumber_hewan_atau_batch, kg_kotoran, tanggal)
fermentasi (limbah_id, kg_hasil, biaya_kumpul, biaya_fermentasi, biaya_kemasan)
  hpp_unit = (kumpul + fermentasi + kemasan) / unit_jadi
sku_gudang (kode, nama 'Pupuk Organik', hpp_unit, stok)
```

HPP pupuk **terpisah** dari HPP hewan. Dilarang stok “hadiah”.

### 3.7 Smart contract — dua aliran kas

```text
parameter_sistem (kunci PK, nilai_numerik)
  'tarif_rawat_harian' = 2000
  'ongkos_pemetik_per_kg' = 2000     -- kunci TERPISAH, jangan disatukan

kontrak_konsinyasi
  aset: hewan_id XOR batch_id
  status: berjalan | closing | rugi_tercatat
  ditutup_at

tagihan_rawat                    -- ALIRAN A: piutang, BUKAN HPP
  kontrak_id, warga_id, periode
  tarif_harian (snapshot), hari, ekor_efektif, porsi
  jumlah = tarif × hari × ekor_efektif × porsi
  lunas boolean
  -- tidak ada FK dari closing_jurnal ke jumlah ini

closing_jurnal                   -- ALIRAN B: laba
  penjualan, hpp_bibit, hpp_pakan_dasar
  laba_bersih = penjualan − (hpp_bibit + hpp_pakan_dasar)
  hak_pengelola, hak_kolam_investor   -- 0 jika laba < 0
  -- KOLOM BIAYA RAWAT DILARANG di tabel ini

closing_bagi_investor (closing_id, warga_id, porsi, hak)
```

Contoh uji wajib (2 pemilik setara): penjualan 10.000.000, HPP 4.000.000 → laba 6.000.000 → pengelola 3.000.000 → tiap investor 1.500.000; piutang rawat tidak mengubah angka itu.

### 3.8 POS dan outbox server

```text
sku_pos (kode, nama, stok, hpp, harga, sumber: kebun|closing_ternak|pupuk|lain)
pos_transaksi (id, client_mutation_id UNIQUE, status, luring boolean)
pos_item (...)
penerimaan_barang (...)          -- hanya gudang/admin, hanya daring
stok_opname (...)                -- sama
outbox_dead_letter (mutation, alasan)  -- replay gagal (induk terhapus, dll.)
```

### 3.9 RLS (ringkas)

- `warga_publik`: terautentikasi baca; tulis hanya admin via serverFn.
- `hewan` / `batch` / `blok`: mandor+pengelola+admin tulis; investor baca jika `hewan_kepemilikan.warga_id` miliknya.
- `tagihan_rawat`: investor hanya baris sendiri; kasir tidak lihat.
- `closing_jurnal`: pengelola+admin; investor lihat pecahan miliknya.
- `nik_cipher`: tidak di GRANT ke `authenticated`; hanya fungsi `security definer` admin.

---

## 4. Deployment $0

```text
Pengembang  →  GitHub  →  Lovable (editor) + Cloudflare Workers/Nitro (app)
                              ↓
                    Supabase Free (Auth, Postgres, Storage foto hama)
                              ↓
                    Perangkat lapangan: PWA + Dexie (cadangan operasi)
```

| Layanan | Pakai | Tidak pakai |
| --- | --- | --- |
| Lovable + Cloudflare | SSR, serverFn, aset statis | Vercel, Netlify, Railway |
| Supabase Free | DB, Auth, RLS, Storage kecil | Pro, compute add-on, vector |
| GitHub | git, PR, auto-review | GitHub-hosted runner mahal |
| Perangkat | Chromium/Android install PWA | App Store berbayar |

**Kuota:** foto hama ≤200 KB; jangan simpan CCTV; jangan dump NIK. Jika DB mendekati batas Free: arsip laporan CSV di klien, hapus foto lama, andalkan Dexie. CCTV tetap placeholder prototipe.

**Env (nama, bukan nilai):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` di klien; `SUPABASE_SERVICE_ROLE`, `NIK_PGP_PASSPHRASE` hanya server.

---

# PWA Caching Strategy Blueprint

Deteksi luring (selaras Step 2): `navigator.onLine === false` **atau** ping health Supabase gagal dua kali. Service worker **bukan** satu-satunya sinyal.

## 1. Tiga lapisan cache (jangan dicampur)

| Lapisan | Isi | Strategi | TTL / kuota |
| --- | --- | --- | --- |
| A. Precache Workbox | App shell, JS/CSS hashed, Plus Jakarta Sans, ikon, `offline.html` | Precache + `CacheFirst` | Versi ikut hash build; purge SW lama |
| B. Runtime SW | Navigasi HTML, gambar hama | Navigasi: `NetworkFirst` (timeout ~3s) → shell; gambar: `CacheFirst` | Cache gambar max 30 entri / 6 MB |
| C. Dexie (sumber kebenaran luring) | Replica domain `warga_publik`, blok, panen, hewan, porsi, batch, pakan, sku, tagihan milik sendiri, snapshot dashboard | Tulis saat fetch sukses; baca saat Query gagal/luring | Evict foto dulu; **tanpa NIK** |

Supabase REST **tidak** di-cache buta oleh SW (risiko bocor NIK/admin). Replica hanya lewat klien yang memilih kolom `warga_publik`.

## 2. Precache (S0, dikunci S7)

- Manifest: `name: Tani Baik`, `display: standalone`, `theme_color` emerald prototipe, `start_url: /`, ikon 192/512.
- Daftarkan SW hanya di klien (`typeof window`). SSR Cloudflare tidak mengeksekusi SW.
- Navigasi luring ke rute yang belum pernah dibuka: halaman “Belum tersedia luring — buka sekali saat daring.” (Step 2).

## 3. Dexie stores

```text
tb_warga_publik, tb_blok, tb_panen, tb_hama, tb_hewan, tb_kepemilikan,
tb_batch, tb_pakan, tb_limbah, tb_sku, tb_tagihan_rawat_milik,
tb_dashboard_snapshot, tb_outbox, tb_meta
```

`tb_outbox`: `{ client_mutation_id, jenis, payload, created_at, status }`. Jenis diizinkan: `pending_panen`, `pending_hama`, `pending_kelahiran` (induk harus ada di `tb_hewan`), `pending_batch`, `pending_pakan`, `pending_limbah`, `pending_pos`, `pending_rawat_harian`.

Jenis **dilarang** di outbox: `closing`, `opname`, `penerimaan`, `impor_warga`, `ubah_tarif`, `ubah_porsi`.

## 4. Matriks strategi per permukaan

| Permukaan | SW | Dexie | Outbox |
| --- | --- | --- | --- |
| Shell / CSS / font | Precache | — | — |
| Dashboard | NetworkFirst HTML | Snapshot angka + grafik | Tidak |
| Kebun panen/hama | NetworkFirst | Replica + titik oranye pending | Ya |
| Kartu hewan / pohon | NetworkFirst | Salinan yang pernah diunduh | Kelahiran hanya jika induk ter-cache |
| Closing | Tidak di-SW-kan | Tidak menulis jurnal lokal | **Tidak** |
| POS jual | NetworkFirst SKU | Stok lokal optimistik | Ya + `client_mutation_id` |
| POS opname/terima | — | — | **Tidak** (wajib daring) |
| Impor / tarif | — | — | **Tidak** |
| Portal investor | NetworkFirst | Cache milik sendiri | Tidak |

## 5. Konflik replay (S6)

- Panen/hama: last-write-wins `updated_at`.
- POS stok: server menang; modal selisih (stok server &lt; terjual).
- Kelahiran: `induk_id` hilang di server → dead letter + UI pilih ulang.
- Closing tidak di-replay.

## 6. Privasi cache

- Logout: `dexie.delete()` + unclaim SW caches aplikasi (bukan seluruh origin asing).
- Dilarang `console.log` payload warga lengkap.
- Foto hama tidak berisi metadata NIK.

## 7. Versi dan rilis

`SW_REVISION` = hash Vite. Setelah deploy, `skipWaiting` + `clients.claim` di S7 setelah uji; selama S0–S6 cukup `skipWaiting` hati-hati agar kasir tidak kehilangan outbox — **jangan hapus `tb_outbox` saat aktivasi SW**.

---

# Product Backlog / Work Tickets

Kolom: Ticket ID | Epic | User Story | Acceptance Criteria | Priority.

Delegasi AI mengikuti doktrin Step 1: rumus/closing/silsilah/sync = sol atau Grok 4.6 + auto-review; CRUD = gpt-5.4; copy = luna; Gemini tidak menulis migrasi.

| Ticket ID | Epic | User Story | Acceptance Criteria | Priority |
| --- | --- | --- | --- | --- |
| TB-001 | S0 Fondasi PWA | Sebagai mandor, saya memasang Tani Baik di ponsel agar kasir/kandang tetap terbuka tanpa toko aplikasi. | Manifest standalone; ikon; SW precache shell; buka `/` luring setelah sekali daring; tidak merusak SSR Cloudflare. | P0 |
| TB-002 | S0 Identitas | Sebagai admin, saya masuk dengan peran agar kasir tidak melihat closing dan investor tidak melihat NIK. | Supabase Auth; `profil.peran`; header tidak hardcode “Saiful · Admin”; RLS menolak akses silang; logout membersihkan Dexie. | P0 |
| TB-003 | S0 Warga RT07 | Sebagai admin, saya mengimpor Excel/CSV RT07 menjadi master calon investor tanpa menayangkan NIK. | 731 jiwa terpetakan (nama, rumah, KK, status, dasawisma); NIK ke `nik_cipher` saja; UI/toast/CSV/console tanpa NIK; impor luring ditolak. | P0 |
| TB-004 | S0 Parameter | Sebagai admin, saya mengatur tarif rawat Rp 2.000/hari/ekor terpisah dari ongkos petik Rp 2.000/kg. | Dua kunci `parameter_sistem`; helper “rawat bukan HPP”; ubah tarif wajib daring; konstanta dummy diganti baca parameter. | P0 |
| TB-005 | S0 Replica | Sebagai mandor, saya punya salinan lokal agar panen tetap tercatat saat sinyal putus. | Dexie stores tanpa NIK; outbox skeleton; ping health + `navigator.onLine`; pita “Mode luring” sesuai Step 2. | P0 |
| TB-006 | S1 Kebun | Sebagai mandor, saya mengelola Blok 1–3 (manggis/jambu/sayur) per blok, bukan per kebun generik. | CRUD blok; rute `/kebun` dan `/kebun/$blokId`; dummy `blokKebun` diganti; siklus tanam tampil. | P0 |
| TB-007 | S1 Panen | Sebagai mandor, saya mencatat kg panen dan ongkos pemetik selalu kg × 2.000. | Form panen; pratinjau ongkos; simpan ditolak jika kg ≤ 0; luring menulis `pending_panen`; titik oranye di kartu blok. | P0 |
| TB-008 | S1 Hama | Sebagai mandor, saya menulis log hama per blok dengan foto kecil opsional. | Tanggal, gejala, tindakan; foto ≤200 KB; tanpa AI vision; luring diantrekan. | P1 |
| TB-009 | S1 Kiriman | Sebagai pengelola, saya memantau kg dikirim vs sisa per blok setelah panen. | Tab kiriman; grafik; **bukan** pecahan 50/50; tidak ada rumus konsinyasi di layar ini. | P1 |
| TB-010 | S2 Kartu ekor | Sebagai pengelola, saya melihat kambing/sapi per individu (bukan populasi massal). | `/ternak` terpisah dari `/batch`; status hidup/jual/mati/kontes; `/peternakan` jadi hub. | P0 |
| TB-011 | S2 Silsilah DB | Sebagai pengelola, setiap anak lahir kandang wajib punya induk; sistem menolak silsilah sirkular. | Kolom `induk_id`/`pejantan_id` self-ref; CHECK lahir_kandang; trigger CTE anti-siklus; form tanpa induk ditolak; tes unit siklus. | P0 |
| TB-012 | S2 Porsi N:M | Sebagai pengelola, satu ekor dimiliki satu atau lebih warga dengan jumlah porsi 1,0. | Tabel `hewan_kepemilikan`; simpan ditolak jika jumlah ≠ 100%; luring: ubah porsi diblokir. | P0 |
| TB-013 | S2 Pohon 3 gen | Sebagai juri/pengelola, saya melihat jalur maternal tiga generasi untuk valuasi kontes. | RPC/VIEW depth 3; UI W-05; pejantan dashed opsional; klik node ke kartu; cache luring hanya data yang pernah diunduh. | P0 |
| TB-014 | S3 Batch | Sebagai mandor, saya mencatat ayam/ikan per kelompok tanpa silsilah per ekor. | `/batch`; populasi; penyusutan tidak negatif; tidak ada `induk_id`. | P0 |
| TB-015 | S3 Stok pakan | Sebagai mandor, saya melihat stok pakan dan membeli restok. | Tabel stok + minimum; form beli mengubah stok; alert di bawah minimum. | P1 |
| TB-016 | S3 Alokasi HPP | Sebagai pengelola, saya menandai pakan dasar (masuk HPP) vs operasional (tidak masuk HPP). | Checkbox default off; helper rawat ≠ pakan; closing hanya menjumlahkan `masuk_hpp=true`; tes: operasional tidak mengubah Laba. | P0 |
| TB-017 | S4 Limbah masuk | Sebagai mandor, saya mencatat kg kotoran dari kandang/batch. | Input sumber + kg; bukan “gratis”. | P1 |
| TB-018 | S4 HPP pupuk | Sebagai pengelola, pupuk organik punya HPP sendiri dari biaya kumpul+fermentasi+kemasan. | Stepper 3 langkah; `hpp_unit` terhitung; terpisah dari HPP hewan. | P0 |
| TB-019 | S4 SKU pupuk | Sebagai kasir, SKU Pupuk Organik muncul di POS dengan HPP hasil fermentasi. | Stok gudang bertambah; penjualan memakai HPP ini; dummy “Pupuk Kandang 5kg” diganti atau ditautkan. | P0 |
| TB-020 | S5 Tagihan rawat | Sebagai pengelola, saya menagih Biaya Rawat bulanan ke investor tanpa mencampurnya ke HPP. | `jumlah = tarif × hari × ekor × porsi`; snapshot tarif; investor hanya lihat miliknya; subteks “bukan komponen HPP”; luring: harian boleh antre, closing tidak. | P0 |
| TB-021 | S5 Closing | Sebagai pengelola, saya menutup kontrak saat penjualan dengan pecahan 50/50/N yang benar. | serverFn daring; `Laba = Penjualan − HPP`; 2 pemilik setara → 25% masing-masing; rugi → hak 0; tombol luring disabled. | P0 |
| TB-022 | S5 Jurnal terpisah | Sebagai pengelola, piutang rawat tetap ada setelah closing. | `closing_jurnal` tanpa kolom rawat; `tagihan_rawat.lunas` tidak auto-true; laporan menampilkan kolom piutang terpisah. | P0 |
| TB-023 | S5 Fixture uji | Sebagai tech lead, closing satu kambing dua pemilik menghasilkan angka matriks kertas. | Fixture: jual 10jt, HPP 4jt → kelola 3jt, tiap investor 1,5jt; CI gagal jika rawat masuk HPP; auto-review wajib. | P0 |
| TB-024 | S6 POS gembok | Sebagai kasir, saya hanya membuka Transaksi (dan lihat Produk); Penerimaan dan Opname terkunci. | Kisi 2×2 prototipe; `Lock` + penegakan peran; toast gembok; bukan ikon kosmetik. | P0 |
| TB-025 | S6 POS luring | Sebagai kasir, saya menyelesaikan penjualan tunai tanpa jaringan. | Keranjang+bayar aktif; stok lokal −; outbox `client_mutation_id`; struk “lokal”; toast antrean bukan “gagal server”. | P0 |
| TB-026 | S6 Opname daring | Sebagai gudang, opname dan penerimaan hanya saat daring. | Admin pun melihat copy “memerlukan jaringan”; tidak masuk outbox. | P0 |
| TB-027 | S6 Konflik stok | Sebagai kasir, jika stok server lebih kecil dari yang terjual luring, saya memilih batalkan atau sesuaikan. | Modal selisih; server menang sebagai angka stok; tidak silent overwrite. | P0 |
| TB-028 | S7 Laporan | Sebagai pengelola, saya melihat laba kebun dan bagi hasil ternak di dua tab yang tidak dijumlahkan. | Tab A `ProfitKebun = Penjualan − BiayaPetani`; Tab B kontrak tertutup; banner jangan dijumlahkan; dummy margin operasional dihapus. | P0 |
| TB-029 | S7 Cache keras | Sebagai mandor, PWA tidak menghapus outbox saat rilis dan tidak menyimpan NIK. | Audit SW+Dexie; aktivasi SW preservasi `tb_outbox`; kuota gambar; uji buka luring. | P0 |
| TB-030 | S7 Privasi | Sebagai admin sistem, NIK tidak bocor ke log, replica, atau portal. | GRANT; view publik; inspeksi DOM portal tanpa label NIK; logout wipe. | P0 |
| TB-031 | S7 Free-tier | Sebagai tech lead, saya memastikan tumpukan tetap $0 pada beban MVP RT07 + kandang kecil. | Tanpa layanan CC; foto terbatas; rencana fallback Dexie jika storage penuh; CCTV tetap placeholder. | P1 |
| TB-032 | S7 Ekspor | Sebagai pengelola, saya mengunduh CSV laporan di klien tanpa PDF berbayar dan tanpa NIK. | CSV kebun dan bagi hasil; CSV investor tanpa NIK. | P1 |
| TB-033 | S7 Dashboard | Sebagai pengelola, kartu beranda tidak mencampur laba kebun dengan hak bagi hasil. | StatCard: panen kg, populasi, **piutang rawat**, **laba kontrak tertutup**; hapus “profit margin” dummy. | P0 |
| TB-034 | S0/S2 RPC | Sebagai pengembang, CTE silsilah dan anti-siklus diuji di Postgres, bukan hanya di UI. | Migrasi + tes SQL: rantai 3 gen; insert siklus gagal; pejantan opsional tidak wajib. | P0 |
| TB-035 | S5 SKU closing | Sebagai kasir, hewan yang closing muncul sebagai item POS dengan HPP hewan (tanpa rawat). | SKU otomatis setelah closing; HPP = bibit+pakan dasar; rawat tidak masuk harga pokok SKU. | P1 |
| TB-036 | Gerbang PR | Sebagai reviewer, setiap PR rumus/silsilah/sync lewat auto-review. | Checklist: rawat ≠ HPP; tidak ada NIK di log; tidak ada siklus; mini/luna tidak menyentuh `src/lib/finance`. | P0 |

**Urutan dependensi:** TB-002/005 sebelum modul lapangan; TB-011/016 sebelum TB-021; TB-021/019 sebelum TB-025 (SKU hidup); TB-028/033 mengunci penerimaan angka.

**Definisi selesai MVP:** TB-023 hijau di CI + pohon 3 generasi terlihat + kasir luring bayar + closing luring tidak bisa + NIK tidak di DOM portal.
