// ============================================================
//  SEGURIDAD — utilidades de protección del lado del cliente
// ============================================================

// ── Sanitización básica de texto (evita XSS) ─────────────────
export function sanitizeText(str = "") {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

// ── Validaciones ──────────────────────────────────────────────
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidAlias(alias) {
  // Solo letras, números, guiones bajos y puntos. 3-30 chars.
  return /^[a-zA-Z0-9_.]{3,30}$/.test(alias);
}

export function isValidPassword(pass) {
  // Mínimo 8 chars, al menos 1 mayúscula, 1 número
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
}

// ── Rate limiter en memoria (previene flood de peticiones) ────
const rateLimitMap = new Map();

/**
 * Devuelve true si la acción está permitida; false si se superó el límite.
 * @param {string} key     - identificador único (ej: userId + "post")
 * @param {number} limit   - máximo de acciones permitidas
 * @param {number} windowMs - ventana de tiempo en ms
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now    = Date.now();
  const record = rateLimitMap.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count   = 0;
    record.resetAt = now + windowMs;
  }

  record.count++;
  rateLimitMap.set(key, record);

  return record.count <= limit;
}

// ── Detecta scripts inyectados en contenido ───────────────────
export function containsScript(str = "") {
  return /<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(str)
    || /javascript:/gi.test(str)
    || /on\w+\s*=/gi.test(str);
}

// ── Trunca texto al límite permitido ─────────────────────────
export function truncate(str = "", max = 1000) {
  return str.slice(0, max);
}

// ── Content Security Policy meta tag (inyectar en index.html) ─
export const CSP_META = `
  default-src 'self';
  script-src  'self' 'unsafe-inline';
  style-src   'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src    'self' https://fonts.gstatic.com;
  img-src     'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
`;

// ── Headers de seguridad recomendados para netlify.toml ───────
// Ver /netlify.toml en la raíz del proyecto
