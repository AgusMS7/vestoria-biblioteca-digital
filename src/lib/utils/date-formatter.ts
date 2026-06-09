/**
 * Formatea fechas en español para presentación elegante
 */

const MONTHS_SPANISH = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/**
 * Formatea año y mes como "Diciembre de 2025"
 */
export function formatMonthYear(year: number, month?: number | null): string {
  if (!month || month < 1 || month > 12) {
    return year.toString()
  }
  return `${MONTHS_SPANISH[month - 1]} de ${year}`
}

/**
 * Formatea fecha completa como "15 de diciembre de 2025"
 */
export function formatFullDate(year: number, month?: number, day?: number): string {
  if (!month || month < 1 || month > 12) {
    return year.toString()
  }

  if (!day || day < 1 || day > 31) {
    return `${MONTHS_SPANISH[month - 1]} de ${year}`
  }

  return `${day} de ${MONTHS_SPANISH[month - 1]} de ${year}`
}

/**
 * Crea una clave para agrupar por año-mes
 * Devuelve null si no hay suficiente información
 */
export function getYearMonthKey(year?: number, month?: number): string | null {
  if (!year) return null
  if (!month || month < 1 || month > 12) {
    return `${year}-00` // Sin mes específico
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Extrae year y month de la clave
 */
export function parseYearMonthKey(key: string): { year: number; month: number | null } {
  const [yearStr, monthStr] = key.split('-')
  const year = parseInt(yearStr, 10)
  const month = monthStr === '00' ? null : parseInt(monthStr, 10)
  return { year, month }
}
