-- Drop recurring_schedules: tabla huérfana del schema
-- original. Confirmado: 0 filas en producción y 0
-- referencias en código. La fuente de verdad de
-- horarios es la tabla 'schedules'.
drop table if exists recurring_schedules cascade;

