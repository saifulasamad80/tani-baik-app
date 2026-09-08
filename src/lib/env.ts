export function getSupabaseEnv() {
  const runtimeEnv = typeof process !== "undefined" ? process.env : undefined;
  const url =
    runtimeEnv?.VITE_SUPABASE_URL ??
    runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL ??
    import.meta.env.VITE_SUPABASE_URL ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    runtimeEnv?.VITE_SUPABASE_ANON_KEY ??
    runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey };
}
