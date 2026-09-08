import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Baby, CalendarDays, Edit3, Milk, Plus, Scale, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BRAND_NAME } from "@/lib/brand";
import { supabase } from "@/lib/supabase";
import { angka } from "@/lib/farm-data";

type LivestockRow = {
  id: string;
  tag_code: string;
  species: string;
  breed: string;
  sex: "male" | "female" | "unknown" | string;
  status: "active" | "quarantine" | "sold" | "archived" | "deceased" | string;
  mother_id: string | null;
  father_id: string | null;
  birth_date: string | null;
  acquired_on: string | null;
  current_weight_kg: number | string | null;
  contest_value: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LivestockFormState = {
  id: string;
  tag_code: string;
  species: string;
  breed: string;
  sex: string;
  status: string;
  mother_id: string;
  father_id: string;
  birth_date: string;
  acquired_on: string;
  current_weight_kg: string;
  contest_value: string;
  notes: string;
};

const statusMeta: Record<string, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Aktif", tone: "default" },
  quarantine: { label: "Karantina", tone: "secondary" },
  sold: { label: "Terjual", tone: "outline" },
  archived: { label: "Arsip", tone: "outline" },
  deceased: { label: "Mati", tone: "destructive" },
};

function pilihTanggal(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function nilaiAngka(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function labelTernak(row: LivestockRow): string {
  return `${row.tag_code} · ${row.species}${row.breed ? ` · ${row.breed}` : ""}`;
}

function namaKelamin(value: string): string {
  if (value === "male") return "Jantan";
  if (value === "female") return "Betina";
  return "Unknown";
}

function buatFormAwal(row?: LivestockRow | null): LivestockFormState {
  return {
    id: row?.id ?? crypto.randomUUID(),
    tag_code: row?.tag_code ?? "",
    species: row?.species ?? "",
    breed: row?.breed ?? "",
    sex: row?.sex ?? "unknown",
    status: row?.status ?? "active",
    mother_id: row?.mother_id ?? "",
    father_id: row?.father_id ?? "",
    birth_date: pilihTanggal(row?.birth_date),
    acquired_on: pilihTanggal(row?.acquired_on) || new Date().toISOString().slice(0, 10),
    current_weight_kg: row?.current_weight_kg != null ? String(row.current_weight_kg) : "",
    contest_value: row?.contest_value != null ? String(row.contest_value) : "",
    notes: row?.notes ?? "",
  };
}

async function muatLivestock(): Promise<LivestockRow[]> {
  const { data, error } = await supabase
    .from("livestock")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? crypto.randomUUID()),
      tag_code: String(r.tag_code ?? ""),
      species: String(r.species ?? ""),
      breed: String(r.breed ?? ""),
      sex: String(r.sex ?? "unknown"),
      status: String(r.status ?? "active"),
      mother_id: (r.mother_id as string | null) ?? null,
      father_id: (r.father_id as string | null) ?? null,
      birth_date: (r.birth_date as string | null) ?? null,
      acquired_on: (r.acquired_on as string | null) ?? null,
      current_weight_kg: r.current_weight_kg as number | string | null,
      contest_value: r.contest_value as number | string | null,
      notes: (r.notes as string | null) ?? null,
      created_at: String(r.created_at ?? ""),
      updated_at: String(r.updated_at ?? ""),
    };
  });
}

export const Route = createFileRoute("/livestock")({
  head: () => ({
    meta: [
      { title: `Livestock — ${BRAND_NAME}` },
      {
        name: "description",
        content:
          "Master data livestock dengan nasab, bobot, nilai kontes, dan kepemilikan induk.",
      },
    ],
  }),
  component: LivestockPage,
});

