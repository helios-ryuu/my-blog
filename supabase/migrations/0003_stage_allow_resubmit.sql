-- Migration 0003: add allow_resubmit flag to contest_stage
-- Controls whether a team can replace their submission after the first upload.
-- Default false = one submission per registration.

alter table public.contest_stage
    add column if not exists allow_resubmit boolean not null default false;
