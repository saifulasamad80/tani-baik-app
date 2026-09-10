import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Beef, Egg, Fish, PackagePlus, QrCode, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { angka, rupiah, stokPakan, stokTernak } from "@/lib/farm-data";
import { PARAMETER_BAKU } from "@/lib/parameters";
import { useParameterSistem } from "@/hooks/use-parameter-sistem";

export const Route = createFileRoute("/peternakan")({
  head: () => ({
    meta: [
      { title: `Manajemen Peternakan — ${BRAND_NAME}` },
      {
        name: "description",
        content:
          "Monitor populasi ternak, skema permodalan, bank pakan, dan status kesehatan kandang.",
      },
      { property: "og:title", content: `Manajemen Peternakan — ${BRAND_NAME}` },
      {
        property: "og:description",
        content: `Stok hewan ternak dan modul manajemen pembelian pakan ${BRAND_NAME}.`,
      },
    ],
  }),
  component: PeternakanPage,
});

function PeternakanPage() {
  const { data: params } = useParameterSistem();
  const tarifRawat = params?.tarif_rawat_harian ?? PARAMETER_BAKU.tarif_rawat_harian;
  const [pakan, setPakan] = useState(stokPakan[0]!.nama);
  const [jumlah, setJumlah] = useState("");
  const [supplier, setSupplier] = useState("CV Sumber Ternak");
  const [catatan, setCatatan] = useState("");
  const [skema, setSkema] = useState("A");
  const [modal, setModal] = useState("10000000");
  const [hargaJual, setHargaJual] = useState("15000000");
  const [anakLahir, setAnakLahir] = useState("4");
  const [modalAwal, setModalAwal] = useState("10000000");
  const [transportasi, setTransportasi] = useState("500000");
  const [hariRawat, setHariRawat] = useState("30");
  const [ekorInvestor, setEkorInvestor] = useState("1");
  const [porsiOperasional, setPorsiOperasional] = useState("50");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const item = stokPakan.find((p) => p.nama === pakan)!;
  const qty = Number(jumlah) || 0;
  const total = qty * item.harga;
  const ekorKambing = 30;
  const biayaRawat = (Number(ekorInvestor) || 0) * tarifRawat * (Number(hariRawat) || 0);
  const estimasiRawatPopulasi = ekorKambing * tarifRawat * 30;
  const penjualan = Number(hargaJual) || 0;
  const kelahiran = Number(anakLahir) || 0;
  const porsiPengelolaPeternak = Math.min(100, Math.max(0, Number(porsiOperasional) || 0));
  const sisaKurban = Math.max(
    0,
    penjualan - (Number(modalAwal) || 0) - (Number(transportasi) || 0),
  );
  const hasilSkema = useMemo(() => {
    if (skema === "A") {
      return {
        utama: penjualan / 2,
        labelUtama: "Pengelola",
        kedua: penjualan / 2,
        labelKedua: "Peternak",
        catatan: `Kelahiran ${angka(kelahiran)} anak juga dibagi 50:50.`,
      };
    }
    if (skema === "B") {
      return {
        utama: penjualan * ((100 - porsiPengelolaPeternak) / 100),
        labelUtama: "Hak saudara dari sisa penjualan",
        kedua: 3,
        labelKedua: "Kompensasi saudara (ekor/tahun)",
        catatan: `Porsi gabungan pengelola dan peternak ${porsiPengelolaPeternak}%. Saudara tidak mendapat porsi dari kelahiran anak.`,
      };
    }
    return {
      utama: sisaKurban / 3,
      labelUtama: "Investor",
      kedua: sisaKurban / 3,
      labelKedua: "Pengelola",
      catatan: `Peternak memperoleh ${rupiah(sisaKurban / 3)} dan setiap pihak mendapat 1/3 porsi dari ${angka(kelahiran)} anak. Biaya pakan/rawat ${rupiah(biayaRawat)} dicatat terpisah dari laba.`,
    };
  }, [biayaRawat, kelahiran, penjualan, porsiPengelolaPeternak, sisaKurban, skema]);

  const tracking = [
    {
      kode: "KBG-001",
      nama: "Bima",
      lokasi: "Kandang Utama",
      kondisi: "Segar / Aktif",
      qr: "QR-KBG-001",
      bobot: 42,
    },
    {
      kode: "KBG-002",
      nama: "Sari",
      lokasi: "Kandang Utama",
      kondisi: "Segar / Aktif",
      qr: "QR-KBG-002",
      bobot: 38,
    },
    {
      kode: "KBG-003",
      nama: "Laras",
      lokasi: "Karantina",
      kondisi: "Sakit / Karantina",
      qr: "QR-KBG-003",
      bobot: 31,
    },
    {
      kode: "KBG-004",
      nama: "Jalu",
      lokasi: "Kandang Pembesaran",
      kondisi: "Segar / Aktif",
      qr: "QR-KBG-004",
      bobot: 29,
    },
  ];
  const trackingTampil =
    statusFilter === "Semua"
      ? tracking
      : tracking.filter((ternak) => ternak.kondisi.includes(statusFilter));

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
  const totalKambing = stokTernak
    .filter((t) => t.jenis === "Kambing" || t.jenis === "Domba/Gibas")
    .reduce((a, b) => a + b.populasi, 0);
  const totalAyam = stokTernak
    .filter((t) => t.jenis.startsWith("Ayam"))
    .reduce((a, b) => a + b.populasi, 0);
  const totalIkan = stokTernak
    .filter((t) => t.jenis.startsWith("Ikan"))
    .reduce((a, b) => a + b.populasi, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unit Peternakan & Perikanan"
        title="Manajemen Peternakan"
        description="Monitoring populasi, modal bagi hasil, bank pakan, dan kesehatan ternak"
        actions={<Badge variant="secondary">{angka(ekorKambing)} ekor kambing aktif</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kambing"
          value={`${angka(totalKambing)} Ekor`}
          sub="Workbook persediaan"
          icon={<Beef className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Ayam"
          value={`${angka(totalAyam)} Ekor`}
          sub="Petelur + pedaging"
          icon={<Egg className="size-4" />}
          tone="primary"
        />
        <StatCard
          label="Ikan"
          value={`${angka(totalIkan)} Ekor`}
          sub="Mujair, gurame, lele"
          icon={<Fish className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Kebutuhan Pakan Harian"
          value={`${angka(totalPakanHarian)} Kg`}
          sub="Seluruh unit ternak & kolam"
          icon={<PackagePlus className="size-4" />}
        />
      </div>

      <Tabs defaultValue="skema" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="skema">Skema & Bagi Hasil</TabsTrigger>
          <TabsTrigger value="pakan">Bank Pakan</TabsTrigger>
          <TabsTrigger value="tracking">Tracking Ternak</TabsTrigger>
        </TabsList>

        <TabsContent value="skema" className="space-y-4">
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Skema Permodalan Integrated Farm</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Simulasi pembagian hasil untuk penjualan dan kelahiran anak ternak.
                </p>
              </div>
              <Badge variant="outline">Biaya rawat: {rupiah(tarifRawat)} / ekor / hari</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { kode: "A", judul: "Modal sendiri", ringkas: "Pengelola + peternak 50:50" },
                { kode: "B", judul: "Modal saudara", ringkas: "3 ekor/tahun selama 3 tahun" },
                { kode: "C", judul: "Investor luar", ringkas: "3 pihak setelah modal & transport" },
              ].map(({ kode, judul, ringkas }) => (
                <button
                  key={kode}
                  type="button"
                  onClick={() => setSkema(kode)}
                  className={`rounded-xl border p-3 text-left transition-colors ${skema === kode ? "border-primary bg-accent/50" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">Skema {kode}</span>
                    <Badge variant={skema === kode ? "default" : "outline"}>
                      {skema === kode ? "Dipilih" : "Pilih"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{judul}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ringkas}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-1.5">
                <Label htmlFor="modal">Modal permodalan</Label>
                <Input
                  id="modal"
                  type="number"
                  value={modal}
                  onChange={(e) => setModal(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="harga-jual">Harga jual</Label>
                <Input
                  id="harga-jual"
                  type="number"
                  value={hargaJual}
                  onChange={(e) => setHargaJual(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anak-lahir">Anak lahir (ekor)</Label>
                <Input
                  id="anak-lahir"
                  type="number"
                  value={anakLahir}
                  onChange={(e) => setAnakLahir(e.target.value)}
                />
              </div>
              {skema === "B" && (
                <div className="space-y-1.5">
                  <Label htmlFor="porsi-operasional">Porsi pengelola + peternak (%)</Label>
                  <Input
                    id="porsi-operasional"
                    type="number"
                    min={0}
                    max={100}
                    value={porsiOperasional}
                    onChange={(e) => setPorsiOperasional(e.target.value)}
                  />
                </div>
              )}
              {skema === "C" && (
                <div className="space-y-1.5">
                  <Label htmlFor="hari-rawat">Lama rawat (hari)</Label>
                  <Input
                    id="hari-rawat"
                    type="number"
                    value={hariRawat}
                    onChange={(e) => setHariRawat(e.target.value)}
                  />
                </div>
              )}
              {skema === "C" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ekor-investor">Ternak investor (ekor)</Label>
                  <Input
                    id="ekor-investor"
                    type="number"
                    value={ekorInvestor}
                    onChange={(e) => setEkorInvestor(e.target.value)}
                  />
                </div>
              )}
              {skema === "C" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-awal">Modal beli awal</Label>
                    <Input
                      id="modal-awal"
                      type="number"
                      value={modalAwal}
                      onChange={(e) => setModalAwal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="transportasi">Transportasi kurban</Label>
                    <Input
                      id="transportasi"
                      type="number"
                      value={transportasi}
                      onChange={(e) => setTransportasi(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            {skema === "A" && (
              <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed">
                <span className="font-semibold">Kompensasi pekerja kandang:</span> gaji bulanan
                tetap {rupiah(2500000)} untuk dua orang, ditambah insentif beras, minyak, gula, dan
                pulsa. Kompensasi ini dicatat sebagai biaya operasional, terpisah dari pembagian
                penjualan dan kelahiran 50:50.
              </div>
            )}
            {skema === "B" && (
              <div className="mt-3 rounded-lg border border-info/30 bg-info/10 p-3 text-xs leading-relaxed">
                <span className="font-semibold">Kontrak saudara:</span> modal{" "}
                {rupiah(Number(modal) || 0)} dengan kompensasi 3 ekor per tahun selama 3 tahun
                (total 9 ekor).
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-dashed bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">{hasilSkema.labelUtama}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{rupiah(hasilSkema.utama)}</p>
              </div>
              <div className="rounded-lg border border-dashed bg-accent/40 p-3">
                <p className="text-xs text-muted-foreground">{hasilSkema.labelKedua}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {skema === "B" ? `${angka(hasilSkema.kedua)} ekor` : rupiah(hasilSkema.kedua)}
                </p>
              </div>
              <div className="rounded-lg border border-dashed bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Aturan aktif</p>
                <p className="mt-1 text-xs leading-relaxed">{hasilSkema.catatan}</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Simulasi Skema B menganggap modal saudara sebagai porsi pengembalian sebelum sisa
              penjualan dibukukan. Skema C memakai porsi sama rata karena persentase khusus belum
              ditentukan; keduanya dapat disesuaikan dalam kontrak.
            </p>
          </section>
        </TabsContent>

        <TabsContent value="pakan" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Bank Pakan Ternak</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Persediaan pakan untuk mengurangi biaya rumput dan beban pencarian harian.
                  </p>
                </div>
                <Badge variant="secondary">Kapasitas saat ini ± {angka(ekorKambing)} ekor</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Kebutuhan harian</p>
                  <p className="mt-1 text-lg font-bold">{angka(totalPakanHarian)} Kg</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Estimasi rawat populasi / 30 hari</p>
                  <p className="mt-1 text-lg font-bold">{rupiah(estimasiRawatPopulasi)}</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Status bank pakan</p>
                  <p className="mt-1 text-lg font-bold text-primary">Berjalan</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {stokPakan.map((p, index) => {
                  const pct = Math.min(100, Math.round((p.stok / (p.minimum * 3)) * 100));
                  const kritis = p.stok < p.minimum;
                  return (
                    <div key={`${p.nama}-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{p.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.supplier} · {rupiah(p.harga)}/{p.satuan}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-semibold tabular-nums ${kritis ? "text-destructive" : ""}`}
                        >
                          {angka(p.stok)} {p.satuan}
                        </span>
                      </div>
                      <Progress value={pct} className="mt-2" />
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        {kritis && <TriangleAlert className="size-3 text-destructive" />} Minimum{" "}
                        {angka(p.minimum)} {p.satuan}
                        {kritis && " · segera lakukan pembelian"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Pengadaan & Pencatatan</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Catat pembelian untuk menambah stok bank pakan.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Jenis Pakan</Label>
                  <Select value={pakan} onValueChange={setPakan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stokPakan.map((p, index) => (
                        <SelectItem key={`${p.nama}-${index}`} value={p.nama}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Select value={supplier} onValueChange={setSupplier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "CV Sumber Ternak",
                        "PT Charoen",
                        "Toko Mina Jaya",
                        "Kelompok Tani Rukun",
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qty">Jumlah ({item.satuan})</Label>
                  <Input
                    id="qty"
                    inputMode="numeric"
                    placeholder="0"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat">Catatan</Label>
                  <Textarea
                    id="cat"
                    rows={3}
                    placeholder="Contoh: simpan di gudang belakang"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </div>
                <div className="rounded-lg border border-dashed bg-accent/40 p-3 text-sm">
                  <div className="flex justify-between">
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
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <section className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Tracking Kesehatan & Logistik</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Barcode / QR menjadi identitas satu ekor untuk bobot, lokasi, dan riwayat
                  kesehatan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua kondisi</SelectItem>
                    <SelectItem value="Segar">Segar / aktif</SelectItem>
                    <SelectItem value="Sakit">Sakit / karantina</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">
                  <ShieldCheck className="mr-1 size-3" />{" "}
                  {tracking.filter((t) => t.kondisi.startsWith("Segar")).length} sehat
                </Badge>
                <Button asChild size="sm">
                  <Link to="/livestock">
                    <QrCode className="size-4" /> Buka Master Ternak
                  </Link>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">QR / Kode</th>
                    <th className="px-4 py-2 text-left font-medium">Nama</th>
                    <th className="px-4 py-2 text-left font-medium">Lokasi</th>
                    <th className="px-4 py-2 text-right font-medium">Bobot</th>
                    <th className="px-4 py-2 text-left font-medium">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingTampil.map((ternak) => (
                    <tr key={ternak.kode} className="border-t hover:bg-muted/40">
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-2 font-mono text-xs">
                          <QrCode className="size-4 text-primary" />
                          {ternak.qr}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {ternak.kode} · {ternak.nama}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{ternak.lokasi}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{ternak.bobot} Kg</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={ternak.kondisi.startsWith("Segar") ? "default" : "destructive"}
                        >
                          {ternak.kondisi}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
      </Tabs>

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
                  <td className="px-4 py-2 text-right tabular-nums">
                    {angka(t.populasi)} {t.satuan}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{t.bobot}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{angka(t.pakanHarianKg)} Kg</td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        t.status === "Sehat"
                          ? "default"
                          : t.status === "Siap Jual"
                            ? "secondary"
                            : "destructive"
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
    </div>
  );
}