function LivestockPage() {
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LivestockRow | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["livestock"],
    queryFn: muatLivestock,
    placeholderData: [],
    staleTime: 30_000,
  });

  const livestock = data ?? [];
  const selectedId = editing?.id ?? null;
  const parentOptions = useMemo(
    () => livestock.filter((item) => item.id !== selectedId),
    [livestock, selectedId],
  );
  const total = livestock.length;
  const aktif = livestock.filter((item) => item.status === "active").length;
  const karantina = livestock.filter((item) => item.status === "quarantine").length;
  const bernasab = livestock.filter((item) => item.mother_id || item.father_id).length;
  const rataBobot = total
    ? livestock.reduce((a, b) => a + nilaiAngka(b.current_weight_kg), 0) / total
    : 0;

  const namaById = useMemo(() => {
    return new Map(livestock.map((item) => [item.id, item]));
  }, [livestock]);

  const tutupForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const simpan = async (values: LivestockFormState) => {
    if (!values.tag_code.trim() || !values.species.trim()) {
      toast.error("Tag code dan species wajib diisi.");
      return;
    }

    if (values.mother_id && values.mother_id === values.id) {
      toast.error("Induk tidak boleh sama dengan ternak ini.");
      return;
    }
    if (values.father_id && values.father_id === values.id) {
      toast.error("Induk tidak boleh sama dengan ternak ini.");
      return;
    }

    const payload = {
      id: values.id,
      tag_code: values.tag_code.trim(),
      species: values.species.trim(),
      breed: values.breed.trim(),
      sex: values.sex,
      status: values.status,
      mother_id: values.mother_id || null,
      father_id: values.father_id || null,
      birth_date: values.birth_date || null,
      acquired_on: values.acquired_on || null,
      current_weight_kg: values.current_weight_kg ? Number(values.current_weight_kg) : 0,
      contest_value: values.contest_value ? Number(values.contest_value) : 0,
      notes: values.notes.trim(),
    };

    try {
      const { error } = await supabase.from("livestock").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["livestock"] });
      toast.success(`${values.tag_code} tersimpan.`);
      tutupForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan livestock.");
    }
  };

  const bukaTambah = () => {
    setEditing(null);
    setOpen(true);
  };

  const bukaEdit = (row: LivestockRow) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Livestock"
        title="Master Data Livestock"
        description="Inventori ternak dengan nasab, bobot, nilai, dan hubungan induk"
        actions={
          <Button size="sm" onClick={bukaTambah}>
            <Plus className="size-4" />
            Tambah Ternak
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Ternak"
          value={angka(total)}
          sub={`Path: ${pathname}`}
          icon={<Milk className="size-4" />}
          tone="primary"
        />
        <StatCard
          label="Aktif"
          value={angka(aktif)}
          sub="Status active"
          icon={<ShieldCheck className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Karantina"
          value={angka(karantina)}
          sub="Perlu perhatian"
          icon={<AlertTriangle className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Rata-rata Bobot"
          value={`${angka(Math.round(rataBobot))} Kg`}
          sub={`${angka(bernasab)} ternak sudah bernasab`}
          icon={<Scale className="size-4" />}
        />
      </div>

      {isError ? (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-destructive">Gagal memuat data livestock</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Terjadi kesalahan saat membaca tabel livestock."}
              </p>
            </div>
            <Button variant="outline" onClick={() => void refetch()}>
              Muat ulang
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Inventori Ternak</h2>
              <p className="text-xs text-muted-foreground">Data langsung dari tabel Supabase livestock</p>
            </div>
            <Badge variant="secondary">
              {isFetching ? "Menyegarkan…" : `${angka(total)} record`}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? <LivestockTableSkeleton /> : null}
            {!isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nasab</TableHead>
                    <TableHead>Bobot</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livestock.map((row) => {
                    const mother = row.mother_id ? namaById.get(row.mother_id) : null;
                    const father = row.father_id ? namaById.get(row.father_id) : null;
                    const meta = statusMeta[row.status] ?? { label: row.status, tone: "outline" as const };
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.tag_code}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium">{row.species}</p>
                            <p className="text-xs text-muted-foreground">{row.breed || "Tanpa breed"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Ibu</span>
                              <span className="font-medium">{mother ? labelTernak(mother) : "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Bapak</span>
                              <span className="font-medium">{father ? labelTernak(father) : "-"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="tabular-nums font-medium">{angka(Math.round(nilaiAngka(row.current_weight_kg)))} Kg</p>
                            <p className="text-xs text-muted-foreground">
                              Lahir {pilihTanggal(row.birth_date) || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">{angka(Math.round(nilaiAngka(row.contest_value)))}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              meta.tone === "destructive"
                                ? "destructive"
                                : meta.tone === "secondary"
                                  ? "secondary"
                                  : meta.tone === "outline"
                                    ? "outline"
                                    : "default"
                            }
                          >
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => bukaEdit(row)}>
                            <Edit3 className="size-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Ringkasan Nasab</h2>
              <p className="text-xs text-muted-foreground">Parent picker memakai data ternak yang ada</p>
            </div>
            <Badge variant="outline">Validasi induk</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {livestock.slice(0, 5).map((row) => {
              const mother = row.mother_id ? namaById.get(row.mother_id) : null;
              const father = row.father_id ? namaById.get(row.father_id) : null;
              return (
                <div key={row.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{row.tag_code}</p>
                      <p className="text-xs text-muted-foreground">{row.species}</p>
                    </div>
                    <Badge variant={row.sex === "female" ? "secondary" : row.sex === "male" ? "default" : "outline"}>
                      {namaKelamin(row.sex)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Ibu</span>
                      <span className="truncate font-medium">{mother ? labelTernak(mother) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Bapak</span>
                      <span className="truncate font-medium">{father ? labelTernak(father) : "-"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border bg-accent/30 p-3 text-xs text-muted-foreground">
            Parent selector pada form add/edit hanya menampilkan record yang sudah ada, dan tidak
            pernah menampilkan ternak yang sedang diedit sebagai orang tua dirinya sendiri.
          </div>
        </section>
      </div>

      <LivestockFormDialog
        open={open}
        initial={editing}
        parentOptions={parentOptions}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        onSubmit={(values) => void simpan(values)}
      />
    </div>
  );
}

function LivestockTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid grid-cols-7 gap-3">
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
        </div>
      ))}
    </div>
  );
}

function LivestockFormDialog({
  open,
  onOpenChange,
  initial,
  parentOptions,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: LivestockRow | null;
  parentOptions: LivestockRow[];
  onSubmit: (values: LivestockFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<LivestockFormState>(() => buatFormAwal(initial));

  const title = initial ? "Edit Livestock" : "Tambah Livestock";

  useEffect(() => {
    if (open) setForm(buatFormAwal(initial));
  }, [open, initial]);

  const update = (key: keyof LivestockFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Isi data ternak dan pilih induk dari master data yang sudah ada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tag_code">Tag Code</Label>
            <Input
              id="tag_code"
              value={form.tag_code}
              onChange={(e) => update("tag_code", e.target.value)}
              placeholder="LB-001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="species">Species</Label>
            <Input
              id="species"
              value={form.species}
              onChange={(e) => update("species", e.target.value)}
              placeholder="Kambing / Sapi / Ayam / Ikan"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              value={form.breed}
              onChange={(e) => update("breed", e.target.value)}
              placeholder="Etawa, Limousin, dll"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={(value) => update("sex", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="male">Jantan</SelectItem>
                  <SelectItem value="female">Betina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => update("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="quarantine">Karantina</SelectItem>
                  <SelectItem value="sold">Terjual</SelectItem>
                  <SelectItem value="archived">Arsip</SelectItem>
                  <SelectItem value="deceased">Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ibu</Label>
            <Select value={form.mother_id || "__none__"} onValueChange={(value) => update("mother_id", value === "__none__" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih induk betina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tidak ada</SelectItem>
                {parentOptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {labelTernak(row)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Bapak</Label>
            <Select value={form.father_id || "__none__"} onValueChange={(value) => update("father_id", value === "__none__" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih induk jantan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tidak ada</SelectItem>
                {parentOptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {labelTernak(row)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Tanggal Lahir</Label>
            <Input
              id="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acquired_on">Tanggal Perolehan</Label>
            <Input
              id="acquired_on"
              type="date"
              value={form.acquired_on}
              onChange={(e) => update("acquired_on", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current_weight_kg">Bobot Saat Ini (Kg)</Label>
            <Input
              id="current_weight_kg"
              type="number"
              min={0}
              inputMode="decimal"
              value={form.current_weight_kg}
              onChange={(e) => update("current_weight_kg", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contest_value">Nilai Kontes</Label>
            <Input
              id="contest_value"
              type="number"
              min={0}
              inputMode="decimal"
              value={form.contest_value}
              onChange={(e) => update("contest_value", e.target.value)}
            />
          </div>
          <div className="lg:col-span-2 space-y-1.5">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Keterangan tambahan, riwayat perawatan, atau kontes."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => void onSubmit(form)}>
            <Baby className="size-4" />
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
