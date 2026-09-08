import { useQuery } from "@tanstack/react-query";

import { getDb } from "@/lib/db/dexie";
import { KUNCI_PARAMETER, PARAMETER_BAKU, type ParameterSistem } from "@/lib/parameters";
import { supabase } from "@/lib/supabase";

async function dariCache(): Promise<ParameterSistem> {
  const db = getDb();
  if (!db) return { ...PARAMETER_BAKU };
  const rows = await db.tb_parameter.toArray();
  const map = Object.fromEntries(rows.map((r) => [r.kunci, r.nilai_numerik]));
  return {
    tarif_rawat_harian: Number(map[KUNCI_PARAMETER.tarifRawatHarian] ?? PARAMETER_BAKU.tarif_rawat_harian),
    ongkos_pemetik_per_kg: Number(
      map[KUNCI_PARAMETER.ongkosPemetikPerKg] ?? PARAMETER_BAKU.ongkos_pemetik_per_kg,
    ),
  };
}

async function muatParameter(): Promise<ParameterSistem> {
  const { data, error } = await supabase.from("parameter_sistem").select("kunci, nilai_numerik");
  if (error || !data) {
    return dariCache();
  }
  const map = Object.fromEntries(
    data.map((row) => {
      const r = row as { kunci: string; nilai_numerik: number | string };
      return [r.kunci, Number(r.nilai_numerik)];
    }),
  );
  const hasil: ParameterSistem = {
    tarif_rawat_harian: Number(map[KUNCI_PARAMETER.tarifRawatHarian] ?? PARAMETER_BAKU.tarif_rawat_harian),
    ongkos_pemetik_per_kg: Number(
      map[KUNCI_PARAMETER.ongkosPemetikPerKg] ?? PARAMETER_BAKU.ongkos_pemetik_per_kg,
    ),
  };
  const db = getDb();
  if (db) {
    await db.tb_parameter.bulkPut([
      { kunci: KUNCI_PARAMETER.tarifRawatHarian, nilai_numerik: hasil.tarif_rawat_harian },
      { kunci: KUNCI_PARAMETER.ongkosPemetikPerKg, nilai_numerik: hasil.ongkos_pemetik_per_kg },
    ]);
  }
  return hasil;
}

export function useParameterSistem() {
  return useQuery({
    queryKey: ["parameter_sistem"],
    queryFn: muatParameter,
    placeholderData: { ...PARAMETER_BAKU },
    staleTime: 60_000,
  });
}
