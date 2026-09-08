import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

let sessionSnapshot: Session | null | undefined;
let sessionInitPromise: Promise<Session | null> | null = null;

export function setSessionSnapshot(session: Session | null): void {
  sessionSnapshot = session;
}

export function getSessionSnapshot(): Session | null | undefined {
  return sessionSnapshot;
}

export async function ensureSessionSnapshot(): Promise<Session | null> {
  if (sessionSnapshot !== undefined) return sessionSnapshot;
  if (!sessionInitPromise) {
    sessionInitPromise = supabase.auth
      .getSession()
      .then(({ data }) => {
        sessionSnapshot = data.session;
        return data.session;
      })
      .finally(() => {
        sessionInitPromise = null;
      });
  }
  return sessionInitPromise;
}
