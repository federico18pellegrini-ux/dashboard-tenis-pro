import { toZonedTime } from 'date-fns-tz';

const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Devuelve el año y mes (0-indexado, JS convention) actual en zona horaria AR.
 * Crucial para evitar que a las 21:00 o 22:00 hs de Argentina el sistema "piense" 
 * que ya es el día siguiente (UTC) y afecte el balance mensual.
 */
export function getCurrentMonthAR(): { year: number; month: number } {
  const nowAR = toZonedTime(new Date(), TZ);
  return {
    year: nowAR.getFullYear(),
    month: nowAR.getMonth(),
  };
}

/**
 * Cuenta cuántas veces ocurre cada día de la semana en un mes específico.
 * 
 * Retorna un array de 7 posiciones donde el índice = day_of_week:
 * [0]=domingo, [1]=lunes, [2]=martes, [3]=miércoles, [4]=jueves, [5]=viernes, [6]=sábado
 * 
 * @param year  Año completo (ej: 2026)
 * @param month Mes 0-indexado (0=enero, 4=mayo, 11=diciembre)
 */
export function countWeekdaysInMonth(year: number, month: number): number[] {
  const counts = new Array(7).fill(0);
  // Obtenemos el último día del mes configurando el día 0 del mes siguiente
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(year, month, day).getDay();
    counts[dow]++;
  }

  return counts;
}