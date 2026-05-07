-- Drop de tablas huérfanas que quedaron del schema original.
-- Verificado el 2026-05-07:
--   - 0 matches en src/ y scripts/ (grep)
--   - 0 filas en ambas tablas
--   - 0 foreign keys apuntando hacia ellas
-- Las tablas no se implementaron nunca y no las usa ningún módulo.

drop table if exists public.week_classes cascade;
drop table if exists public.pending_reminders cascade;

