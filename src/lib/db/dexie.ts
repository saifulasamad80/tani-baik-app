import Dexie, { type EntityTable } from "dexie";

export type OutboxJenis =
  | "pending_panen"
  | "pending_hama"
  | "pending_kelahiran"
  | "pending_batch"
  | "pending_pakan"
  | "pending_limbah"
  | "pending_pos"
  | "pending_rawat_harian";

export const OUTBOX_DILARANG = [
  "closing",
  "opname",
  "penerimaan",
  "impor_warga",
  "ubah_tarif",
  "ubah_porsi",
] as const;

export type WargaPublikCache = {
  id: string;
  nama: string;
  no_rumah: string;
  no_kk: string;
  status_tetap: boolean;
  dasawisma: string;
};

export type OutboxItem = {
  client_mutation_id: string;
  jenis: OutboxJenis;
  payload: unknown;
  created_at: string;
  status: "pending" | "error";
};

export type MetaItem = {
  kunci: string;
  nilai: string;
};

export type ParameterCache = {
  kunci: string;
  nilai_numerik: number;
};

const DB_NAME = "tani-baik";

export class TaniBaikDB extends Dexie {
  tb_warga_publik!: EntityTable<WargaPublikCache, "id">;
  tb_blok!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_panen!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_hama!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_hewan!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_kepemilikan!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_batch!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_pakan!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_limbah!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_sku!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_tagihan_rawat_milik!: EntityTable<{ id: string; payload: unknown }, "id">;
  tb_dashboard_snapshot!: EntityTable<{ id: string; payload: unknown; diambil_at: string }, "id">;
  tb_outbox!: EntityTable<OutboxItem, "client_mutation_id">;
  tb_meta!: EntityTable<MetaItem, "kunci">;
  tb_parameter!: EntityTable<ParameterCache, "kunci">;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      tb_warga_publik: "id, no_kk, no_rumah, nama",
      tb_blok: "id",
      tb_panen: "id",
      tb_hama: "id",
      tb_hewan: "id",
      tb_kepemilikan: "id",
      tb_batch: "id",
      tb_pakan: "id",
      tb_limbah: "id",
      tb_sku: "id",
      tb_tagihan_rawat_milik: "id",
      tb_dashboard_snapshot: "id",
      tb_outbox: "client_mutation_id, jenis, status, created_at",
      tb_meta: "kunci",
      tb_parameter: "kunci",
    });
  }
}

let instance: TaniBaikDB | null = null;

export function getDb(): TaniBaikDB | null {
  if (typeof indexedDB === "undefined") return null;
  if (!instance) instance = new TaniBaikDB();
  return instance;
}

export async function hitungAntrean(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.tb_outbox.where("status").equals("pending").count();
}

export async function hapusReplicaLokal(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete();
  instance = new TaniBaikDB();
}
