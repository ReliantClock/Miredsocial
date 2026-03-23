-- ============================================================
--  SOCIALLY — Esquema completo de Supabase
--  Ejecutar en el SQL Editor de Supabase en orden.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ── Enum: roles ───────────────────────────────────────────────
create type user_role as enum ('user', 'manager', 'admin');
create type forum_type as enum ('public', 'invite_only', 'private');
create type post_section as enum ('home', 'news', 'community');

-- ============================================================
--  TABLA: profiles
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null,                -- nombre real (solo admin puede ver/editar)
  alias         text not null unique,         -- nombre público visible
  avatar_url    text,
  bio           text,
  role          user_role not null default 'user',
  theme_color   text default '#2563eb',       -- color de perfil personalizable
  is_banned     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger para updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure update_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Cualquiera puede leer alias, avatar, bio (datos públicos)
create policy "profiles_public_read" on public.profiles
  for select using (true);

-- El usuario puede actualizar solo sus propios campos permitidos
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- email y full_name NO se pueden cambiar vía cliente (solo admin en panel)
  );

-- Solo admins pueden insertar/borrar/ver full_name
create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
--  TABLA: groups  (colegios / instituciones)
-- ============================================================
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  logo_url    text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "groups_read_all" on public.groups for select using (true);
create policy "groups_admin_manage" on public.groups
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── Miembros de grupo (encargados) ───────────────────────────
create table public.group_members (
  group_id   uuid references public.groups(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;
create policy "gm_read" on public.group_members for select using (true);
create policy "gm_admin" on public.group_members for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
);

-- ============================================================
--  TABLA: forums  (comunidades / foros)
-- ============================================================
create table public.forums (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  type        forum_type not null default 'public',
  is_anonymous boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.forums enable row level security;
create policy "forums_read_public" on public.forums
  for select using (type = 'public' or type = 'invite_only');
create policy "forums_manage_admin" on public.forums for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "forums_create_any" on public.forums for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager','user'))
);

-- ── Miembros de foro ──────────────────────────────────────────
create table public.forum_members (
  forum_id uuid references public.forums(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  primary key (forum_id, user_id)
);
alter table public.forum_members enable row level security;
create policy "fm_read" on public.forum_members for select using (
  user_id = auth.uid() or
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "fm_insert" on public.forum_members for insert with check (user_id = auth.uid());
create policy "fm_delete" on public.forum_members for delete using (
  user_id = auth.uid() or
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================
--  TABLA: posts
-- ============================================================
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references public.profiles(id) on delete cascade,
  section      post_section not null default 'home',
  group_id     uuid references public.groups(id) on delete set null,
  forum_id     uuid references public.forums(id) on delete set null,
  content      text not null check (char_length(content) <= 1000),
  media_url    text,
  is_anonymous boolean not null default false,
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure update_updated_at();

alter table public.posts enable row level security;

-- Todos pueden leer
create policy "posts_read_all" on public.posts for select using (true);

-- Usuarios autenticados pueden crear en home o community
create policy "posts_insert_user" on public.posts for insert with check (
  auth.uid() is not null
  and (
    section = 'home'
    or section = 'community'
    or (
      section = 'news' and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin', 'manager')
      )
    )
  )
);

-- Author puede borrar su propio post; manager borra en su grupo; admin borra todo
create policy "posts_delete" on public.posts for delete using (
  author_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or (
    section = 'news'
    and exists (
      select 1 from public.group_members gm
      join public.profiles p on p.id = auth.uid()
      where gm.user_id = auth.uid()
        and gm.group_id = posts.group_id
        and p.role = 'manager'
    )
  )
);

-- ============================================================
--  TABLA: comments
-- ============================================================
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.posts(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) <= 500),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;
create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() is not null);
create policy "comments_delete" on public.comments for delete using (
  author_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager'))
);

-- ============================================================
--  TABLA: reactions  (likes / reacciones)
-- ============================================================
create table public.reactions (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  type       text not null default 'like',
  primary key (post_id, user_id)
);

alter table public.reactions enable row level security;
create policy "reactions_read" on public.reactions for select using (true);
create policy "reactions_insert" on public.reactions for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "reactions_delete" on public.reactions for delete using (user_id = auth.uid());

-- ============================================================
--  TABLA: notifications
-- ============================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  type        text not null,   -- 'comment', 'reaction', 'mention', 'invite'
  payload     jsonb,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "notif_own" on public.notifications for all using (user_id = auth.uid());

-- ============================================================
--  TABLA: audit_log  (para administradores)
-- ============================================================
create table public.audit_log (
  id          bigserial primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_log enable row level security;
create policy "audit_admin_only" on public.audit_log for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================
--  STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  10485760,   -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4']
)
on conflict (id) do nothing;

-- Cualquier usuario autenticado puede subir a su propia carpeta
create policy "storage_upload" on storage.objects for insert with check (
  bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "storage_read" on storage.objects for select using (bucket_id = 'media');
create policy "storage_delete" on storage.objects for delete using (
  bucket_id = 'media' and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

-- ============================================================
--  FORO ANÓNIMO PREDETERMINADO
-- ============================================================
insert into public.forums (name, slug, description, type, is_anonymous)
values ('Anónimo', 'anonimo', 'Publica sin mostrar tu identidad', 'public', true)
on conflict (slug) do nothing;

-- ============================================================
--  FUNCIÓN: nuevo usuario → crear perfil automáticamente
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, alias, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'alias', 'user_' || substring(new.id::text, 1, 8)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
