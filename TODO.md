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

- [x] **Labels mal en "Ingresos por torneos" en Caja**. La sección reutiliza
  `CajaClassPaymentsSection` y muestra "Clase —" + badge "CLASES" en
  movimientos de torneos. Renombrar labels.

- [ ] **Fecha confusa en Caja**. Los movimientos muestran `paid_at` (cuándo se
  registró el cobro) en vez de `scheduled_at` (cuándo fue la clase). Mostrar
  las dos, o swapear y poner la otra en tooltip.

- [x] **Renombrar `WeekClasses` → `MonthClasses`**. El componente, el archivo
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

## Fase 5 — Modelo de pagos de torneo (NUEVO, descubierto 2026-05-12)

Problemas estructurales descubiertos al fixear el botón 🗑 de Caja en torneos.
Requiere migración + refactor de actions. **NO atacar sin reservar tiempo.**

### Bugs identificados

- [ ] **`registerTournamentPayment` no filtra por `category_id`.** Cuando un
  alumno está inscripto en múltiples categorías del mismo torneo, marca todas
  como pagadas pero solo crea 1 fila en `payments`. Caso real: Ceci Maldonado
  pagó solo la 5ta y el sistema marcó como pagada también la 6ta.

- [ ] **`payments` no tiene `category_id` ni `tournament_id`.** Imposibilita
  saber qué categoría/torneo específico corresponde a cada pago. Solo se puede
  filtrar por `student_id + type='tournament'`, ambiguo cuando hay múltiples
  categorías.

- [ ] **`deleteTournamentPayment` (Caja) no sincroniza `tournament_students`.**
  El botón 🗑 borra de `payments` pero deja `tournament_students.payment_status`
  como `paid` huérfano. Recíproco del bug original que tenía el botón viejo.

- [ ] **Inconsistencia precio de categoría vs amount real.** La página del
  torneo muestra "Cobrado" sumando `tournament_categories.price_cents` de
  categorías con `payment_status='paid'`. Caja muestra el `amount_cents` real
  de `payments`. Si alguien cargó un pago por monto distinto al precio (parcial,
  ajuste, error), los totales no matchean. Caso real: 5ta Palermo precio $50.000
  pero el `amount_cents` en payments es $20.000 → página dice $50k, Caja dice $20k.

- [ ] **`deleteTournament` matchea pagos por texto en `notes`.** Como
  `payments` no tiene FK a `tournaments`, el borrado en cascada de pagos al
  eliminar un torneo se hace con `WHERE type='tournament' AND notes LIKE
  'TORNEO — <name> · %'`. Frágil ante rename del torneo entre crear el pago
  y borrarlo. Cuando se implemente la migración (agregar `tournament_id` a
  `payments`), refactorizar `deleteTournament` para usar la FK en vez del
  matching de texto.

### Fix propuesto

1. Migración SQL:
   - Agregar `category_id` y `tournament_id` (nullable) a `payments`
   - Backfill: matchear cada fila existente con su `tournament_students`
     correspondiente
2. Refactor `registerTournamentPayment`: agregar parámetro `categoryId`,
   filtrar el UPDATE de tournament_students por ese id
3. Pasar `categoryId` desde el `payAction` en la página del torneo
4. Refactor `deleteTournamentPayment`: tomar el `payment_id`, leer su
   `tournament_id` y `category_id`, y hacer UPDATE coherente en
   `tournament_students` antes del DELETE
5. Considerar también: ¿`deleteTournamentPayment` debería deshabilitarse desde
   Caja y forzar que se anulen pagos solo desde la página del torneo?
6. Decidir cuál fuente es la verdad para "cobrado de torneo": el precio de
   categoría (suma de paid) o el amount real (suma de payments).

## Contactos — flujo "Agregar a clase"

- [ ] **Crear clase desde "Agregar a clase" en Contactos.** Hoy, si no hay
  clases disponibles este mes para asignar al alumno, el flujo te obliga a
  ir al dashboard, crear la clase, volver a Contactos, y reintentar. Sería
  más natural permitir crear una clase nueva desde el mismo modal. Decisión
  de UX: ¿modal anidado, redirección al dashboard con contexto del alumno
  preseleccionado, o un mini-form inline?

## Fase 6 — Recurrencia de clases (NUEVO, especificado 2026-05-12)

Hoy el modal "Alta de Alumno" pide día/hora/club como "agenda semanal"
pero esa info se guarda en `schedules` (modelo viejo) y no genera clases
automáticamente. Resultado: trampa de UX, el usuario asigna agenda y nunca
ve nada. La sección está oculta del modal hasta implementar esto.

### Spec (decidido con Rodrigo / Fede el 2026-05-12)

Al crear alumno con agenda "Lunes 10:00 Cuarto Club":

- Crear 4 filas en `classes`, una por cada lunes próximo (4 semanas adelante)
- Para cada clase: agregar fila en `class_students` con ese alumno
- `price_cents` = `students.price_per_class_cents`

Si una clase pasa y el alumno faltó:

- La clase NO se borra
- `class_students.attendance = 'no_show'` (se marca desde el dashboard)
- `class_students.paid = false`

Si cambia el día/hora del alumno:

- Las clases ya creadas quedan tal cual
- El usuario las edita/elimina manualmente desde el dashboard

Clase puntual (fuera de recurrencia):

- Flujo existente: botón "+ Nueva clase" del dashboard

### Cosas a definir antes de implementar

- [ ] ¿Cómo se renuevan las clases una vez que pasan? ¿Job que crea las
  próximas 4 cada semana? ¿Manual cuando se acaban?
- [ ] ¿Qué pasa si una clase grupal ya existe en ese día/hora/club?
  ¿Se agrega el alumno a la existente o se crea una nueva?
- [ ] Migración de los 9 registros existentes en `schedules` que quedaron
  huérfanos del modelo viejo (decidir caso por caso)
- [ ] Cuando se elimina o desactiva un alumno: ¿qué pasa con sus clases
  futuras pendientes?
- [ ] Restaurar la sección "Agenda Semanal" en AddStudentModal
