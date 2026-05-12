---

# TODO

Seguimiento de pendientes después del rediseño del ciclo de vida de clase
(commits `1a677d5` + `0b59692`, 2026-05-12).

## Fase 2 — Bugs de data

Son UPDATE/DELETE puntuales en Supabase, no tocan código. Cada uno requiere
confirmación con Rodrigo antes de ejecutar.

- [ ] **Clase duplicada el 02/06**. Hay dos clases distintas el martes 2 de
  junio, 09:00–11:00, en Cuba Villa de Mayo, con alumnos distintos (Ceci+Cecilia
  vs Ceci+Clara+Daniel). Confirmar con Rodrigo cuál es la válida y borrar la otra.

- [ ] **Pagos de $200 a Alejandro en Torneo Pellegrini**. Hay 2 filas en
  `payments` con `amount_cents = 20000` (= $200), parece typo de $20.000
  (que sería `2000000`). Verificar con Rodrigo si corregir o eliminar.

## Fase 3 — Cosméticos

- [ ] **Labels mal en "Ingresos por torneos" en Caja**. La sección reutiliza
  `CajaClassPaymentsSection` y muestra "Clase —" + badge "CLASES" en
  movimientos de torneos. Renombrar labels.

- [ ] **Fecha confusa en Caja**. Los movimientos muestran `paid_at` (cuándo se
  registró el cobro) en vez de `scheduled_at` (cuándo fue la clase). Mostrar
  las dos, o swapear y poner la otra en tooltip.

- [ ] **Renombrar `WeekClasses` → `MonthClasses`**. El componente, el archivo
  y la variable `weekClassesRes` en `page.tsx` se llaman "week" pero filtran
  por mes completo. Confunde.

- [ ] **Calendario sin indicador de overdue**. El calendario muestra todas
  las clases del mismo color verde. Agregar badge/color para días con clases
  pendientes de cierre.

## Fase 4 — Preguntas para Rodrigo (decisiones de producto)

- [ ] **Política de precios de clase**. ¿`classes.price_cents` se carga
  manual cada vez, se deriva de `students.price_per_class_cents`, o es
  híbrido (default desde alumno con override manual)?

- [ ] **Clase de 3h30 del 10/05 con 5 alumnos**. ¿Es clase real o torneo
  mal cargado en la tabla `classes`? Si fuera torneo, debería estar en
  `tournaments`.

- [ ] **Clases grupales paralelas en el mismo club**. ¿Es válido tener
  dos clases distintas a la misma hora en el mismo club (varias canchas
  en simultáneo) o es siempre un duplicado a corregir? Define si el caso
  del 02/06 es bug o feature válido.

## Schema cleanup (sin urgencia)

- [ ] **`payment_classes` (2 cols)**. Parece junction muerta del modelo
  anterior. Verificar que nada en código la usa y dropearla.

- [ ] **`schedules`, `availability_slots`, `class_exceptions`**. Confirmar
  si están en uso o son fósiles del modelo viejo. `page.tsx` todavía las
  fetchea pero solo alimentan código bajo `{false && (...)}`.

- [ ] **`class_students.payment_method` es `text` libre**. Convertir a enum
  `('cash' | 'transfer' | 'mp')` con check constraint o tipo dedicado.

- [ ] **Bloque muerto en `page.tsx`**. Sacar las queries (`schedulesRes`,
  `paymentsRes`, `availabilityRes`) y el bloque `{false && (...)}` con sus
  imports (`HourlyGrid`, `PaymentButton`, `whatsappLink`). Reduce carga de
  cada render del dashboard.

- [ ] **Regenerar tipos de Supabase**. Correr `supabase gen types typescript`
  después de la migración. Permite sacar los `as any` en `updateClassStatus`
  (`status: input.status as any`) y `markStudentAttendance`
  (`attendance: input.attendance as any`).
