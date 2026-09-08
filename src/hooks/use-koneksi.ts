import { useEffect, useState } from "react";

import { hitungAntrean } from "@/lib/db/dexie";
import { JEDA_PING_MS, pingSupabase } from "@/lib/pwa/health";

export type StatusKoneksi = {
  daring: boolean;
  navigatorOnline: boolean;
  antrean: number;
};

export function useKoneksi(): StatusKoneksi {
  const [navigatorOnline, setNavigatorOnline] = useState(true);
  const [gagalPing, setGagalPing] = useState(0);
  const [antrean, setAntrean] = useState(0);

  useEffect(() => {
    const sinkron = () => setNavigatorOnline(navigator.onLine);
    sinkron();
    window.addEventListener("online", sinkron);
    window.addEventListener("offline", sinkron);

    let hidup = true;
    const tick = async () => {
      const ok = await pingSupabase();
      if (!hidup) return;
      setGagalPing((n) => (ok ? 0 : n + 1));
      setAntrean(await hitungAntrean());
    };

    void tick();
    const id = window.setInterval(() => void tick(), JEDA_PING_MS);

    return () => {
      hidup = false;
      window.clearInterval(id);
      window.removeEventListener("online", sinkron);
      window.removeEventListener("offline", sinkron);
    };
  }, []);

  const daring = navigatorOnline && gagalPing < 2;
  return { daring, navigatorOnline, antrean };
}
