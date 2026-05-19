export const STUDENT_LEVELS = ['4ta', '5ta', '6ta', '7ma', '8va', '9na'] as const

export type StudentLevel = typeof STUDENT_LEVELS[number]

export const DEFAULT_STUDENT_LEVEL: StudentLevel = '8va'

export function isStudentLevel(value: unknown): value is StudentLevel {
  return typeof value === 'string' && (STUDENT_LEVELS as readonly string[]).includes(value)
}

export function formatStudentLevel(value: string | null | undefined): string | null {
  if (!value) return null
  if (isStudentLevel(value)) return value
  return null
}
