import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { isValidEmail, isValidPassword, isValidAlias } from "../../lib/security.js";
import { SITE_CONFIG } from "../../config/site.config.js";
import { Eye, EyeOff, Loader } from "lucide-react";

export default function AuthPage() {
  const [params]   = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "register" ? "register" : "login");
  const navigate   = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon brand-icon-lg"><span>E</span></div>
          <h1>{SITE_CONFIG.name}</h1>
          <p>{SITE_CONFIG.tagline}</p>
        </div>

        <div className="auth-tabs">
          <button className={tab === "login" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("login")}>
            Iniciar sesión
          </button>
          <button className={tab === "register" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("register")}>
            Crear cuenta
          </button>
        </div>

        {tab === "login"
          ? <LoginForm onSuccess={() => navigate("/")} />
          : <RegisterForm onSuccess={() => navigate("/")} />
        }

        <p className="auth-help">
          ¿Necesitas ayuda? <a href={`mailto:${SITE_CONFIG.supportEmail}`}>{SITE_CONFIG.supportEmail}</a>
        </p>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) { setError("Correo inválido."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else onSuccess();
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Correo electrónico</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com" autoComplete="email" required />
      </div>
      <div className="form-group">
        <label>Contraseña</label>
        <div className="input-with-icon">
          <input type={showPass ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            autoComplete="current-password" required />
          <button type="button" onClick={() => setShowPass(v => !v)} className="input-icon-btn">
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary btn-full" disabled={loading}>
        {loading ? <Loader size={18} className="spin" /> : "Iniciar sesión"}
      </button>
    </form>
  );
}

// ── Register ──────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [email,    setEmail]    = useState("");
  const [alias,    setAlias]    = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email))    { setError("Correo inválido."); return; }
    if (!isValidAlias(alias))    { setError("El alias debe tener 3-30 caracteres (letras, números, _ .)"); return; }
    if (!fullName.trim())        { setError("El nombre completo es obligatorio."); return; }
    if (!isValidPassword(password)) { setError("La contraseña necesita mínimo 8 caracteres, una mayúscula y un número."); return; }
    if (password !== confirm)    { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { alias, full_name: fullName, role: "user" } },
    });
    if (err) setError(err.message);
    else onSuccess();
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre completo</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Tu nombre real" required />
      </div>
      <div className="form-group">
        <label>Alias público</label>
        <input type="text" value={alias} onChange={e => setAlias(e.target.value)}
          placeholder="como_quieres_que_te_llamen" required />
        <span className="form-hint">Este nombre será visible para todos.</span>
      </div>
      <div className="form-group">
        <label>Correo electrónico</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com" autoComplete="email" required />
      </div>
      <div className="form-group">
        <label>Contraseña</label>
        <div className="input-with-icon">
          <input type={showPass ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          <button type="button" onClick={() => setShowPass(v => !v)} className="input-icon-btn">
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>Confirmar contraseña</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••" required />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary btn-full" disabled={loading}>
        {loading ? <Loader size={18} className="spin" /> : "Crear cuenta"}
      </button>
    </form>
  );
}
