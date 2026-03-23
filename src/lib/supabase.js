import { createClient } from "@supabase/supabase-js";
import { SUPABASE_STORAGE } from "../config/storage.config.js";

if (!SUPABASE_STORAGE.url || !SUPABASE_STORAGE.anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en las variables de entorno."
  );
}

export const supabase = createClient(
  SUPABASE_STORAGE.url,
  SUPABASE_STORAGE.anonKey,
  {
    auth: {
      persistSession:      true,
      autoRefreshToken:    true,
      detectSessionInUrl:  true,
    },
    global: {
      headers: {
        // Previene ataques de clickjacking en peticiones a la API
        "X-Content-Type-Options": "nosniff",
      },
    },
  }
);

// Helper: obtener sesión actual de forma segura
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Session error:", error.message);
  return data?.session ?? null;
}

// Helper: obtener perfil con rol del usuario actual
export async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) console.error("Profile error:", error.message);
  return data;
}
