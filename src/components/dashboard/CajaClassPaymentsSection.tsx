'use client'

import { useMemo, useState } from 'react'
import { CancelClassPaymentButton } from '@/components/dashboard/CancelClassPaymentButton'

type Row = {
  class_id: string
  student_id: string
  paid_at: string | null
  student_name: string
  method_label: string
  club_name: string
  amount_cents: number
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString('es-AR')
}

function formatDateShort(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function downloadCsv(filename: string, rows: Array<{ fecha: string; alumno: string; metodo: string; sede: string; monto: string }>) {
  const header = ['Fecha', 'Alumno', 'Método', 'Sede', 'Monto'].join(',')
  const body = rows
    .map((r) => [r.fecha, r.alumno, r.metodo, r.sede, r.monto].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
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

export function CajaClassPaymentsSection({
  title,
  rows,
}: {
  title: string
  rows: Row[]
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, 5)

  const exportRows = useMemo(() => {
    return rows.map((r) => ({
      fecha: formatDateShort(r.paid_at),
      alumno: r.student_name || 'Alumno',
      metodo: r.method_label || '—',
      sede: r.club_name || 'Global',
      monto: `$${formatMoney(r.amount_cents)}`,
    }))
  }, [rows])

  return (
    <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 gap-3">
        <div className="min-w-0">
          <h2 className="text-sm md:text-xs font-black text-white uppercase tracking-[0.15em] italic truncate">{title}</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{rows.length} MOVIMIENTOS</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv('ingresos-clases.csv', exportRows)}
          className="shrink-0 bg-transparent border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-700 hover:bg-slate-950/40 transition-colors"
        >
          Exportar Excel
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center opacity-20">
          <p className="text-xs font-black uppercase tracking-[0.3em]">Sin cobros de clases este mes</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-800/50">
            {visible.map((p, idx) => (
              <div key={`${p.class_id}-${p.student_id}-${idx}`} className="p-5 md:p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {formatDateShort(p.paid_at)}
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-100 uppercase tracking-tight truncate">
                      Clase — {p.student_name || 'Alumno'} · {p.method_label || '—'}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <CancelClassPaymentButton classId={p.class_id} studentId={p.student_id} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-tighter shrink-0">
                      CLASES
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                      {p.club_name || 'Global'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-emerald-300 italic tracking-tighter shrink-0">
                    ${formatMoney(p.amount_cents || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rows.length > 5 && (
            <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#bdfd2c] transition-colors"
              >
                {expanded ? 'Ver menos' : `Ver todos (${rows.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

