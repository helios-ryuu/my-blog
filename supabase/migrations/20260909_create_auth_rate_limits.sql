-- Migration: Create auth_rate_limits table for brute-force protection
-- Description: Stores IP-based attempt counts, escalation level (15m -> 60m lockout), and timestamps.

create table if not exists public.auth_rate_limits (
    ip text primary key,
    attempt_count int not null default 0,
    escalation_level int not null default 0,
    locked_until timestamptz,
    last_attempt_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.auth_rate_limits enable row level security;

-- Create indexes for quick lookup
create index if not exists idx_auth_rate_limits_locked_until on public.auth_rate_limits (locked_until);
create index if not exists idx_auth_rate_limits_last_attempt on public.auth_rate_limits (last_attempt_at);
