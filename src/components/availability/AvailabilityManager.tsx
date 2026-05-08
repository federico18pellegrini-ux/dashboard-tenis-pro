'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AvailabilityGrid,
  type AvailabilityClub,
  type AvailabilitySlot,
  type AvailabilityClubCells,
} from './AvailabilityGrid'
import { saveAvailability } from '@/lib/actions/availability'

type ClubSlots = {
  club: AvailabilityClub
  initialSlots: AvailabilitySlot[]
}

type ToastState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

function normalizeSlots(slots: AvailabilitySlot[]) {
  return slots
    .map((s) => ({ ...s, start_time: s.start_time.slice(0, 5) }))
    .sort((a, b) => (a.day_of_week - b.day_of_week) || a.start_time.localeCompare(b.start_time))
}

function keyFor(club_id: string, s: AvailabilitySlot) {
  return `${club_id}|${s.day_of_week}|${s.start_time}`
}

function clubCellKey(day_of_week: number, start_time: string) {
  return `${day_of_week}|${start_time}`
}

export function AvailabilityManager({ clubs }: { clubs: ClubSlots[] }) {
  const initialKeyedFromProps = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const c of clubs) {
      for (const s of normalizeSlots(c.initialSlots)) {
        m.set(keyFor(c.club.id, s), s.active)
      }
    }
    return m
  }, [clubs])

  const [baselineKeyed, setBaselineKeyed] = useState<Map<string, boolean>>(new Map(initialKeyedFromProps))
  const [pendingKeyed, setPendingKeyed] = useState<Map<string, boolean>>(new Map(initialKeyedFromProps))
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' })

  // Sync when server-provided data changes (refresh/navigation)
  useEffect(() => {
    setBaselineKeyed(new Map(initialKeyedFromProps))
    setPendingKeyed(new Map(initialKeyedFromProps))
  }, [initialKeyedFromProps])

  const hasUnsavedChanges = useMemo(() => {
    if (pendingKeyed.size !== baselineKeyed.size) return true
    for (const [k, v] of pendingKeyed) if ((baselineKeyed.get(k) ?? false) !== v) return true
    return false
  }, [baselineKeyed, pendingKeyed])

  const changedCountByClubId = useMemo(() => {
    const byClub = new Map<string, number>()
    for (const { club } of clubs) byClub.set(club.id, 0)

    for (const [k, pendingActive] of pendingKeyed.entries()) {
      const [club_id] = k.split('|')
      const baselineActive = baselineKeyed.get(k) ?? false
      if (pendingActive !== baselineActive) byClub.set(club_id, (byClub.get(club_id) ?? 0) + 1)
    }

    return byClub
  }, [baselineKeyed, clubs, pendingKeyed])

  const clubCellsByClubId = useMemo(() => {
    const out = new Map<string, AvailabilityClubCells>()
    for (const { club } of clubs) out.set(club.id, new Map())

    for (const [k, active] of pendingKeyed.entries()) {
      const [club_id, dayStr, start_time] = k.split('|')
      const clubMap = out.get(club_id)
      if (!clubMap) continue
      clubMap.set(clubCellKey(Number(dayStr), start_time), active)
    }

    return out
  }, [clubs, pendingKeyed])

  async function handleSave() {
    setIsSaving(true)
    setToast({ kind: 'idle' })

    const slots: Array<{ club_id: string; day_of_week: number; start_time: string; active: boolean }> = []

    for (const [k, active] of pendingKeyed.entries()) {
      const [club_id, dayStr, start_time] = k.split('|')
      slots.push({
        club_id,
        day_of_week: Number(dayStr),
        start_time,
        active,
      })
    }

    try {
      const result = await saveAvailability({ slots })
      if (!result.success) {
        setToast({ kind: 'error', message: result.error })
        setIsSaving(false)
        return
      }

      setToast({ kind: 'success', message: 'Disponibilidad guardada' })
      // Update baseline so "sin guardar" clears immediately without requiring refresh.
      setBaselineKeyed(new Map(pendingKeyed))
    } catch (e: any) {
      setToast({ kind: 'error', message: e?.message || 'Error al guardar' })
    } finally {
      setIsSaving(false)
    }
  }

  function toggleCell(club_id: string, day_of_week: number, start_time: string) {
    setPendingKeyed((prev) => {
      const next = new Map(prev)
      const key = `${club_id}|${day_of_week}|${start_time}`
      next.set(key, !(next.get(key) ?? false))
      return next
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)] font-bold max-w-2xl">
            Marcá los horarios que trabajás en cada club. Las celdas vacías van a aparecer en la grilla principal como
            &quot;slots libres&quot; donde podés asignar alumnos.
          </p>
          {hasUnsavedChanges && (
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              * tenés cambios sin guardar
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={isSaving || !hasUnsavedChanges}
          onClick={handleSave}
          className={[
            'px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl border',
            hasUnsavedChanges
              ? 'bg-[var(--color-accent-secondary)] text-white  border-green-700 dark:border-[#bdfd2c]/30 hover:bg-green-800 dark:hover:bg-[#a5e620]'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)]',
            (isSaving || !hasUnsavedChanges) ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {toast.kind !== 'idle' && (
        <div
          className={[
            'px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest',
            toast.kind === 'success'
              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-900/40 text-rose-300',
          ].join(' ')}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-8">
        {clubs.map(({ club, initialSlots }) => (
          <AvailabilityGrid
            key={club.id}
            club={club}
            cells={clubCellsByClubId.get(club.id) ?? new Map()}
            changedCount={changedCountByClubId.get(club.id) ?? 0}
            onToggle={(day_of_week, start_time) => toggleCell(club.id, day_of_week, start_time)}
          />
        ))}
      </div>
    </div>
  )
}

