// Configuración de zona horaria para Argentina
export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

// Configuración de locale para Argentina
export const ARGENTINA_LOCALE = 'es-AR'

// Función para obtener la fecha actual en zona horaria de Argentina
export function getCurrentDateArgentina(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
}

// Función para convertir una fecha a zona horaria de Argentina
export function toArgentinaTimeZone(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
}

// Función para formatear fecha en zona horaria de Argentina
export function formatDateArgentina(date: Date | null): string {
  if (!date) return '-'
  
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  return formatter.format(date)
}

// Función para formatear fecha y hora en zona horaria de Argentina
export function formatDateTimeArgentina(date: Date | null): string {
  if (!date) return '-'
  
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return formatter.format(date)
}
