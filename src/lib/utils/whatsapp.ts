export function buildWhatsAppPaymentLink({
  studentName,
  studentPhone,
  classDate,
  clubName,
  amountCents,
}: {
  studentName: string
  studentPhone: string
  classDate: string
  clubName: string
  amountCents: number
}): string {
  const amount = (amountCents / 100).toLocaleString('es-AR')
  const message =
    `Hola ${studentName}! Te paso los datos para el pago de la clase ` +
    `del ${classDate} en ${clubName}.\n\n` +
    `*Monto:* $${amount}\n\n` +
    `*Transferencia:*\n` +
    `CBU: 0000000000000000000000\n` +
    `Alias: ALIAS.PLACEHOLDER\n\n` +
    `*Mercado Pago:*\n` +
    `https://mpago.la/PLACEHOLDER\n\n` +
    `Cualquier consulta avisame!`

  const phone = studentPhone.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppTournamentLink({
  studentName,
  studentPhone,
  tournamentName,
  categoryName,
  clubName,
  amountCents,
}: {
  studentName: string
  studentPhone: string
  tournamentName: string
  categoryName: string
  clubName: string
  amountCents: number
}): string {
  const amount = (amountCents / 100).toLocaleString('es-AR')
  const message =
    `Hola ${studentName}! Te paso los datos para el pago del torneo ` +
    `*${tournamentName}* - categoría ${categoryName} en ${clubName}.\n\n` +
    `*Monto:* $${amount}\n\n` +
    `*Transferencia:*\n` +
    `CBU: 0000000000000000000000\n` +
    `Alias: ALIAS.PLACEHOLDER\n\n` +
    `*Mercado Pago:*\n` +
    `https://mpago.la/PLACEHOLDER\n\n` +
    `Cualquier consulta avisame!`
  const phone = studentPhone.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
