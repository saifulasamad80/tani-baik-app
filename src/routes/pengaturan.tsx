import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKoneksi } from "@/hooks/use-koneksi";
import { useParameterSistem } from "@/hooks/use-parameter-sistem";
import { BRAND_NAME } from "@/lib/brand";
import { KUNCI_PARAMETER, PARAMETER_BAKU } from "@/lib/parameters";
import { bolehAkses } from "@/lib/roles";
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
  const { data, refetch } = useParameterSistem();
  const params = data ?? PARAMETER_BAKU;
  const [tarif, setTarif] = useState(String(params.tarif_rawat_harian));
  const [ongkos, setOngkos] = useState(String(params.ongkos_pemetik_per_kg));
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    setTarif(String(params.tarif_rawat_harian));
    setOngkos(String(params.ongkos_pemetik_per_kg));
  }, [params.tarif_rawat_harian, params.ongkos_pemetik_per_kg]);

  const bolehUbah = bolehAkses(profil?.peran ?? null, ["admin", "pengelola"]);

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
    </div>
  );
}
