export const PERAN = [
  "admin",
  "pengelola",
  "mandor",
  "kasir",
  "gudang",
  "investor",
] as const;

export type Peran = (typeof PERAN)[number];

export type Profil = {
  id: string;
  peran: Peran;
  nama_tampilan: string;
  warga_id: string | null;
};

export const LABEL_PERAN: Record<Peran, string> = {
  admin: "Admin",
  pengelola: "Pengelola",
  mandor: "Mandor",
  kasir: "Kasir",
  gudang: "Gudang",
  investor: "Investor",
};

export function isPeran(value: string): value is Peran {
  return (PERAN as readonly string[]).includes(value);
}

export function inisialNama(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "T";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

export function bolehAkses(peran: Peran | null, izinkan: readonly Peran[]): boolean {
  if (!peran) return false;
  return izinkan.includes(peran);
}
