// ============================================================
//  SITE CONFIGURATION — cambia aquí todos los datos globales
//  sin tocar ningún otro archivo del proyecto.
// ============================================================

export const SITE_CONFIG = {
  // ── Identidad ─────────────────────────────────────────────
  name: "EduLink",                          // Nombre de la red social
  tagline: "Tu comunidad educativa",        // Subtítulo / slogan
  description: "La red social de tu institución educativa",
  logoUrl: "/logo.svg",                     // Ruta al logo (en /public)
  faviconUrl: "/favicon.ico",

  // ── Contacto ──────────────────────────────────────────────
  supportEmail: "soporte@edulink.app",
  adminEmail:   "admin@edulink.app",
  contactUrl:   "/contacto",

  // ── URLs base ─────────────────────────────────────────────
  siteUrl: "https://edulink.app",           // URL de producción
  devUrl:  "http://localhost:5173",

  // ── Límites de la plataforma ──────────────────────────────
  maxUsers: 2000,
  maxFileSizeMB: 10,                        // Tamaño máximo de archivo subido
  maxPostLength: 1000,                      // Caracteres por publicación
  maxCommentLength: 500,

  // ── Funcionalidades on/off ─────────────────────────────────
  features: {
    anonymousForum:   true,   // Foro anónimo en Comunidades
    communities:      true,   // Sección Comunidades
    news:             true,   // Sección Novedades/Noticias
    darkMode:         false,  // Toggle de modo oscuro para usuarios
    emailNotifications: true,
  },

  // ── Textos de navegación ──────────────────────────────────
  nav: {
    home:        "Inicio",
    news:        "Novedades",
    communities: "Comunidades",
    profile:     "Perfil",
    admin:       "Panel Admin",
  },

  // ── Nombre del foro anónimo predeterminado ─────────────────
  anonymousForumName:  "Anónimo",
  anonymousForumSlug:  "anonimo",

  // ── Roles (no cambiar los valores, solo las etiquetas) ────
  roles: {
    USER:    { key: "user",    label: "Usuario"    },
    MANAGER: { key: "manager", label: "Encargado"  },
    ADMIN:   { key: "admin",   label: "Administrador" },
  },
};
