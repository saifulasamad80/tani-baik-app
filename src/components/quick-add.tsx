import { useState } from "react";
import {
  Activity,
  Banknote,
  Camera,
  ClipboardCheck,
  Leaf,
  Plus,
  Ruler,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDb, type OutboxJenis } from "@/lib/db/dexie";

const quickActions = [
  { id: "catatan", label: "Catatan", icon: ClipboardCheck, outbox: "pending_rawat_harian" },
  { id: "tugas", label: "Tugas", icon: Activity, outbox: "pending_rawat_harian" },
  { id: "transaksi", label: "Transaksi", icon: Banknote, outbox: "pending_pos" },
  { id: "foto", label: "Foto", icon: Camera, outbox: "pending_rawat_harian" },
  { id: "pengobatan", label: "Pengobatan", icon: Stethoscope, outbox: "pending_hama" },
  { id: "pakan", label: "Pemberian Pakan", icon: Utensils, outbox: "pending_pakan" },
  { id: "pengukuran", label: "Pengukuran", icon: Ruler, outbox: "pending_batch" },
  { id: "panen", label: "Panen", icon: Leaf, outbox: "pending_panen" },
] as const;

function buatId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function QuickAdd({ daring }: { daring: boolean }) {
  const [open, setOpen] = useState(false);
  const [jenis, setJenis] = useState<(typeof quickActions)[number]["id"]>("catatan");
  const [lokasi, setLokasi] = useState("Blok 1");
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");

  const selected = quickActions.find((a) => a.id === jenis)!;

  const simpan = async () => {
    if (!catatan.trim() && !jumlah.trim()) {
      toast.error("Isi catatan atau jumlah aktivitas terlebih dahulu.");
      return;
    }

    const db = getDb();
    const payload = {
      jenis,
      lokasi,
      jumlah: jumlah.trim(),
      catatan: catatan.trim(),
      dicatat_at: new Date().toISOString(),
      sumber: "quick_add",
    };

    if (db) {
      await db.tb_outbox.put({
        client_mutation_id: buatId(),
        jenis: selected.outbox as OutboxJenis,
        payload,
        created_at: new Date().toISOString(),
        status: "pending",
      });
    }

    toast.success(
      daring
        ? `${selected.label} masuk antrean sinkronisasi Supabase.`
        : `${selected.label} tersimpan di perangkat untuk Offline Scout.`,
    );
    setJumlah("");
    setCatatan("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="size-9" aria-label="Quick Add">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Catat aktivitas lapangan, transaksi, foto, pengobatan, pakan, pengukuran, dan panen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const aktif = action.id === jenis;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setJenis(action.id)}
                className={`flex min-h-20 flex-col items-start justify-between rounded-lg border p-3 text-left text-xs transition-colors ${
                  aktif ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted/60"
                }`}
              >
                <action.icon className="size-4" />
                <span className="font-semibold leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Lokasi / Aset</Label>
            <Select value={lokasi} onValueChange={setLokasi}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Blok 1", "Blok 2", "Blok 3", "Kandang A", "Kandang B", "Kolam 1-3", "Gudang"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quick-jumlah">Jumlah / Nilai</Label>
            <Input
              id="quick-jumlah"
              value={jumlah}
              onChange={(event) => setJumlah(event.target.value)}
              placeholder="Contoh: 120 Kg, Rp 450.000, 2 ekor"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quick-catatan">Catatan</Label>
          <Textarea
            id="quick-catatan"
            rows={4}
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            placeholder="Tulis detail aktivitas lapangan."
          />
        </div>

        <DialogFooter>
          <Button onClick={simpan}>
            <selected.icon className="size-4" />
            Simpan {selected.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
