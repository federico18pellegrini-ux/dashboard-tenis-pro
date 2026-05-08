'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type CalendarClassChip = {
  id: string
  scheduledAt: string
  timeShort: string
  timeRangeLabel: string
  dateLabel: string
  clubAbbrev: string
  clubFull: string
  status: string
  studentNames: string[]
  totalCobradoCents: number
}

const DOW_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function dayKeyLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildWeekCells(year: number, month1to12: number): Date[] {
  const first = new Date(year, month1to12 - 1, 1)
  const dow = first.getDay()
  const mondayOffset = (dow + 6) % 7
  const start = new Date(year, month1to12 - 1, 1 - mondayOffset)
  const cells: Date[] = []
  const cur = new Date(start)
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return cells
}

function chipStyles(status: string) {
  if (status === 'cancelled_by_coach' || status === 'cancelled_by_student') {
    return 'bg-rose-950/80 text-rose-100 border-rose-800/60'
  }
  if (status === 'completed') {
    return 'bg-slate-700/50 text-slate-200 border-slate-600/50'
  }
  return 'bg-emerald-950/90 text-emerald-100 border-emerald-800/60'
}

export function CalendarMonthGrid({
  year,
  month,
  classesByDay,
}: {
  year: number
  month: number
  classesByDay: Record<string, CalendarClassChip[]>
}) {
  const cells = useMemo(() => buildWeekCells(year, month), [year, month])
  const today = new Date()
  const todayKey = dayKeyLocal(today)

  const [openId, setOpenId] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const openClass = classesByDay && openId ? Object.values(classesByDay).flat().find((c) => c.id === openId) : null

  const close = useCallback(() => {
    setOpenId(null)
    setPopoverPos(null)
  }, [])

  useEffect(() => {
    if (!openId) return
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      const chip = (e.target as HTMLElement).closest?.('[data-calendar-chip]')
      if (chip) return
      close()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [openId, close])

  function onChipClick(e: React.MouseEvent, c: CalendarClassChip) {
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const w = Math.min(280, window.innerWidth - 16)
    let left = r.left + r.width / 2 - w / 2
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
    const top = r.bottom + 6 + window.scrollY
    setPopoverPos({ top: r.bottom + 6, left, width: w })
    setOpenId(c.id)
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="bg-slate-950/80 py-2 text-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800"
          >
            {d}
          </div>
        ))}

        {cells.map((cellDate, idx) => {
          const key = dayKeyLocal(cellDate)
          const inMonth = cellDate.getMonth() === month - 1
          const isToday = key === todayKey
          const dayNum = cellDate.getDate()
          const dayClasses = classesByDay[key] ?? []

          return (
            <div
              key={idx}
              className={`min-h-[72px] md:min-h-[100px] p-0.5 md:p-1.5 flex flex-col gap-0.5 border-b border-r border-slate-800/50 last:border-r-0 ${
                inMonth ? 'bg-slate-900/20' : 'bg-slate-950/40'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex justify-end shrink-0 mb-0.5">
                <span
                  className={`inline-flex h-6 w-6 md:h-7 md:w-7 items-center justify-center text-[10px] md:text-xs font-black tabular-nums ${
                    !inMonth ? 'text-slate-600' : 'text-slate-300'
                  } ${
                    isToday && inMonth
                      ? 'rounded-full bg-[var(--color-accent-secondary)] text-white dark:bg-[#bdfd2c] dark:text-slate-950 shadow-[0_0_12px_rgba(189,253,44,0.35)]'
                      : ''
                  }`}
                >
                  {dayNum}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden min-h-0 flex-1">
                {dayClasses.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-calendar-chip
                    onClick={(e) => onChipClick(e, c)}
                    className={`w-full truncate rounded-md border px-1 py-0.5 text-left text-[8px] md:text-[10px] font-black uppercase tracking-tight leading-tight hover:brightness-110 transition-all ${chipStyles(
                      c.status
                    )}`}
                    title={`${c.timeShort} · ${c.clubAbbrev}`}
                  >
                    <span className="tabular-nums">{c.timeShort}</span>{' '}
                    <span className="opacity-90">{c.clubAbbrev}</span>
                  </button>
                ))}
                {dayClasses.length > 4 && (
                  <div className="text-[8px] font-bold text-slate-500 text-center">+{dayClasses.length - 4}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openClass && popoverPos && (
        <div
          ref={popoverRef}
          className="fixed z-[12000] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl text-sm"
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverPos.width,
          }}
        >
          <p className="text-xs font-black text-gray-950 dark:text-[#ADFF2F] uppercase tracking-tight">{openClass.dateLabel}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-300">{openClass.timeRangeLabel}</p>
          {openClass.status === 'cancelled_by_coach' || openClass.status === 'cancelled_by_student' ? (
            <span className="mt-2 inline-block rounded-md bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 dark:bg-rose-950/80 dark:text-rose-200">
              CANCELADA
            </span>
          ) : openClass.status === 'completed' ? (
            <span className="mt-2 inline-block rounded-md bg-gray-200 px-2.5 py-1 text-[10px] font-black uppercase text-gray-700 dark:bg-slate-600 dark:text-slate-200">
              COMPLETADA
            </span>
          ) : null}
          <p className="mt-2 text-xs font-bold text-slate-400">{openClass.clubFull}</p>
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Alumnos</p>
            {openClass.studentNames.length === 0 ? (
              <p className="text-xs text-slate-500">Sin alumnos</p>
            ) : (
              <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {openClass.studentNames.map((n, i) => (
                  <li key={i} className="text-xs text-slate-200">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-xs font-black text-emerald-300">
            Total cobrado: $
            {(openClass.totalCobradoCents / 100).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-3 w-full py-2 rounded-xl border border-slate-700 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
