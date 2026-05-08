'use client'

import { useEffect, useMemo, useState } from 'react'
import { AssignContactToSlotModal } from '@/components/dashboard/AssignContactToSlotModal'
import { StudentDetailModal, type StudentProps } from '@/components/dashboard/StudentDetailModal'

/** Hardcoded por club_id — cliente único Padel Sartori. Mover a tabla clubs.color_token cuando soportemos multi-tenant. */
const CLUB_COLORS: Record<string, string> = {
  '7b562e56-3e57-4280-90f2-0f70d7da6961': 'border-sky-500/35 bg-sky-950/25 text-sky-200',
  'f26cf144-fe73-4445-ad11-8740f6acfaa0': 'border-fuchsia-500/35 bg-fuchsia-950/25 text-fuchsia-200',
  'bed9a055-e43f-48f6-b166-244eb351af1f': 'border-amber-400/35 bg-amber-950/25 text-amber-200',
}

function clubTagStyles(clubId: string) {
  return CLUB_COLORS[clubId] ?? 'border-slate-700 bg-slate-950 text-slate-200'
}

export type HourlyGridClub = {
  id: string
  name: string
}

export type HourlyGridStudent = {
  id: string
  full_name: string
  phone: string
  level: string
  price_per_class_cents: number
  club_id: string
  active?: boolean
}

export type HourlyGridSchedule = {
  id: string
  student_id: string
  club_id: string
  day_of_week: number
  start_time: string
  end_time: string
  students: HourlyGridStudent | null
  clubs: { name: string } | null
}

export type HourlyGridAvailabilitySlot = {
  club_id: string
  day_of_week: number
  start_time: string
  active: boolean
  duration_minutes: number
}

export type HourlyGridPayment = {
  student_id: string
}

export type HourlyGridProps = {
  clubs: HourlyGridClub[]
  schedules: HourlyGridSchedule[]
  availabilitySlots: HourlyGridAvailabilitySlot[]
  paymentsThisMonth: HourlyGridPayment[]
  selectedClubId: string | null
}

const DAY_COLUMNS: Array<{ label: string; dow: number }> = [
  { label: 'Lun', dow: 1 },
  { label: 'Mar', dow: 2 },
  { label: 'Mié', dow: 3 },
  { label: 'Jue', dow: 4 },
  { label: 'Vie', dow: 5 },
  { label: 'Sáb', dow: 6 },
  { label: 'Dom', dow: 0 },
]

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8)

function toHHMM(t: string) {
  return t.length >= 5 ? t.slice(0, 5) : t
}

