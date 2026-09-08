import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { BRAND_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKoneksi } from "@/hooks/use-koneksi";
import { getDb } from "@/lib/db/dexie";
import { bolehAkses } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { COPY } from "@/lib/ui-copy";
import { petaBarisWargaPublik, ringkasImpor, type BarisWargaImpor } from "@/lib/warga-import";
import { angka } from "@/lib/farm-data";

export const Route = createFileRoute("/warga")({
  head: () => ({
    meta: [{ title: `Warga & Investor — ${BRAND_NAME}` }],
  }),
  component: HalamanWarga,
});

async function bacaBerkasPublik(file: File): Promise<BarisWargaImpor[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const hasil: BarisWargaImpor[] = [];
  for (const row of rows) {
    const mapped = petaBarisWargaPublik(row);
    if (mapped) hasil.push(mapped);
  }
  return hasil;
}

function HalamanWarga() {
  const { profil, session, skemaHilang } = useAuth();
  const { daring } = useKoneksi();
  const [pratinjau, setPratinjau] = useState<BarisWargaImpor[]>([]);
  const [menerapkan, setMenerapkan] = useState(false);
  const admin = bolehAkses(profil?.peran ?? null, ["admin"]);
  const ringkas = useMemo(() => ringkasImpor(pratinjau), [pratinjau]);

  const pilihBerkas = async (file: File | undefined) => {
    if (!file) return;
    try {
      const baris = await bacaBerkasPublik(file);
      setPratinjau(baris);
      toast.success(`${angka(baris.length)} jiwa siap diimpor (tanpa NIK).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membaca berkas");
    }
  };

  const terapkan = async () => {
    if (!daring) {
      toast.error(COPY.imporLuring);
      return;
    }
    if (!admin) {
      toast.error("Hanya admin yang dapat menerapkan impor.");
      return;
    }
    setMenerapkan(true);
    try {
      const ukuran = 80;
      for (let i = 0; i < pratinjau.length; i += ukuran) {
        const chunk = pratinjau.slice(i, i + ukuran);
        const { error } = await supabase.from("warga").upsert(chunk, {
          onConflict: "nama,no_rumah,no_kk",
        });
        if (error) throw error;
      }
      const { data } = await supabase
        .from("warga_publik")
        .select("id, nama, no_rumah, no_kk, status_tetap, dasawisma");
      const db = getDb();
      if (db && data) {
        await db.tb_warga_publik.clear();
        await db.tb_warga_publik.bulkPut(
          data.map((row) => {
            const r = row as {
              id: string;
              nama: string;
              no_rumah: string;
              no_kk: string;
              status_tetap: boolean;
              dasawisma: string;
            };
            return r;
          }),
        );
      }
      toast.success(`Impor selesai: ${angka(ringkas.jiwa)} jiwa, ${angka(ringkas.kk)} KK.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menerapkan impor");
    } finally {
      setMenerapkan(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master investor"
        title="Warga RT07"
        description="Impor buku lama warga sebagai calon investor. NIK tidak ditampilkan dan tidak disimpan dari klien."
      />

      {skemaHilang ? (
        <p className="rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm">
          Jalankan migrasi SQL S0 di Supabase sebelum impor.
        </p>
      ) : null}

      {!session ? (
        <p className="text-sm text-muted-foreground">Masuk sebagai admin untuk mengimpor master warga.</p>
      ) : null}

      <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
        <LabelBerkas
          disabled={!admin || !daring}
          onFile={(f) => void pilihBerkas(f)}
        />
        {!daring ? <p className="text-xs text-warning-foreground">{COPY.imporLuring}</p> : null}
        {pratinjau.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <span>
              Jiwa <strong className="tabular-nums">{angka(ringkas.jiwa)}</strong>
            </span>
            <span>
              KK <strong className="tabular-nums">{angka(ringkas.kk)}</strong>
            </span>
            <span>
              Rumah <strong className="tabular-nums">{angka(ringkas.rumah)}</strong>
            </span>
            <span>
              Dasawisma <strong className="tabular-nums">{angka(ringkas.dasawisma)}</strong>
            </span>
          </div>
        ) : null}
        <Button
          type="button"
          disabled={!admin || !daring || pratinjau.length === 0 || menerapkan}
          onClick={() => void terapkan()}
        >
          {daring ? (menerapkan ? "Menerapkan…" : "Terapkan impor") : COPY.imporLuring}
        </Button>
      </section>

      {pratinjau.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. Rumah</TableHead>
                <TableHead>KK</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dasawisma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pratinjau.slice(0, 50).map((b, i) => (
                <TableRow key={`${b.nama}-${b.no_rumah}-${b.no_kk}-${i}`}>
                  <TableCell>{b.nama}</TableCell>
                  <TableCell className="tabular-nums">{b.no_rumah}</TableCell>
                  <TableCell className="tabular-nums">{b.no_kk}</TableCell>
                  <TableCell>{b.status_tetap ? "Tetap" : "Tidak tetap"}</TableCell>
                  <TableCell>{b.dasawisma}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pratinjau.length > 50 ? (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              Menampilkan 50 baris pertama dari {angka(pratinjau.length)}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LabelBerkas({
  disabled,
  onFile,
}: {
  disabled: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor="berkas-warga">
        Berkas CSV / XLSX
      </label>
      <Input
        id="berkas-warga"
        type="file"
        accept=".csv,.xlsx,.xls"
        disabled={disabled}
        onChange={(ev) => onFile(ev.target.files?.[0])}
      />
      <p className="text-xs text-muted-foreground">
        Kolom yang dibaca: Nama, No. Rumah, No. KK, Status Warga, Dasawisma. Kolom NIK diabaikan.
      </p>
    </div>
  );
}
