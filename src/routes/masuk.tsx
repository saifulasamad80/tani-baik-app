import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME } from "@/lib/brand";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/masuk")({
  head: () => ({
    meta: [
      { title: `Masuk — ${BRAND_NAME}` },
      { name: "description", content: `Masuk ke ${BRAND_NAME} dengan email dan kata sandi.` },
    ],
  }),
  component: MasukPage,
});

function MasukPage() {
  const { session, siap } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (siap && session) {
      void navigate({ to: "/" });
    }
  }, [siap, session, navigate]);

  const kirim = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
      if (error) throw error;
      toast.success(`Selamat datang di ${BRAND_NAME}.`);
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {BRAND_NAME}
            </p>
            <h1 className="text-xl font-bold tracking-tight">Masuk</h1>
          </div>
        </div>
        <form className="grid gap-3" onSubmit={kirim}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sandi">Kata sandi</Label>
            <Input
              id="sandi"
              type="password"
              required
              minLength={6}
              value={sandi}
              onChange={(ev) => setSandi(ev.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Memproses…" : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
