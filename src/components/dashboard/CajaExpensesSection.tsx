'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteExpense } from '@/app/dashboard/actions'

type ExpenseRow = {
  id: string
  expense_date: string
  description: string
  category: string
  club_id: string | null
  amount_cents: number
  paid_to?: string | null
  payment_method?: string | null
  clubs?: { name: string } | null
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function downloadCsv(filename: string, rows: Array<{ fecha: string; descripcion: string; categoria: string; sede: string; monto: string }>) {
  const header = ['Fecha', 'Descripción', 'Categoría', 'Sede', 'Monto'].join(',')
  const body = rows
    .map((r) => [r.fecha, r.descripcion, r.categoria, r.sede, r.monto].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const csv = `${header}\n${body}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function CajaExpensesSection({
  expenses,
}: {
  expenses: ExpenseRow[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const visible = expanded ? expenses : expenses.slice(0, 5)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await deleteExpense(id)
      if (!res.success) {
        alert(res.error ?? 'Error al borrar el gasto')
        return
      }
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="bg-[var(--color-bg-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-page)]/20 gap-3">
        <div className="min-w-0">
          <h2 className="text-sm md:text-xs font-black text-[var(--color-text-heading)] uppercase tracking-[0.15em] italic truncate">Detalle de Gastos</h2>
          <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mt-1">{expenses.length} MOVIMIENTOS</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const rows = expenses.map((e) => ({
              fecha: formatDateShort(e.expense_date),
              descripcion: e.description || '',
              categoria: String(e.category || '').replace('_', ' '),
              sede: e.clubs?.name || 'Global',
              monto: `-$${(e.amount_cents / 100).toLocaleString('es-AR')}`,
            }))
            downloadCsv('gastos.csv', rows)
          }}
          className="shrink-0 bg-transparent border border-[var(--color-border)] text-[var(--color-text-body)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-page)]/40 transition-colors"
        >
          Exportar Excel
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="p-20 text-center opacity-20">
          <p className="text-xs font-black uppercase tracking-[0.3em]">Sin gastos registrados este mes</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[var(--color-border)]">
            {visible.map((exp) => (
              <div key={exp.id} className="p-5 md:p-6 hover:bg-[var(--color-bg-card-inner)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                      {formatDateShort(exp.expense_date)}
                    </div>
                    <div className="mt-2 text-sm font-black text-[var(--color-text-heading)] uppercase tracking-tight truncate">
                      {exp.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(exp.id)}
                    disabled={deletingId === exp.id}
                    className="shrink-0 text-[var(--color-text-muted)] hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-500/10 disabled:opacity-50"
                    title="Borrar"
                    aria-label="Borrar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black bg-[var(--color-bg-page)] text-rose-400 px-2.5 py-1 rounded-lg border border-rose-500/20 uppercase tracking-tighter shrink-0">
                      {String(exp.category || '').replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest truncate">
                      {exp.clubs?.name || 'Global'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-rose-300 italic tracking-tighter shrink-0">
                    -${(exp.amount_cents / 100).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {expenses.length > 5 && (
            <div className="p-4 md:p-6 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                {expanded ? 'Ver menos' : `Ver todos (${expenses.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