function hourNumToHHMM(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function scheduleKey(clubId: string, dayOfWeek: number, startHHMM: string) {
  return `${clubId}|${dayOfWeek}|${startHHMM}`
}

function isWorkingHour(
  clubId: string,
  dayOfWeek: number,
  startHHMM: string,
  clubsWithAvailability: Set<string>,
  availableByKey: Map<string, true>,
) {
  if (!clubsWithAvailability.has(clubId)) return true
  return availableByKey.has(scheduleKey(clubId, dayOfWeek, startHHMM))
}

export function HourlyGrid({
  clubs,
  schedules,
  availabilitySlots,
  paymentsThisMonth,
  selectedClubId,
}: HourlyGridProps) {
  const paidStudentIds = useMemo(
    () => new Set(paymentsThisMonth.map((p) => p.student_id)),
    [paymentsThisMonth],
  )

  const { schedulesByKey, availableByKey, clubsWithAvailability } = useMemo(() => {
    const schedulesByKey = new Map<string, HourlyGridSchedule[]>()

    for (const s of schedules) {
      const startHHMM = toHHMM(s.start_time)
      const key = scheduleKey(s.club_id, s.day_of_week, startHHMM)
      const prev = schedulesByKey.get(key) ?? []
      if (prev.length >= 1 && process.env.NODE_ENV !== 'production') {
        console.warn('[HourlyGrid] schedule duplicado en clave', key)
      }
      prev.push(s)
      schedulesByKey.set(key, prev)
    }

    const availableByKey = new Map<string, true>()
    const clubsWithAvailability = new Set<string>()

    for (const slot of availabilitySlots) {
      // TODO: soporte multi-duración cuando sea necesario
      if (slot.duration_minutes !== 60) continue
      if (!slot.active) continue

      clubsWithAvailability.add(slot.club_id)
      const startHHMM = toHHMM(slot.start_time)
      availableByKey.set(scheduleKey(slot.club_id, slot.day_of_week, startHHMM), true)
    }

    return { schedulesByKey, availableByKey, clubsWithAvailability }
  }, [schedules, availabilitySlots])

  const [assignModal, setAssignModal] = useState<null | {
    dayOfWeek: number
    startTime: string
    clubId: string
    clubName: string
  }>(null)

  const [studentModal, setStudentModal] = useState<{ student: StudentProps } | null>(null)

  useEffect(() => {
    setAssignModal(null)
    setStudentModal(null)
  }, [selectedClubId])

  function openStudentModal(scheduleRow: HourlyGridSchedule) {
    const st = scheduleRow.students
    if (!st) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[HourlyGrid] schedule sin student (JOIN roto)', scheduleRow.id)
      }
      return
    }

    const allForStudent = schedules.filter((s) => s.student_id === st.id)

    const modalSchedules = allForStudent.map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      club_id: s.club_id,
      clubs: s.clubs ?? null,
    }))

    setStudentModal({
      student: {
        id: st.id,
        full_name: st.full_name,
        phone: st.phone,
        price_per_class_cents: st.price_per_class_cents,
        level: st.level,
        club_id: st.club_id,
        schedules: modalSchedules,
      },
    })
  }

  function renderOccupiedCell(entries: HourlyGridSchedule[], isAllClubs: boolean) {
    const overflowMore = isAllClubs && entries.length > 3 ? entries.length - 3 : 0
    const visibleEntries = isAllClubs && entries.length > 3 ? entries.slice(0, 3) : entries

    const outerCellClasses = [
      'border-b border-l border-slate-800/80 bg-slate-950/20 p-2 min-h-[56px]',
    ].join(' ')

    return (
      <div className={outerCellClasses}>
        <div
          className={
            isAllClubs
              ? 'max-h-[112px] overflow-hidden space-y-1'
              : 'space-y-1.5'
          }
        >
          {visibleEntries.map((row) => {
            const st = row.students
            const clubName = row.clubs?.name ?? clubs.find((x) => x.id === row.club_id)?.name ?? 'Sede'
            const paid = st ? paidStudentIds.has(st.id) : false

            if (isAllClubs) {
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openStudentModal(row)}
                  className={[
                    'w-full flex items-center justify-between gap-2 rounded-xl border px-2 py-1 transition-colors hover:bg-slate-900/60',
                    'text-[10px] font-black text-slate-50',
                    clubTagStyles(row.club_id),
                  ].join(' ')}
                >
                  <span className="min-w-0 truncate text-left">
                    {!st ? (
                      <span className="text-[8px] font-black uppercase tracking-tight text-rose-300">
                        DATO CORRUPTO
                      </span>
                    ) : (
                      st.full_name
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] leading-none tabular-nums" aria-hidden>
                    {st ? (paid ? '✓' : '✗') : '—'}
                  </span>
                </button>
              )
            }

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => openStudentModal(row)}
                className={[
                  'w-full text-left rounded-xl border px-2 py-1.5 transition-colors hover:bg-slate-900/60',
                  clubTagStyles(row.club_id),
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {!st ? (
                      <span className="inline-block rounded-md border border-rose-500/40 bg-rose-950/40 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-rose-300">
                        DATO CORRUPTO
                      </span>
                    ) : (
                      <div className="truncate text-[10px] font-black uppercase italic tracking-tight text-slate-50">
                        {st.full_name}
                      </div>
                    )}
                    <div className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-slate-400/90 truncate">
                      {clubName}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] leading-none" aria-hidden>
                    {st ? (paid ? '✓' : '✗') : '—'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {overflowMore > 0 && (
          <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">
            +{overflowMore} más
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div
            className="min-w-[900px] grid"
            style={{
              gridTemplateColumns: `72px repeat(${DAY_COLUMNS.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 bg-slate-950 border-b border-r border-slate-800 p-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Hora
            </div>
            {DAY_COLUMNS.map((d) => (
              <div
                key={d.dow}
                className="border-b border-slate-800 p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
              >
                {d.label}
              </div>
            ))}

            {HOURS.map((hour) => {
              const hhmm = hourNumToHHMM(hour)
              return (
                <div key={hour} className="contents">
                  <div className="sticky left-0 z-10 bg-slate-950 border-r border-b border-slate-800 p-3 text-[10px] font-black text-slate-500 tabular-nums">
                    {hhmm}
                  </div>

                  {DAY_COLUMNS.map(({ dow }) => {
                    const isAllClubs = selectedClubId === null

                    if (isAllClubs) {
                      const entries = clubs.flatMap(
                        (c) => schedulesByKey.get(scheduleKey(c.id, dow, hhmm)) ?? [],
                      )

                      if (entries.length === 0) {
                        return (
                          <div
                            key={`${hour}-${dow}-all-empty`}
                            className="border-b border-l border-slate-800/80 bg-slate-950/35 p-2 min-h-[56px]"
                            title="Filtrá por sede para asignar"
                          />
                        )
                      }

                      return (
                        <div key={`${hour}-${dow}-all`}>{renderOccupiedCell(entries, true)}</div>
                      )
                    }

                    const clubId = selectedClubId
                    const entries = schedulesByKey.get(scheduleKey(clubId, dow, hhmm)) ?? []
                    const clubName = clubs.find((c) => c.id === clubId)?.name ?? 'Sede'

                    if (entries.length > 0) {
                      return (
                        <div key={`${hour}-${dow}-one`}>
                          {renderOccupiedCell(entries, false)}
                        </div>
                      )
                    }

                    const working = isWorkingHour(clubId, dow, hhmm, clubsWithAvailability, availableByKey)

                    if (working) {
                      return (
                        <div key={`${hour}-${dow}-free`} className="border-b border-l border-slate-800/80 p-2 min-h-[56px]">
                          <button
                            type="button"
                            title="Asignar alumno"
                            onClick={() =>
                              setAssignModal({
                                dayOfWeek: dow,
                                startTime: hhmm,
                                clubId,
                                clubName,
                              })
                            }
                            className={[
                              'group relative w-full h-full min-h-[48px] rounded-2xl border border-dashed transition-colors',
                              'border-[#bdfd2c]/55 bg-slate-950/25 hover:bg-[#bdfd2c]/10',
                            ].join(' ')}
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-gray-950/80 /70 text-lg font-black opacity-0 group-hover:opacity-100 transition-opacity">
                              +
                            </span>
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${hour}-${dow}-off`}
                        className="border-b border-l border-slate-800/80 bg-slate-950/55 p-2 min-h-[56px]"
                        title="Fuera de horario laboral"
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {assignModal && (
        <AssignContactToSlotModal
          open
          onClose={() => setAssignModal(null)}
          dayOfWeek={assignModal.dayOfWeek}
          startTime={assignModal.startTime}
          clubId={assignModal.clubId}
          clubName={assignModal.clubName}
        />
      )}

      {studentModal && (
        <StudentDetailModal
          isOpen
          onClose={() => setStudentModal(null)}
          student={studentModal.student}
          clubs={clubs}
        />
      )}
    </div>
  )
}
