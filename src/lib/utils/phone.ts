/**
 * Normaliza números de teléfono argentinos al formato internacional E.164
 * Ejemplo: "011 15 3456-7890" -> "+5491134567890"
 */
export function normalizePhone(rawPhone: string): string {
    // 1. Eliminar todo lo que no sea un número
    let cleaned = rawPhone.replace(/\D/g, '');
  
    // 2. Manejar prefijos internacionales si ya los tiene
    // Si empieza con 54, asumimos que es correcto y solo verificamos el '9'
    if (cleaned.startsWith('54')) {
      // Si es 5411... le falta el '9' de móvil
      if (cleaned.startsWith('5411') && cleaned.length === 12) {
        cleaned = '549' + cleaned.slice(2);
      }
    } else {
      // 3. Manejar prefijos locales
      // Quitar el '0' inicial si existe (ej: 011 -> 11)
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
      }
  
      // Quitar el '15' si es el inicio (ej: 153456 -> 3456)
      // Ojo: algunos números pueden empezar con 15 como característica (raro en AMBA)
      if (cleaned.startsWith('15')) {
        cleaned = cleaned.slice(2);
      }
  
      // 4. Agregar código de país y el '9' de móvil
      // Si tiene 10 dígitos (ej: 1134567890), le agregamos el +549
      if (cleaned.length === 10) {
        cleaned = '549' + cleaned;
      }
    }
  
    // Retornar con el signo + (formato E.164 final)
    return `+${cleaned}`;
  }
  
  /**
   * Formatea el número para mostrarlo lindo en la UI
   * Ejemplo: "+5491134567890" -> "+54 9 11 3456-7890"
   */
  export function formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  }