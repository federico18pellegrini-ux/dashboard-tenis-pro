'use client'

import { useMemo, useState } from 'react'
import { RegisterPaymentModal } from '@/components/dashboard/RegisterPaymentModal'
import { AddStudentToClassModal } from '@/components/dashboard/AddStudentToClassModal'
import { buildWhatsAppPaymentLink } from '@/lib/utils/whatsapp'
import { useRouter } from 'next/navigation'
import { deleteClass, updateClassStatus } from '@/lib/actions/classes'

type WeekClass = {
  id: string
  scheduled_at: string
  duration_minutes: number
  price_cents: number
  status: string
  club: { name: string }
  students: {
    full_name: string
    phone: string
    student_id: string
    paid: boolean
    paid_amount: number | null
    payment_method: string | null
  }[]
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

function paymentMethodShort(method: string | null) {
  if (!method) return ''
  if (method === 'cash') return 'Efect.'
  if (method === 'transfer') return 'Transf.'
  if (method === 'mp') return 'MP'
  return method
}

function paymentMethodLabel(method: string | null) {
  if (!method) return ''
  if (method === 'cash') return 'Efectivo'
  if (method === 'transfer') return 'Transferencia'
  if (method === 'mp') return 'Mercado Pago'
  return method
}

export function WeekClasses({
  classes,
  allStudents,
  paidTotalCents,
}: {
  classes: WeekClass[]
  allStudents: { id: string; full_name: string }[]
  paidTotalCents?: number
}) {
  const router = useRouter()
  const count = classes?.length ?? 0
  const [payModal, setPayModal] = useState<null | {
    classId: string
    studentId: string
    studentName: string
    defaultAmountCents: number
    existingPayment?: {
      paid_amount: number
      payment_method: string
    }
  }>(null)

  const [addStudentModal, setAddStudentModal] = useState<null | {
    classId: string
    existingStudentIds: string[]
  }>(null)

  const [statusLoading, setStatusLoading] = useState<null | { classId: string; status: string }>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  const formatted = useMemo(() => {
    return (classes ?? []).map((c) => {
      const start = new Date(c.scheduled_at)
      const end = addMinutes(start, c.duration_minutes || 0)

      const datePart = start.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      const startTime = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const endTime = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

      const studentsSummary = (c.students ?? []).map((s) => s.full_name).filter(Boolean).join(', ')
      const totalCobrado = (c.students ?? [])
        .filter((s) => !!s.paid && !!s.paid_amount)
        .reduce((acc, s) => acc + Number(s.paid_amount ?? 0), 0)

      const totalCobradoLabel = formatPesos(totalCobrado)
      const classDate = start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      return { ...c, datePart, startTime, endTime, studentsSummary, totalCobrado, totalCobradoLabel, classDate }
    })
  }, [classes])

  async function setClassStatus(
    classId: string,
    status:
      | 'scheduled'
      | 'reminder_sent'
      | 'confirmed'
      | 'cancelled_by_student'
      | 'cancelled_by_coach'
      | 'completed'
      | 'no_show',
  ) {
    setStatusLoading({ classId, status })
    try {
      const res = await updateClassStatus({ class_id: classId, status })
      if (!res.success) {
        alert(res.error ?? 'Error al actualizar el estado')
        return
      }
      router.refresh()
    } finally {
      setStatusLoading(null)
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!window.confirm('¿Eliminar esta clase? No se puede deshacer.')) return
    setDeleteLoadingId(classId)
    try {
      const res = await deleteClass({ class_id: classId })
      if (!res.success) {
        alert(res.error ?? 'Error al eliminar la clase')
        return
      }
      router.refresh()
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <>
    <section className="bg-[var(--color-bg-card-inner)]/80 bg-[var(--color-bg-card)]/40 rounded-[2.5rem] border border-black/10  shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-black/10  bg-gray-200/80 bg-[var(--color-bg-page)]/40 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black text-gray-950  uppercase tracking-[0.15em] italic">
            Clases del mes <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">({count})</span>
          </h2>
          <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] dark:text-[var(--color-accent)]">
            Cobrado: ${((paidTotalCents ?? 0) / 100).toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {count === 0 ? (
        <div className="p-6 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
          No hay clases programadas para este mes
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-4">
          {formatted.map((c) => (
            <div key={c.id} className="bg-[var(--color-bg-card-inner)]/90 bg-[var(--color-bg-card)]/40 border border-black/10  rounded-3xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-3.5 py-3 flex items-start justify-between gap-3 border-b border-black/10 ">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--color-text-body)] text-[var(--color-text-heading)] capitalize truncate">
                    {c.classDate}
                  </div>
                  <div className="text-[12px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold truncate">
                    {c.club?.name ?? 'Sede'}
                  </div>
                  <div className="text-[12px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold truncate">
                    {c.startTime} – {c.endTime}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="text-[12px] font-black text-green-700 dark:text-[var(--color-accent)]">
                    {c.totalCobradoLabel}
                  </div>
                </div>
              </div>

              {/* Students list */}
              <div className="px-3.5">
                {(c.students ?? []).length === 0 ? (
                  <div className="py-3 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest">Sin alumnos</div>
                ) : (
                  <div>
                    {(c.students ?? []).map((s) => {
                      const rowKey = `${c.id}-${s.student_id}`
                      if (!s.paid) {
                        const waHref =
                          s.phone && s.phone.trim().length > 0
                            ? buildWhatsAppPaymentLink({
                                studentName: s.full_name,
                                studentPhone: s.phone,
                                classDate: c.classDate,
                                clubName: c.club?.name ?? 'Sede',
                                amountCents: c.price_cents,
                              })
                            : null

                        return (
                          <div
                            key={rowKey}
                            className="flex items-center justify-between gap-3 py-2 border-b border-black/10  last:border-b-0"
                          >
                            <div className="min-w-0 text-[13px] font-bold text-gray-800 text-[var(--color-text-body)] truncate">
                              {s.full_name}
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPayModal({
                                    classId: c.id,
                                    studentId: s.student_id,
                                    studentName: s.full_name,
                                    defaultAmountCents: c.price_cents,
                                  })
                                }
                                className="border border-green-700/50 dark:border-emerald-700/50 text-green-700 dark:text-[var(--color-accent)] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-green-100 dark:hover:bg-emerald-950/30 transition-colors"
                              >
                                Cobrar
                              </button>
                              {waHref && (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="border border-gray-400 dark:border-slate-700 text-gray-700 text-[var(--color-text-body)] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-950/40 transition-colors"
                                  title="Enviar recordatorio por WhatsApp"
                                >
                                  WA
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      }

                      const amount = formatPesos(s.paid_amount ?? c.price_cents ?? 0)
                      const methodShort = paymentMethodShort(s.payment_method)

                      return (
                        <div
                          key={rowKey}
                          className="flex items-center justify-between gap-3 py-2 border-b border-black/10  last:border-b-0"
                        >
                          <div className="min-w-0 text-[13px] font-bold text-gray-800 text-[var(--color-text-body)] truncate">
                            {s.full_name}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPayModal({
                                classId: c.id,
                                studentId: s.student_id,
                                studentName: s.full_name,
                                defaultAmountCents: c.price_cents,
                                existingPayment: {
                                  paid_amount: s.paid_amount ?? c.price_cents,
                                  payment_method: s.payment_method ?? 'cash',
                                },
                              })
                            }
                            className="shrink-0 text-[var(--color-accent)] dark:text-[var(--color-accent)] text-[12px] font-black hover:text-green-700 dark:hover:text-green-300 transition-colors"
                            title="Editar / anular pago"
                          >
                            ✓ {amount}{methodShort ? ` · ${methodShort}` : ''}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3.5 py-3 bg-gray-200/60 bg-[var(--color-bg-page)]/30 border-t border-black/10 ">
                {c.status === 'scheduled' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={!!statusLoading && statusLoading.classId === c.id}
                      onClick={() => void setClassStatus(c.id, 'cancelled_by_coach')}
                      className="flex-1 min-w-[120px] border border-red-700/50 dark:border-rose-700/50 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    >
                      ✗ Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAddStudentModal({
                          classId: c.id,
                          existingStudentIds: (c.students ?? []).map((s) => s.student_id),
                        })
                      }
                      className="border border-gray-400 dark:border-slate-700 text-gray-700 text-[var(--color-text-body)] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-950/40 transition-colors"
                      title="Agregar alumno"
                    >
                      + Alumno
                    </button>
                    <button
                      type="button"
                      disabled={deleteLoadingId === c.id}
                      onClick={() => void handleDeleteClass(c.id)}
                      className="shrink-0 ml-auto border border-red-600/70 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                      title="Eliminar clase"
                      aria-label="Eliminar clase"
                    >
                      {deleteLoadingId === c.id ? '…' : '🗑'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={!!statusLoading && statusLoading.classId === c.id}
                      onClick={() => void setClassStatus(c.id, 'scheduled')}
                      className="flex-1 min-w-[120px] border border-gray-400 dark:border-slate-700 text-gray-700 text-[var(--color-text-body)] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-950/40 transition-colors disabled:opacity-50"
                    >
                      Reabrir
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAddStudentModal({
                          classId: c.id,
                          existingStudentIds: (c.students ?? []).map((s) => s.student_id),
                        })
                      }
                      className="border border-gray-400 dark:border-slate-700 text-gray-700 text-[var(--color-text-body)] px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-950/40 transition-colors"
                      title="Agregar alumno"
                    >
                      + Alumno
                    </button>
                    <button
                      type="button"
                      disabled={deleteLoadingId === c.id}
                      onClick={() => void handleDeleteClass(c.id)}
                      className="shrink-0 ml-auto border border-red-600/70 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg text-xs hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                      title="Eliminar clase"
                      aria-label="Eliminar clase"
                    >
                      {deleteLoadingId === c.id ? '…' : '🗑'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
    {payModal && (
      <RegisterPaymentModal
        classId={payModal.classId}
        studentId={payModal.studentId}
        studentName={payModal.studentName}
        defaultAmountCents={payModal.defaultAmountCents}
        existingPayment={payModal.existingPayment}
        onClose={() => setPayModal(null)}
        onSuccess={() => {}}
      />
    )}
    {addStudentModal && (
      <AddStudentToClassModal
        classId={addStudentModal.classId}
        existingStudentIds={addStudentModal.existingStudentIds}
        allStudents={allStudents}
        onClose={() => setAddStudentModal(null)}
      />
    )}
    </>
  )
}


