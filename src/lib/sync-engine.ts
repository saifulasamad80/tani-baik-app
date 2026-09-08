import { ensureSessionSnapshot, getSessionSnapshot } from "@/lib/auth-session";
import { getDb, type OutboxItem, type OutboxJenis } from "@/lib/db/dexie";
import { supabase } from "@/lib/supabase";

type OutboxPayload = Record<string, unknown> & {
  catatan?: string;
  description?: string;
  lokasi?: string;
  jumlah?: number | string;
  quantity?: number;
  unit?: string;
  value?: number;
  total?: number;
  harga?: number;
  unit_cost?: number;
  livestock_id?: string;
  hewan_id?: string;
  mother_id?: string;
  father_id?: string;
  tag_code?: string;
  species?: string;
  breed?: string;
  sex?: string;
  status?: string;
  birth_date?: string;
  acquired_on?: string;
  current_weight_kg?: number;
  contest_value?: number;
  investor_id?: string;
  reference_code?: string;
  output_inventory_name?: string;
  output_form?: "solid" | "liquid";
  output_unit?: "Kg" | "Drum";
  source_material?: string;
  source_quantity?: number;
  output_quantity?: number;
  ledger_type?: "hpp" | "maintenance" | "purchase" | "sale" | "adjustment";
  rpc?: string;
  rpc_args?: Record<string, unknown>;
};

type SyncOutboxItem = OutboxItem & {
  retry_count?: number;
  last_error?: string | null;
  last_attempt_at?: string | null;
  next_retry_at?: string | null;
};

const RETRY_BACKOFF_MS = [0, 5_000, 15_000, 60_000, 5 * 60_000, 15 * 60_000] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asPayload(payload: unknown): OutboxPayload {
  if (!payload || typeof payload !== "object") return {};
  return payload as OutboxPayload;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Sinkronisasi gagal";
}

function backoffMs(retryCount: number): number {
  if (retryCount < RETRY_BACKOFF_MS.length) return RETRY_BACKOFF_MS[retryCount]!;
  return RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1]!;
}

function nextRetryIso(retryCount: number): string {
  return new Date(Date.now() + backoffMs(retryCount)).toISOString();
}

function isDue(item: SyncOutboxItem): boolean {
  const next = item.next_retry_at;
  if (!next) return true;
  const when = Date.parse(next);
  if (Number.isNaN(when)) return true;
  return when <= Date.now();
}

