import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { isValidPassword } from "../lib/security.js";
import { SITE_CONFIG } from "../config/site.config.js";
import { Lock, Mail, Loader, Check } from "lucide-react";

export default function SettingsPage() {
  const { session, profile } = useAuth();
  if (!session) return <Navigate to="/auth" replace />;

  return (
    <div className="page-container settings-page">
      <h1 className="settings-title">Ajustes</h1>

      <div className="settings-grid">
        <AccountInfo profile={profile} />
        <ChangePassword session={session} />
      </div>
    </div>
  );
}

function AccountInfo({ profile }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <Mail size={18} />
        <h2>Información de cuenta</h2>
      </div>
      <p className="settings-hint">
        Estos datos son gestionados por el administrador y no pueden modificarse desde aquí.
        Si necesitas cambiarlos, contacta a <a href={`mailto:${SITE_CONFIG.supportEmail}`}>{SITE_CONFIG.supportEmail}</a>.
      </p>
      <div className="info-row">
        <span className="info-label">Correo</span>
        <span className="info-value">{profile?.email}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Nombre real</span>
        <span className="info-value">{profile?.full_name}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Rol</span>
        <span className={`role-badge role-${profile?.role}`}>
          {SITE_CONFIG.roles[profile?.role?.toUpperCase()]?.label}
        </span>
      </div>
    </div>
  );
}

function ChangePassword({ session }) {
  const [current,  setCurrent]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(false);

    if (!isValidPassword(newPass)) {
      setError("La contraseña necesita mínimo 8 caracteres, una mayúscula y un número.");
      return;
    }
    if (newPass !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    // Reautenticar con la contraseña actual
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: current,
    });

    if (signInErr) {
      setError("La contraseña actual es incorrecta.");
      setLoading(false);
      return;
    }

    // Cambiar contraseña
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass });
    if (updateErr) setError(updateErr.message);
    else {
      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
    }
    setLoading(false);
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <Lock size={18} />
        <h2>Cambiar contraseña</h2>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Contraseña actual</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
            placeholder="••••••••" required />
        </div>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
            placeholder="••••••••" required />
          <span className="form-hint">Mínimo 8 caracteres, una mayúscula y un número.</span>
        </div>
        <div className="form-group">
          <label>Confirmar nueva contraseña</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" required />
        </div>

        {error   && <p className="form-error">{error}</p>}
        {success && (
          <p className="form-success" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> Contraseña actualizada correctamente.
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader size={16} className="spin" /> : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
