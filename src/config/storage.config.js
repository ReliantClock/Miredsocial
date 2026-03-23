// ============================================================
//  STORAGE CONFIGURATION
//  Cambia STORAGE_PROVIDER para usar un servicio distinto.
//  Luego rellena solo las variables del proveedor elegido.
// ============================================================

// Opciones: "supabase" | "cloudinary" | "r2" | "b2" | "oracle" | "firebase"
export const STORAGE_PROVIDER = "supabase";

// ── Supabase Storage ──────────────────────────────────────────
export const SUPABASE_STORAGE = {
  url:        import.meta.env.https://mpqrkyipcsigvmcgtlaa.supabase.co,
  anonKey:    import.meta.env.sb_publishable_xEWhnynAxZ5sMCvi8BCNmQ_VosJEBUw,
  bucket:     "media",          // Nombre del bucket de Supabase Storage
  publicUrl:  `${import.meta.env.https://mpqrkyipcsigvmcgtlaa.supabase.co}/storage/v1/object/public/media`,
};

// ── Cloudinary ────────────────────────────────────────────────
export const CLOUDINARY_CONFIG = {
  cloudName:  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey:     import.meta.env.VITE_CLOUDINARY_API_KEY,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  folder:     "socially",
};

// ── Cloudflare R2 ─────────────────────────────────────────────
export const R2_CONFIG = {
  accountId:       import.meta.env.VITE_R2_ACCOUNT_ID,
  accessKeyId:     import.meta.env.VITE_R2_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  bucket:          import.meta.env.VITE_R2_BUCKET,
  publicUrl:       import.meta.env.VITE_R2_PUBLIC_URL,
};

// ── Backblaze B2 ──────────────────────────────────────────────
export const B2_CONFIG = {
  applicationKeyId: import.meta.env.VITE_B2_KEY_ID,
  applicationKey:   import.meta.env.VITE_B2_APP_KEY,
  bucketId:         import.meta.env.VITE_B2_BUCKET_ID,
  bucketName:       import.meta.env.VITE_B2_BUCKET_NAME,
};

// ── Oracle Cloud Object Storage ───────────────────────────────
export const ORACLE_CONFIG = {
  namespace:    import.meta.env.VITE_ORACLE_NAMESPACE,
  bucketName:   import.meta.env.VITE_ORACLE_BUCKET,
  region:       import.meta.env.VITE_ORACLE_REGION,
  accessKey:    import.meta.env.VITE_ORACLE_ACCESS_KEY,
  secretKey:    import.meta.env.VITE_ORACLE_SECRET_KEY,
};

// ── Firebase Storage ──────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── DATABASE provider ─────────────────────────────────────────
// Opciones: "supabase" | "firebase" | "oracle"
export const DB_PROVIDER = "supabase";
