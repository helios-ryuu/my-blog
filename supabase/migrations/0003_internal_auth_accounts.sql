-- v0.9.0: internal username/password auth and admin-managed contest teams.

create extension if not exists pgcrypto;

drop trigger if exists trg_on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user() cascade;

alter table public.users drop constraint if exists users_auth_fk;
alter table public.users drop constraint if exists chk_display_name_len;
alter table public.users drop constraint if exists chk_bio_len;

alter table public.users add column if not exists password text;
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists phone text;

update public.users
set
    password = coalesce(password, username),
    full_name = coalesce(full_name, nullif(display_name, ''), username)
where password is null or full_name is null;

alter table public.users alter column id set default gen_random_uuid();
alter table public.users alter column password set not null;
alter table public.users alter column full_name set not null;

alter table public.users drop column if exists display_name;
alter table public.users drop column if exists bio;

alter table public.users drop constraint if exists chk_full_name_len;
alter table public.users drop constraint if exists chk_email_len;
alter table public.users drop constraint if exists chk_phone_len;
alter table public.users drop constraint if exists users_password_len;

alter table public.users
    add constraint chk_full_name_len check (char_length(full_name) between 1 and 100),
    add constraint chk_email_len check (email is null or char_length(email) <= 200),
    add constraint chk_phone_len check (phone is null or char_length(phone) <= 30),
    add constraint users_password_len check (char_length(password) >= 1);

alter table public.contest_registration add column if not exists team_code text;
alter table public.contest_registration add column if not exists level text;

update public.contest_registration
set team_code = coalesce(team_code, 'TEAM' || lpad(id::text, 5, '0'))
where team_code is null;

alter table public.contest_registration alter column team_code set not null;

create unique index if not exists uq_registration_team_code
    on public.contest_registration (contest_id, team_code);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select false;
$$;
