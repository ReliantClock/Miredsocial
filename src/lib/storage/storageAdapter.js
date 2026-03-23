// ============================================================
//  STORAGE ADAPTER — interfaz unificada para todos los
//  proveedores. Nunca importes el proveedor directamente;
//  usa siempre este módulo.
// ============================================================
import { STORAGE_PROVIDER, SUPABASE_STORAGE, CLOUDINARY_CONFIG } from "../config/storage.config.js";
import { supabase } from "./supabase.js";
import { SITE_CONFIG } from "../config/site.config.js";

const MAX_BYTES = SITE_CONFIG.maxFileSizeMB * 1024 * 1024;

// ── Validación común ──────────────────────────────────────────
function validateFile(file) {
  if (file.size > MAX_BYTES) {
    throw new Error(`El archivo supera el límite de ${SITE_CONFIG.maxFileSizeMB} MB.`);
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
  if (!allowed.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido.");
  }
}

// ── Sanitiza nombre de archivo ────────────────────────────────
function safeName(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ── Adapters ──────────────────────────────────────────────────
const adapters = {
  supabase: {
    async upload(file, path) {
      validateFile(file);
      const cleanPath = `${path}/${Date.now()}_${safeName(file.name)}`;
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE.bucket)
        .upload(cleanPath, file, { upsert: false });
      if (error) throw error;
      return `${SUPABASE_STORAGE.publicUrl}/${data.path}`;
    },
    async remove(url) {
      const path = url.replace(`${SUPABASE_STORAGE.publicUrl}/`, "");
      const { error } = await supabase.storage
        .from(SUPABASE_STORAGE.bucket)
        .remove([path]);
      if (error) throw error;
    },
  },

  cloudinary: {
    async upload(file, _path) {
      validateFile(file);
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
      form.append("folder", CLOUDINARY_CONFIG.folder);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error("Error al subir a Cloudinary");
      const data = await res.json();
      return data.secure_url;
    },
    async remove(publicId) {
      // Requires server-side signed request — delegate to your backend/edge function
      console.warn("Cloudinary delete should be handled server-side:", publicId);
    },
  },

  // Stubs para R2 / B2 / Oracle / Firebase:
  // Implementar con el SDK correspondiente siguiendo el mismo contrato.
  r2:      { async upload() { throw new Error("R2 adapter not implemented"); } },
  b2:      { async upload() { throw new Error("B2 adapter not implemented"); } },
  oracle:  { async upload() { throw new Error("Oracle adapter not implemented"); } },
  firebase:{ async upload() { throw new Error("Firebase adapter not implemented"); } },
};

const adapter = adapters[STORAGE_PROVIDER];
if (!adapter) throw new Error(`Unknown STORAGE_PROVIDER: ${STORAGE_PROVIDER}`);

export const StorageService = {
  /** Sube un archivo y devuelve su URL pública */
  upload: (file, path = "uploads") => adapter.upload(file, path),
  /** Elimina un archivo por su URL pública */
  remove: (url) => adapter.remove?.(url) ?? Promise.resolve(),
};
