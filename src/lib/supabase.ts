import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Kritis: Variabel SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL/VITE_SUPABASE_URL atau SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY tidak ditemukan. Pastikan env Vercel dan .env.local sudah cocok.",
  );
}

/** Klien anon saja. Service-role dilarang di bundel klien. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