class SyncEngine {
  private started = false;
  private running: Promise<void> | null = null;
  private readonly onOnline = () => {
    void this.sync();
  };

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    window.addEventListener("online", this.onOnline);
    if (navigator.onLine) {
      void this.sync();
    }
  }

  stop(): void {
    if (!this.started || typeof window === "undefined") return;
    window.removeEventListener("online", this.onOnline);
    this.started = false;
  }

  async sync(): Promise<void> {
    if (this.running) return this.running;

    this.running = this.run().finally(() => {
      this.running = null;
    });

    return this.running;
  }

  private async run(): Promise<void> {
    if (typeof window === "undefined") return;

    const db = getDb();
    if (!db) return;

    const session = getSessionSnapshot() ?? (await ensureSessionSnapshot());
    if (!session?.user) return;

    const rows = (await db.tb_outbox.where("status").equals("pending").sortBy("created_at")) as SyncOutboxItem[];

    for (const item of rows) {
      if (!isDue(item)) continue;
      try {
        await this.dispatch(item);
        await db.tb_outbox.delete(item.client_mutation_id);
      } catch (error) {
        const retryCount = (item.retry_count ?? 0) + 1;
        await db.tb_outbox.update(item.client_mutation_id, {
          status: "pending",
          retry_count: retryCount,
          last_error: formatError(error),
          last_attempt_at: nowIso(),
          next_retry_at: nextRetryIso(retryCount),
        } satisfies Partial<SyncOutboxItem>);
      }
    }
  }

  private async dispatch(item: SyncOutboxItem): Promise<void> {
    const payload = asPayload(item.payload);

    if (typeof payload.rpc === "string" && payload.rpc.trim()) {
      const { error } = await supabase.rpc(payload.rpc, (payload.rpc_args ?? {}) as Record<string, unknown>);
      if (error) throw error;
      return;
    }

    switch (item.jenis) {
      case "pending_kelahiran":
        await this.syncLivestockBirth(payload);
        return;
      case "pending_limbah":
        await this.syncWasteConversion(payload);
        return;
      case "pending_batch":
        await this.syncBatchMeasurement(payload);
        return;
      case "pending_hama":
        await this.syncFinancialLedger(payload, "maintenance", "Pengobatan / penanganan hama");
        return;
      case "pending_pakan":
        await this.syncFinancialLedger(payload, "purchase", "Pembelian pakan");
        return;
      case "pending_pos":
        await this.syncFinancialLedger(payload, "sale", "Transaksi POS");
        return;
      case "pending_panen":
        await this.syncFinancialLedger(payload, "sale", "Panen tercatat");
        return;
      case "pending_rawat_harian":
      default:
        await this.syncFinancialLedger(payload, "maintenance", "Biaya rawat harian");
        return;
    }
  }

  private async syncFinancialLedger(
    payload: OutboxPayload,
    ledgerType: "hpp" | "maintenance" | "purchase" | "sale" | "adjustment",
    fallbackDescription: string,
  ): Promise<void> {
    const description = toText(payload.catatan ?? payload.description, fallbackDescription);
    const quantity = toNumber(payload.quantity ?? payload.jumlah ?? 1, 1);
    const unit = toText(payload.unit, ledgerType === "sale" ? "trx" : ledgerType === "purchase" ? "Kg" : "day/head");
    const unitCost = toNumber(
      payload.unit_cost ?? payload.harga ?? payload.value ?? payload.total,
      ledgerType === "maintenance" ? 2000 : 0,
    );

    const row = {
      ledger_date: new Date().toISOString().slice(0, 10),
      ledger_type: payload.ledger_type ?? ledgerType,
      livestock_id: (payload.livestock_id ?? payload.hewan_id ?? null) as string | null,
      investor_id: (payload.investor_id ?? null) as string | null,
      reference_code: toText(payload.reference_code, ""),
      description,
      quantity,
      unit,
      unit_cost: unitCost,
      currency: "IDR",
      notes: toText(payload.lokasi, ""),
    };

    const { error } = await supabase.from("financial_ledgers").insert(row);
    if (error) throw error;
  }

  private async syncLivestockBirth(payload: OutboxPayload): Promise<void> {
    const row = {
      tag_code: toText(payload.tag_code, `TB-${Date.now()}`),
      species: toText(payload.species, "Kambing"),
      breed: toText(payload.breed, ""),
      sex: toText(payload.sex, "unknown"),
      status: toText(payload.status, "active"),
      mother_id: (payload.mother_id ?? null) as string | null,
      father_id: (payload.father_id ?? null) as string | null,
      birth_date: payload.birth_date ?? null,
      acquired_on: payload.acquired_on ?? new Date().toISOString().slice(0, 10),
      current_weight_kg: toNumber(payload.current_weight_kg, 0),
      contest_value: toNumber(payload.contest_value, 0),
      notes: toText(payload.catatan ?? payload.description, ""),
    };

    const { error } = await supabase.from("livestock").insert(row);
    if (error) throw error;
  }

  private async syncWasteConversion(payload: OutboxPayload): Promise<void> {
    const row = {
      conversion_date: new Date().toISOString().slice(0, 10),
      livestock_id: (payload.livestock_id ?? payload.hewan_id ?? null) as string | null,
      source_material: toText(payload.source_material, "manure"),
      output_inventory_name: toText(payload.output_inventory_name, "Pupuk Organik"),
      output_form: (payload.output_form ?? "solid") as "solid" | "liquid",
      output_unit: (payload.output_unit ?? "Kg") as "Kg" | "Drum",
      source_quantity: toNumber(payload.source_quantity ?? payload.quantity ?? payload.jumlah, 1),
      output_quantity: toNumber(payload.output_quantity ?? payload.value ?? payload.total, 1),
      location: toText(payload.lokasi, ""),
      notes: toText(payload.catatan ?? payload.description, ""),
    };

    const { error } = await supabase.from("waste_conversions").insert(row);
    if (error) throw error;
  }

  private async syncBatchMeasurement(payload: OutboxPayload): Promise<void> {
    const livestockId = toText(payload.livestock_id ?? payload.hewan_id, "");
    if (livestockId && (payload.current_weight_kg != null || payload.contest_value != null)) {
      const update: Record<string, unknown> = {};
      if (payload.current_weight_kg != null) update.current_weight_kg = toNumber(payload.current_weight_kg, 0);
      if (payload.contest_value != null) update.contest_value = toNumber(payload.contest_value, 0);
      update.notes = toText(payload.catatan ?? payload.description, "");

      const { error } = await supabase.from("livestock").update(update).eq("id", livestockId);
      if (error) throw error;
      return;
    }

    await this.syncFinancialLedger(payload, "adjustment", "Pengukuran batch");
  }
}

let syncEngine: SyncEngine | null = null;

export function getSyncEngine(): SyncEngine {
  if (!syncEngine) syncEngine = new SyncEngine();
  return syncEngine;
}

export function startSyncEngine(): void {
  getSyncEngine().start();
}

export function stopSyncEngine(): void {
  syncEngine?.stop();
}
