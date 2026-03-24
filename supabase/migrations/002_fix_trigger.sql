-- ============================================================
--  FIX: "Database error saving new user"
--  Corre esto en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Elimina el trigger y la función anterior por si tienen conflicto
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Elimina la política que puede bloquear el insert inicial
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_public_read" on public.profiles;

-- 3. Recrea las políticas correctamente
create policy "profiles_public_read" on public.profiles
  for select using (true);

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Permite que el sistema (trigger) inserte perfiles nuevos
create policy "profiles_insert_own" on public.profiles
  for insert with check (true);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 4. Recrea la función con SECURITY DEFINER para saltarse RLS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alias text;
begin
  -- Genera un alias único si no viene en los metadatos
  v_alias := coalesce(
    new.raw_user_meta_data->>'alias',
    'user_' || substring(replace(new.id::text, '-', ''), 1, 8)
  );

  -- Asegura que el alias no exista ya
  while exists (select 1 from public.profiles where alias = v_alias) loop
    v_alias := v_alias || '_' || floor(random() * 100)::text;
  end loop;

  insert into public.profiles (id, email, full_name, alias, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    v_alias,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  );

  return new;
exception
  when others then
    -- Muestra el error real en los logs de Supabase
    raise log 'handle_new_user error: % %', sqlerrm, sqlstate;
    return new;
end;
$$;

-- 5. Vuelve a crear el trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
