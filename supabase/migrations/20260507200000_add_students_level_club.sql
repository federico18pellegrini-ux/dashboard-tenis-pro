-- Add student level and club_id for filtering/UI badges.
-- Mirrors SQL intended for Supabase SQL Editor.

alter table public.students
  add column if not exists level text check (level in ('principiante', 'intermedio', 'avanzado')),
  add column if not exists club_id uuid references public.clubs(id);

