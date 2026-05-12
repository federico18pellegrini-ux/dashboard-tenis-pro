-- Rediseño del ciclo de vida de la clase.
-- - Simplifica enum class_status: 7 valores ('scheduled', 'reminder_sent',
--   'confirmed', 'cancelled_by_student', 'cancelled_by_coach', 'completed',
--   'no_show') → 3 valores ('scheduled', 'completed', 'cancelled').
-- - Agrega columna `attendance` a class_students con enum attendance_status
--   ('pending', 'attended', 'no_show'). La asistencia ahora se trackea por
--   alumno (cada alumno de una clase grupal puede tener asistencia distinta),
--   no por clase.
-- - Dropea view `week_classes` (código muerto: el frontend lee classes
--   directo con nested select).
-- - Recrea view `pending_reminders` y el índice parcial
--   `idx_classes_pending_reminders` después del swap del enum.
--
-- Verificado pre-migración (2026-05-12):
-- - Las 5 filas de classes están todas en status='scheduled'
-- - Cero filas en class_students con attendance previo (la columna no existía)
-- - Una sola RLS policy sobre classes (auth_full_classes), no menciona status
-- - Dos índices sobre status: idx_classes_status (btree simple, se reconstruye
--   solo) e idx_classes_pending_reminders (índice parcial, hay que recrearlo)

-- 1. Drop view e índice parcial que dependen de classes.status
DROP VIEW IF EXISTS pending_reminders;
DROP VIEW IF EXISTS week_classes;
DROP INDEX IF EXISTS idx_classes_pending_reminders;

-- 2. Attendance por alumno
CREATE TYPE attendance_status AS ENUM ('pending', 'attended', 'no_show');

ALTER TABLE class_students
  ADD COLUMN attendance attendance_status NOT NULL DEFAULT 'pending';

-- 3. Migrar class_status (7 → 3 valores) vía text intermedio
ALTER TABLE classes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE classes ALTER COLUMN status TYPE text USING status::text;

DROP TYPE class_status;

CREATE TYPE class_status AS ENUM ('scheduled', 'completed', 'cancelled');

ALTER TABLE classes 
  ALTER COLUMN status TYPE class_status 
  USING status::class_status;

ALTER TABLE classes ALTER COLUMN status SET DEFAULT 'scheduled';

-- 4. Recrear índice parcial idéntico
CREATE INDEX idx_classes_pending_reminders 
  ON public.classes USING btree (scheduled_at) 
  WHERE ((status = 'scheduled'::class_status) AND (reminder_sent_at IS NULL));

-- 5. Recrear view pending_reminders
CREATE VIEW pending_reminders AS
SELECT 
  c.id AS class_id,
  c.scheduled_at,
  c.price_cents,
  s.id AS student_id,
  s.full_name,
  s.phone,
  cl.name AS club_name
FROM classes c
JOIN class_students cs ON cs.class_id = c.id
JOIN students s        ON s.id = cs.student_id
JOIN clubs cl          ON cl.id = c.club_id
WHERE c.status = 'scheduled'::class_status
  AND c.reminder_sent_at IS NULL
  AND c.scheduled_at::date = (CURRENT_DATE + '2 days'::interval)::date
ORDER BY c.scheduled_at;
