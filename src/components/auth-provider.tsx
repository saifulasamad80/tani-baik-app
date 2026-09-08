import { useContext, useEffect, useMemo, useState, createContext, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { hapusReplicaLokal } from "@/lib/db/dexie";
import { ensureSessionSnapshot, setSessionSnapshot } from "@/lib/auth-session";
import { hapusCacheAplikasi } from "@/lib/pwa/register-sw";
import { isPeran, type Peran, type Profil } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

type AuthValue = {
  siap: boolean;
  session: Session | null;
  profil: Profil | null;
  skemaHilang: boolean;
  keluar: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function muatProfil(userId: string): Promise<{ profil: Profil | null; skemaHilang: boolean }> {
  const { data, error } = await supabase
    .from("profil")
    .select("id, peran, nama_tampilan, warga_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const hilang =
      error.code === "42P01" ||
      /relation .* does not exist|could not find the table/i.test(error.message);
    return { profil: null, skemaHilang: hilang };
  }
  if (!data || typeof data !== "object") return { profil: null, skemaHilang: false };

  const row = data as {
    id: string;
    peran: string;
    nama_tampilan: string;
    warga_id: string | null;
  };
  if (!isPeran(row.peran)) return { profil: null, skemaHilang: false };
  return {
    profil: {
      id: row.id,
      peran: row.peran,
      nama_tampilan: row.nama_tampilan,
      warga_id: row.warga_id,
    },
    skemaHilang: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [siap, setSiap] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [skemaHilang, setSkemaHilang] = useState(false);

  useEffect(() => {
    let hidup = true;

    const terapkan = async (next: Session | null) => {
      if (!hidup) return;
      setSession(next);
      setSessionSnapshot(next);
      if (!next?.user) {
        setProfil(null);
        setSkemaHilang(false);
        setSiap(true);
        return;
      }
      const hasil = await muatProfil(next.user.id);
      if (!hidup) return;
      setProfil(hasil.profil);
      setSkemaHilang(hasil.skemaHilang);
      setSiap(true);
    };

    void ensureSessionSnapshot().then((session) => terapkan(session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void terapkan(next);
    });

    return () => {
      hidup = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      siap,
      session,
      profil,
      skemaHilang,
      keluar: async () => {
        await supabase.auth.signOut();
        await hapusReplicaLokal();
        await hapusCacheAplikasi();
        setSessionSnapshot(null);
        setProfil(null);
        setSession(null);
      },
    }),
    [siap, session, profil, skemaHilang],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return ctx;
}

export function usePeran(): Peran | null {
  return useAuth().profil?.peran ?? null;
}
