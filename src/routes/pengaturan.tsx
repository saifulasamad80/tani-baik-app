import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKoneksi } from "@/hooks/use-koneksi";
import { buatAkunPengguna, daftarAkunPengguna } from "@/lib/admin-users.functions";
import { useParameterSistem } from "@/hooks/use-parameter-sistem";
import { BRAND_NAME } from "@/lib/brand";
import { KUNCI_PARAMETER, PARAMETER_BAKU } from "@/lib/parameters";
import { LABEL_PERAN, PERAN, bolehAkses, type Peran } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { COPY } from "@/lib/ui-copy";
import { rupiah } from "@/lib/farm-data";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({
    meta: [{ title: `Pengaturan — ${BRAND_NAME}` }],
  }),
  component: HalamanPengaturan,
});

function HalamanPengaturan() {
  const { profil, session, skemaHilang } = useAuth();
  const { daring } = useKoneksi();
  const queryClient = useQueryClient();
  const { data, refetch } = useParameterSistem();
  const params = data ?? PARAMETER_BAKU;
  const [tarif, setTarif] = useState(String(params.tarif_rawat_harian));
  const [ongkos, setOngkos] = useState(String(params.ongkos_pemetik_per_kg));
  const [menyimpan, setMenyimpan] = useState(false);
  const [akunEmail, setAkunEmail] = useState("");
  const [akunPassword, setAkunPassword] = useState("");
  const [akunNama, setAkunNama] = useState("");
  const [akunPeran, setAkunPeran] = useState<Peran>("pengelola");
  const [membuatAkun, setMembuatAkun] = useState(false);
  const admin = bolehAkses(profil?.peran ?? null, ["admin"]);
  const bolehUbah = bolehAkses(profil?.peran ?? null, ["admin", "pengelola"]);
  const jalankanBuatAkun = useServerFn(buatAkunPengguna);
  const jalankanDaftarAkun = useServerFn(daftarAkunPengguna);
  const akunQuery = useQuery({
    queryKey: ["akun-pengguna", session?.user.id ?? "anon"],
    queryFn: async () => {
      if (!session?.access_token) return [];
      const { users } = await jalankanDaftarAkun({
        data: { accessToken: session.access_token },
      });
      return users;
    },
    enabled: Boolean(admin && session?.access_token),
    staleTime: 30_000,
  });

  useEffect(() => {
    setTarif(String(params.tarif_rawat_harian));
    setOngkos(String(params.ongkos_pemetik_per_kg));
  }, [params.tarif_rawat_harian, params.ongkos_pemetik_per_kg]);

  const simpan = async () => {
    if (!daring) {
      toast.error(COPY.ubahTarifLuring);
      return;
    }
    const tarifNum = Number(tarif);
    const ongkosNum = Number(ongkos);
    if (!Number.isFinite(tarifNum) || tarifNum < 0 || !Number.isFinite(ongkosNum) || ongkosNum < 0) {
      toast.error("Nilai tarif harus angka ≥ 0.");
      return;
    }
    setMenyimpan(true);
    try {
      const { error } = await supabase.from("parameter_sistem").upsert(
        [
          { kunci: KUNCI_PARAMETER.tarifRawatHarian, nilai_numerik: tarifNum },
          { kunci: KUNCI_PARAMETER.ongkosPemetikPerKg, nilai_numerik: ongkosNum },
        ],
        { onConflict: "kunci" },
      );
      if (error) throw error;
      await refetch();
      toast.success(
        `Tarif rawat ${rupiah(tarifNum)}/hari/ekor (bukan HPP). Ongkos petik ${rupiah(ongkosNum)}/kg.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan parameter");
    } finally {
      setMenyimpan(false);
    }
  };

  const tambahAkun = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!admin) {
      toast.error("Hanya admin yang dapat menambah akun pengguna.");
      return;
    }
    if (!session?.access_token) {
      toast.error("Sesi belum siap. Coba muat ulang halaman.");
      return;
    }
    if (!daring) {
      toast.error("Tambah akun memerlukan jaringan.");
      return;
    }

    setMembuatAkun(true);
    try {
      await jalankanBuatAkun({
        data: {
          accessToken: session.access_token,
          email: akunEmail,
          password: akunPassword,
          namaTampilan: akunNama,
          peran: akunPeran,
        },
      });
      toast.success(`Akun ${akunNama} berhasil dibuat.`);
      setAkunEmail("");
      setAkunPassword("");
      setAkunNama("");
      setAkunPeran("pengelola");
      await queryClient.invalidateQueries({ queryKey: ["akun-pengguna"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun");
    } finally {
      setMembuatAkun(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengaturan"
        description="Tarif Biaya Rawat terpisah dari ongkos pemetik kebun."
      />

      {skemaHilang ? (
        <p className="rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm">
          Tabel belum ada. Jalankan berkas{" "}
          <code className="text-xs">supabase/migrations/20260904120000_s0_fondasi.sql</code> di SQL
          Editor Supabase.
        </p>
      ) : null}

      {!session ? (
        <p className="text-sm text-muted-foreground">Masuk sebagai admin atau pengelola untuk mengubah tarif.</p>
      ) : null}

      <section className="max-w-lg space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-1.5">
          <Label htmlFor="tarif">Tarif Biaya Rawat (Rp / hari / ekor)</Label>
          <Input
            id="tarif"
            type="number"
            min={0}
            className="tabular-nums"
            value={tarif}
            disabled={!bolehUbah || !daring}
            onChange={(ev) => setTarif(ev.target.value)}
          />
          <p className="text-xs text-muted-foreground">{COPY.rawatBukanHpp}</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ongkos">Ongkos pemetik kebun (Rp / kg)</Label>
          <Input
            id="ongkos"
            type="number"
            min={0}
            className="tabular-nums"
            value={ongkos}
            disabled={!bolehUbah || !daring}
            onChange={(ev) => setOngkos(ev.target.value)}
          />
          <p className="text-xs text-muted-foreground">{COPY.petikTerpisah}</p>
        </div>
        <Button type="button" disabled={!bolehUbah || !daring || menyimpan} onClick={() => void simpan()}>
          {daring ? (menyimpan ? "Menyimpan…" : "Simpan parameter") : COPY.ubahTarifLuring}
        </Button>
      </section>

      {admin ? (
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Akun Pengguna</h2>
              <p className="text-xs text-muted-foreground">
                Buat akun login email/password untuk staf internal.
              </p>
            </div>
            <Badge variant={akunQuery.isFetching ? "outline" : "secondary"}>
              {akunQuery.isFetching ? "Memuat akun" : `${(akunQuery.data ?? []).length} akun`}
            </Badge>
          </div>

          <form className="grid gap-3 md:grid-cols-2" onSubmit={(ev) => void tambahAkun(ev)}>
            <div className="grid gap-1.5">
              <Label htmlFor="akun-nama">Nama tampilan</Label>
              <Input
                id="akun-nama"
                value={akunNama}
                onChange={(ev) => setAkunNama(ev.target.value)}
                placeholder="Saiful Admin"
                autoComplete="name"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="akun-email">Email</Label>
              <Input
                id="akun-email"
                type="email"
                value={akunEmail}
                onChange={(ev) => setAkunEmail(ev.target.value)}
                placeholder="admin@farmahub.id"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="akun-password">Kata sandi</Label>
              <Input
                id="akun-password"
                type="password"
                value={akunPassword}
                onChange={(ev) => setAkunPassword(ev.target.value)}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="akun-peran">Peran</Label>
              <Select value={akunPeran} onValueChange={(value) => setAkunPeran(value as Peran)}>
                <SelectTrigger id="akun-peran">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {PERAN.map((peran) => (
                    <SelectItem key={peran} value={peran}>
                      {LABEL_PERAN[peran]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">
                Akun dibuat di Supabase Auth lalu profilnya dicatat ke tabel profil.
              </p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={membuatAkun || !daring}>
                {membuatAkun ? "Membuat akun…" : "Tambah akun"}
              </Button>
            </div>
          </form>

          {akunQuery.isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Gagal memuat daftar akun.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(akunQuery.data ?? []).map((akun) => (
                  <TableRow key={akun.id}>
                    <TableCell className="font-medium">{akun.nama_tampilan}</TableCell>
                    <TableCell className="text-muted-foreground">{akun.email ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={akun.peran === "admin" ? "default" : "secondary"}>
                        {LABEL_PERAN[akun.peran]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(akun.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
                {(akunQuery.data ?? []).length === 0 && !akunQuery.isFetching ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada akun pengguna.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Akun Pengguna</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Menu ini hanya tersedia untuk admin.
          </p>
        </section>
      )}
    </div>
  );
}
