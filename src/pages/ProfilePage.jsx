import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { StorageService } from "../lib/storage/storageAdapter.js";
import { isValidAlias } from "../lib/security.js";
import { SITE_CONFIG } from "../config/site.config.js";
import { Camera, Edit2, Check, X, Loader } from "lucide-react";

const THEME_COLORS = [
  "#2563eb","#7c3aed","#db2777","#dc2626","#ea580c",
  "#16a34a","#0891b2","#0d9488","#64748b","#1e293b",
];

export default function ProfilePage() {
  const { alias }    = useParams();
  const { session, profile: myProfile, isAdmin, refreshProfile } = useAuth();

  const isOwnProfile = !alias || alias === myProfile?.alias;

  const [profile,   setProfile]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [loadingP,  setLoadingP]  = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [newAlias,  setNewAlias]  = useState("");
  const [newBio,    setNewBio]    = useState("");
  const [newColor,  setNewColor]  = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const fileRef = useRef(null);

  // Carga el perfil correctamente con useEffect
  useEffect(() => {
    setLoadingP(true);
    if (isOwnProfile) {
      if (myProfile) {
        setProfile(myProfile);
        setLoadingP(false);
        loadPosts(myProfile.id);
      } else if (session === null) {
        // No hay sesión, no cargues nada
        setLoadingP(false);
      }
      // Si session es undefined (cargando), espera
    } else {
      supabase.from("profiles").select("*").eq("alias", alias).single()
        .then(({ data }) => {
          setProfile(data ?? null);
          if (data) loadPosts(data.id);
          setLoadingP(false);
        });
    }
  }, [alias, myProfile, session]);

  async function loadPosts(userId) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", userId)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(20);
    setPosts(data ?? []);
  }

  function startEdit() {
    setNewAlias(profile.alias);
    setNewBio(profile.bio ?? "");
    setNewColor(profile.theme_color ?? "#2563eb");
    setEditing(true);
    setError(""); setSuccess("");
  }

  async function saveEdit() {
    if (!isValidAlias(newAlias)) { setError("Alias inválido (3-30 chars, letras/números/._)"); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("profiles")
      .update({ alias: newAlias, bio: newBio, theme_color: newColor })
      .eq("id", session.user.id);
    if (err) setError(err.message);
    else {
      await refreshProfile();
      setProfile(p => ({ ...p, alias: newAlias, bio: newBio, theme_color: newColor }));
      setSuccess("Perfil actualizado.");
      setEditing(false);
    }
    setSaving(false);
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const url = await StorageService.upload(file, `avatars/${session.user.id}`);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      await refreshProfile();
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch (err) { setError(err.message); }
    setUploading(false);
  }

  // Spinner mientras carga
  if (loadingP) {
    return (
      <div className="page-container">
        <div className="feed-loading"><Loader size={24} className="spin" /></div>
      </div>
    );
  }

  // Sin sesión y perfil propio → prompt de login
  if (!profile && isOwnProfile && !session) {
    return (
      <div className="page-container">
        <div className="auth-prompt">
          <h2>Inicia sesión</h2>
          <p>Debes iniciar sesión para ver tu perfil.</p>
          <Link to="/auth" className="btn-primary">Iniciar sesión / Registrarse</Link>
        </div>
      </div>
    );
  }

  // Perfil no encontrado
  if (!profile) {
    return (
      <div className="page-container">
        <div className="empty-state"><p>Perfil no encontrado.</p></div>
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      <div className="profile-header" style={{ "--profile-color": profile.theme_color ?? "#2563eb" }}>
        <div className="profile-banner" />
        <div className="profile-info">
          <div className="profile-avatar-wrapper">
            <div
              className="profile-avatar"
              style={{
                backgroundColor: profile.theme_color ?? "#2563eb",
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : "none",
              }}
            >
              {!profile.avatar_url && profile.alias?.[0]?.toUpperCase()}
            </div>
            {isOwnProfile && (
              <>
                <button className="avatar-upload-btn" onClick={() => fileRef.current?.click()} title="Cambiar foto">
                  {uploading ? <Loader size={14} className="spin" /> : <Camera size={14} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadAvatar} />
              </>
            )}
          </div>

          <div className="profile-details">
            {editing ? (
              <input value={newAlias} onChange={e => setNewAlias(e.target.value)}
                className="profile-alias-input" maxLength={30} />
            ) : (
              <h1 className="profile-alias">{profile.alias}</h1>
            )}
            <span className={`role-badge role-${profile.role}`}>
              {SITE_CONFIG.roles[profile.role?.toUpperCase()]?.label}
            </span>
          </div>

          {isOwnProfile && (
            editing ? (
              <div className="profile-edit-actions">
                <button className="btn-primary-sm" onClick={saveEdit} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <><Check size={14} /> Guardar</>}
                </button>
                <button className="btn-secondary-sm" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancelar
                </button>
              </div>
            ) : (
              <button className="btn-secondary-sm" onClick={startEdit}>
                <Edit2 size={14} /> Editar perfil
              </button>
            )
          )}
        </div>
      </div>

      {editing && (
        <div className="profile-edit-form">
          <div className="form-group">
            <label>Bio</label>
            <textarea value={newBio} onChange={e => setNewBio(e.target.value)}
              placeholder="Cuéntanos algo sobre ti…" rows={3} maxLength={200} className="form-input" />
          </div>
          <div className="form-group">
            <label>Color de perfil</label>
            <div className="color-picker">
              {THEME_COLORS.map(c => (
                <button key={c} className={`color-swatch ${newColor === c ? "color-swatch-active" : ""}`}
                  style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
              ))}
            </div>
          </div>
          {error   && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
        </div>
      )}

      {!editing && profile.bio && <p className="profile-bio">{profile.bio}</p>}

      <div className="profile-posts-section">
        <h2>Publicaciones</h2>
        {posts.length === 0
          ? <p className="empty-state">No hay publicaciones públicas.</p>
          : posts.map(p => (
              <div key={p.id} className="profile-post-preview">{p.content.slice(0, 120)}…</div>
            ))
        }
      </div>
    </div>
  );
}

// Colores de perfil disponibles
const THEME_COLORS = [
  "#2563eb","#7c3aed","#db2777","#dc2626","#ea580c",
  "#16a34a","#0891b2","#0d9488","#64748b","#1e293b",
];

export default function ProfilePage() {
  const { alias }    = useParams();
  const { session, profile: myProfile, isAdmin, refreshProfile } = useAuth();

  // Si no hay alias en URL, es el perfil propio
  const isOwnProfile = !alias || alias === myProfile?.alias;
  const [profile,  setProfile]  = useState(isOwnProfile ? myProfile : null);
  const [posts,    setPosts]    = useState([]);
  const [editing,  setEditing]  = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newBio,   setNewBio]   = useState("");
  const [newColor, setNewColor] = useState("");
  const [uploading,setUploading]= useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const fileRef = useRef(null);

  // Carga perfil por alias si es de otro usuario
  useState(() => {
    if (!isOwnProfile) {
      supabase.from("profiles").select("*").eq("alias", alias).single()
        .then(({ data }) => setProfile(data ?? null));
    } else {
      setProfile(myProfile);
    }
    if (profile) {
      supabase.from("posts").select("*")
        .eq("author_id", profile.id).eq("is_anonymous", false)
        .order("created_at", { ascending: false }).limit(20)
        .then(({ data }) => setPosts(data ?? []));
    }
  }, [alias, myProfile]);

  function startEdit() {
    setNewAlias(profile.alias);
    setNewBio(profile.bio ?? "");
    setNewColor(profile.theme_color ?? "#2563eb");
    setEditing(true);
    setError(""); setSuccess("");
  }

  async function saveEdit() {
    if (!isValidAlias(newAlias)) { setError("Alias inválido (3-30 chars, letras/números/._)"); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("profiles")
      .update({ alias: newAlias, bio: newBio, theme_color: newColor })
      .eq("id", session.user.id);
    if (err) setError(err.message);
    else {
      await refreshProfile();
      setProfile(p => ({ ...p, alias: newAlias, bio: newBio, theme_color: newColor }));
      setSuccess("Perfil actualizado correctamente.");
      setEditing(false);
    }
    setSaving(false);
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const url = await StorageService.upload(file, `avatars/${session.user.id}`);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      await refreshProfile();
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch (err) { setError(err.message); }
    setUploading(false);
  }

  if (!profile) {
    return (
      <div className="page-container">
        {!session ? (
          <div className="auth-prompt">
            <h2>Inicia sesión</h2>
            <p>Debes iniciar sesión para ver tu perfil.</p>
            <Link to="/auth" className="btn-primary">Iniciar sesión / Registrarse</Link>
          </div>
        ) : (
          <div className="empty-state"><Loader size={24} className="spin" /></div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      {/* Cabecera del perfil */}
      <div className="profile-header" style={{ "--profile-color": profile.theme_color ?? "#2563eb" }}>
        <div className="profile-banner" />

        <div className="profile-info">
          {/* Avatar */}
          <div className="profile-avatar-wrapper">
            <div
              className="profile-avatar"
              style={{
                backgroundColor: profile.theme_color ?? "#2563eb",
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : "none",
              }}
            >
              {!profile.avatar_url && profile.alias?.[0]?.toUpperCase()}
            </div>
            {isOwnProfile && (
              <>
                <button className="avatar-upload-btn" onClick={() => fileRef.current?.click()} title="Cambiar foto">
                  {uploading ? <Loader size={14} className="spin" /> : <Camera size={14} />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadAvatar} />
              </>
            )}
          </div>

          {/* Datos */}
          <div className="profile-details">
            {editing ? (
              <input
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                className="profile-alias-input"
                maxLength={30}
              />
            ) : (
              <h1 className="profile-alias">{profile.alias}</h1>
            )}
            <span className={`role-badge role-${profile.role}`}>
              {SITE_CONFIG.roles[profile.role?.toUpperCase()]?.label}
            </span>
          </div>

          {/* Botones de acción */}
          {isOwnProfile && (
            editing ? (
              <div className="profile-edit-actions">
                <button className="btn-primary-sm" onClick={saveEdit} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <><Check size={14} /> Guardar</>}
                </button>
                <button className="btn-secondary-sm" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancelar
                </button>
              </div>
            ) : (
              <button className="btn-secondary-sm" onClick={startEdit}>
                <Edit2 size={14} /> Editar perfil
              </button>
            )
          )}
        </div>
      </div>

      {/* Formulario de edición */}
      {editing && (
        <div className="profile-edit-form">
          <div className="form-group">
            <label>Bio</label>
            <textarea value={newBio} onChange={e => setNewBio(e.target.value)}
              placeholder="Cuéntanos algo sobre ti…" rows={3} maxLength={200} className="form-input" />
          </div>
          <div className="form-group">
            <label>Color de perfil</label>
            <div className="color-picker">
              {THEME_COLORS.map(c => (
                <button key={c} className={`color-swatch ${newColor === c ? "color-swatch-active" : ""}`}
                  style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
              ))}
            </div>
          </div>
          {error   && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
        </div>
      )}

      {/* Bio */}
      {!editing && profile.bio && (
        <p className="profile-bio">{profile.bio}</p>
      )}

      {/* Publicaciones */}
      <div className="profile-posts-section">
        <h2>Publicaciones</h2>
        {posts.length === 0
          ? <p className="empty-state">No hay publicaciones públicas.</p>
          : posts.map(p => <div key={p.id} className="profile-post-preview">{p.content.slice(0, 120)}…</div>)
        }
      </div>
    </div>
  );
}
