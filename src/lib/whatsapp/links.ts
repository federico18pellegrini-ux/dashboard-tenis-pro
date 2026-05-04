/**
 * Genera un enlace directo a WhatsApp sanitizando el teléfono.
 */
export function whatsappLink(phone: string, message: string) {
    // Eliminamos cualquier caracter que no sea un dígito (incluyendo el +)
    const cleanPhone = phone.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  }