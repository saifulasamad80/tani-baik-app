type EnvBag = Record<string, string | undefined> | undefined;

function bacaEnv(...sumber: EnvBag[]): string | undefined {
  for (const sumberEnv of sumber) {
    if (!sumberEnv) continue;
    for (const nilai of Object.values(sumberEnv)) {
      if (typeof nilai === "string" && nilai.trim()) {
        return nilai.trim();
      }
    }
  }
  return undefined;
}

export function getSupabaseEnv() {
  const runtimeEnv = typeof process !== "undefined" ? process.env : undefined;
  const buildEnv = import.meta.env as Record<string, string | undefined>;
  const url = bacaEnv(
    runtimeEnv && {
      SUPABASE_URL: runtimeEnv.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: runtimeEnv.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_URL: runtimeEnv.VITE_SUPABASE_URL,
    },
    {
      SUPABASE_URL: buildEnv.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: buildEnv.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_URL: buildEnv.VITE_SUPABASE_URL,
    },
  );
  const anonKey = bacaEnv(
    runtimeEnv && {
      SUPABASE_ANON_KEY: runtimeEnv.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VITE_SUPABASE_ANON_KEY: runtimeEnv.VITE_SUPABASE_ANON_KEY,
    },
    {
      SUPABASE_ANON_KEY: buildEnv.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: buildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VITE_SUPABASE_ANON_KEY: buildEnv.VITE_SUPABASE_ANON_KEY,
    },
  );

  return { url, anonKey };
}
