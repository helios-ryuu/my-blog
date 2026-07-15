-- Migration 0001: Add length constraints to user profile fields (FR_USER_05)
-- Safe to apply: only rejects future writes that exceed the limits.
-- Apply via Supabase SQL editor.

alter table public.users
    add constraint chk_display_name_len check (display_name is null or char_length(display_name) <= 100) not valid,
    add constraint chk_bio_len          check (bio          is null or char_length(bio)          <= 500) not valid,
    add constraint chk_school_len       check (school       is null or char_length(school)       <= 200) not valid;

-- Validate existing rows (will fail loudly if any historical row violates the limits).
alter table public.users validate constraint chk_display_name_len;
alter table public.users validate constraint chk_bio_len;
alter table public.users validate constraint chk_school_len;
