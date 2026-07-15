-- Migration 0004: contest team size ranges, stage prompts, and resubmit cleanup.

alter table public.contest
    add column if not exists min_team_size smallint not null default 1;

alter table public.contest_stage
    add column if not exists prompt_text text;

alter table public.contest_stage
    drop column if exists allow_resubmit;

alter table public.contest
    drop constraint if exists contest_team_size_check;

update public.contest
set
    min_team_size = 1,
    max_team_size = 1
where participation_type = 'individual';

update public.contest
set
    min_team_size = greatest(coalesce(min_team_size, 1), 2),
    max_team_size = greatest(coalesce(max_team_size, 1), greatest(coalesce(min_team_size, 1), 2))
where participation_type in ('team', 'both');

alter table public.contest
    add constraint contest_team_size_check check (
        (participation_type = 'individual' and min_team_size = 1 and max_team_size = 1) or
        (participation_type in ('team', 'both') and min_team_size >= 2 and max_team_size >= min_team_size)
    );
