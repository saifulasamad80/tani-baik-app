import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getSupabaseEnv } from "@/lib/env";
import { PERAN, type Peran, isPeran } from "@/lib/roles";

export type AkunPengguna = {
  id: string;
  email: string | null;
  nama_tampilan: string;
  peran: Peran;
  warga_id: string | null;
  created_at: string;
  updated_at: string;
};

async function buatAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Env Supabase admin belum lengkap.");
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function pastikanAdmin(accessToken: string) {
  const supabaseAdmin = await buatAdminClient();
  const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(accessToken);

  if (claimsError || !claimsData?.claims?.sub) {
    throw new Error("Sesi tidak valid. Silakan masuk ulang.");
  }

  const userId = claimsData.claims.sub;
  const { data: profil, error: profilError } = await supabaseAdmin
    .from("profil")
    .select("peran")
    .eq("id", userId)
    .maybeSingle();

  if (profilError) {
    throw profilError;
  }

  if (!profil || !isPeran(profil.peran) || profil.peran !== "admin") {
    throw new Error("Hanya admin yang dapat mengelola akun pengguna.");
  }

  return supabaseAdmin;
}

const inputAkun = z.object({
  accessToken: z.string().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  namaTampilan: z.string().trim().min(2).max(80),
  peran: z.enum(PERAN),
});

const inputToken = z.object({
  accessToken: z.string().min(1),
});

export const buatAkunPengguna = createServerFn({ method: "POST" })
  .validator(inputAkun)
  .handler(async ({ data }) => {
    const supabaseAdmin = await pastikanAdmin(data.accessToken);

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nama: data.namaTampilan },
    });

    if (createError || !created.user) {
      throw createError ?? new Error("Gagal membuat akun.");
    }

    try {
      const { error: profilError } = await supabaseAdmin.from("profil").upsert(
        {
          id: created.user.id,
          peran: data.peran,
          nama_tampilan: data.namaTampilan,
          warga_id: null,
        },
        { onConflict: "id" },
      );

      if (profilError) {
        throw profilError;
      }
    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw error;
    }

    return {
      ok: true as const,
      user: {
        id: created.user.id,
        email: created.user.email ?? data.email,
      },
    };
  });

export const daftarAkunPengguna = createServerFn({ method: "GET" })
  .validator(inputToken)
  .handler(async ({ data }) => {
    const supabaseAdmin = await pastikanAdmin(data.accessToken);
    const { data: page, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      throw listError;
    }

    const users = page.users ?? [];
    if (users.length === 0) {
      return { users: [] as AkunPengguna[] };
    }

    const ids = users.map((user) => user.id);
    const { data: profilRows, error: profilError } = await supabaseAdmin
      .from("profil")
      .select("id, peran, nama_tampilan, warga_id, created_at, updated_at")
      .in("id", ids);

    if (profilError) {
      throw profilError;
    }

    const profilMap = new Map(
      (profilRows ?? []).map((row) => [
        row.id,
        {
          peran: isPeran(row.peran) ? row.peran : "investor",
          nama_tampilan: row.nama_tampilan,
          warga_id: row.warga_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      ]),
    );

    return {
      users: users.map((user) => {
        const profil = profilMap.get(user.id);
        return {
          id: user.id,
          email: user.email ?? null,
          nama_tampilan:
            profil?.nama_tampilan ?? (user.user_metadata?.nama as string | undefined) ?? user.email ?? "Pengguna",
          peran: profil?.peran ?? "investor",
          warga_id: profil?.warga_id ?? null,
          created_at: user.created_at,
          updated_at: profil?.updated_at ?? user.updated_at,
        };
      }),
    };
  });
