export const KUNCI_PARAMETER = {
  tarifRawatHarian: "tarif_rawat_harian",
  ongkosPemetikPerKg: "ongkos_pemetik_per_kg",
} as const;

export const PARAMETER_BAKU = {
  tarif_rawat_harian: 2000,
  ongkos_pemetik_per_kg: 2000,
} as const;

export type ParameterSistem = {
  tarif_rawat_harian: number;
  ongkos_pemetik_per_kg: number;
};
