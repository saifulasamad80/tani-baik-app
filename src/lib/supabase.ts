import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Kritis: Variabel VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan. Pastikan file .env.local sudah dibuat.",
  );
}

/** Klien anon saja. Service-role dilarang di bundel klien. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
