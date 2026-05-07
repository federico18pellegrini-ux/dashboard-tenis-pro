-- Add UNIQUE constraint for availability upserts
-- Required by saveAvailability() onConflict: club_id,day_of_week,start_time
alter table public.availability_slots
  add constraint availability_slots_unique
  unique (club_id, day_of_week, start_time);

