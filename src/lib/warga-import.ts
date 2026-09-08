const NIK_HEADER = /nik/i;

const HEADER_NAMA = ["nama"];
const HEADER_RUMAH = ["no rmh", "no. rumah", "no rumah", "no_rumah", "rumah"];
const HEADER_KK = ["no kk", "no. kk", "kk", "no_kk"];
const HEADER_STATUS = ["status warga", "status tetap", "status_tetap"];
const HEADER_DASA = ["dasa wisma", "dasawisma", "dasa_wisma"];

export type BarisWargaImpor = {
  nama: string;
  no_rumah: string;
  no_kk: string;
  status_tetap: boolean;
  dasawisma: string;
};

function normHeader(h: string): string {
  return h.replace(/\s+/g, " ").trim().toLowerCase();
}

function nilaiTeks(row: Record<string, unknown>, aliases: string[]): string {
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const key = normHeader(rawKey);
    if (NIK_HEADER.test(key)) continue;
    if (aliases.includes(key)) {
      return String(rawVal ?? "").trim();
    }
  }
  return "";
}

function statusTetapDariTeks(teks: string): boolean {
  const s = teks.toLowerCase();
  if (!s) return true;
  if (/tidak|sementara|pendatang|non/.test(s)) return false;
  return true;
}

/** Hanya kolom publik. Kolom NIK sengaja tidak pernah dipetakan. */
export function petaBarisWargaPublik(row: Record<string, unknown>): BarisWargaImpor | null {
  const nama = nilaiTeks(row, HEADER_NAMA);
  if (!nama) return null;
  return {
    nama,
    no_rumah: nilaiTeks(row, HEADER_RUMAH),
    no_kk: nilaiTeks(row, HEADER_KK),
    status_tetap: statusTetapDariTeks(nilaiTeks(row, HEADER_STATUS)),
    dasawisma: nilaiTeks(row, HEADER_DASA),
  };
}

export function ringkasImpor(baris: BarisWargaImpor[]): {
  jiwa: number;
  kk: number;
  rumah: number;
  dasawisma: number;
} {
  const kk = new Set(baris.map((b) => b.no_kk).filter(Boolean));
  const rumah = new Set(baris.map((b) => b.no_rumah).filter(Boolean));
  const dasa = new Set(baris.map((b) => b.dasawisma).filter(Boolean));
  return { jiwa: baris.length, kk: kk.size, rumah: rumah.size, dasawisma: dasa.size };
}
