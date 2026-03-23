import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { SITE_CONFIG } from "../../config/site.config.js";
import {
  Bell, Settings, LogOut, User, Shield,
  ChevronDown, Menu, X
} from "lucide-react";

export default function Header({ onMenuToggle, mobileOpen }) {
  const { session, profile, isAdmin } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifCount] = useState(0); // TODO: suscribirse a notifications
  const dropRef = useRef(null);
  const navigate = useNavigate();

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo + nombre */}
        <Link to="/" className="header-brand">
          <div className="brand-icon">
            <span>E</span>
          </div>
          <span className="brand-name">{SITE_CONFIG.name}</span>
        </Link>

        {/* Acciones derecha */}
        <div className="header-actions">
          {session ? (
            <>
              {/* Campana */}
              <button className="icon-btn" title="Notificaciones">
                <Bell size={20} />
                {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
              </button>

              {/* Chip de sesión */}
              <div className="session-chip-wrapper" ref={dropRef}>
                <button className="session-chip" onClick={() => setDropOpen(v => !v)}>
                  <div
                    className="avatar-small"
                    style={{ backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : "none",
                             backgroundColor: profile?.theme_color ?? "#2563eb" }}
                  >
                    {!profile?.avatar_url && (profile?.alias?.[0]?.toUpperCase() ?? "U")}
                  </div>
                  <span className="chip-alias">{profile?.alias ?? "Usuario"}</span>
                  <ChevronDown size={14} className={dropOpen ? "chevron-up" : ""} />
                </button>

                {dropOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-alias">{profile?.alias}</p>
                      <p className="dropdown-role">{SITE_CONFIG.roles[profile?.role?.toUpperCase()]?.label ?? "Usuario"}</p>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/perfil" className="dropdown-item" onClick={() => setDropOpen(false)}>
                      <User size={16} /> Mi perfil
                    </Link>
                    <Link to="/ajustes" className="dropdown-item" onClick={() => setDropOpen(false)}>
                      <Settings size={16} /> Ajustes
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item dropdown-item-admin" onClick={() => setDropOpen(false)}>
                        <Shield size={16} /> Panel Admin
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="btn-secondary-sm">Iniciar sesión</Link>
              <Link to="/auth?tab=register" className="btn-primary-sm">Registrarse</Link>
            </div>
          )}

          {/* Hamburguesa móvil */}
          <button className="mobile-menu-btn icon-btn" onClick={onMenuToggle}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
