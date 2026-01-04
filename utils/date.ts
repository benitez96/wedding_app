export function formatWeddingDate(dateString: string): string {
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6));
  const day = parseInt(dateString.substring(6, 8));
  
  const date = new Date(year, month - 1, day);
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('es-ES', options);
}

import { ARGENTINA_TIMEZONE, ARGENTINA_LOCALE } from '@/config/timezone'

export function getWeddingDate(): Date {
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || '20260214193000';
  const year = parseInt(weddingDate.substring(0, 4));
  const month = parseInt(weddingDate.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(weddingDate.substring(6, 8));
  const hour = parseInt(weddingDate.substring(8, 10));
  const minute = parseInt(weddingDate.substring(10, 12));
  const second = parseInt(weddingDate.substring(12, 14));
  
  return new Date(year, month, day, hour, minute, second);
}

// Función para formatear fechas de manera consistente entre servidor y cliente
export function formatDate(date: Date | null): string {
  if (!date) return '-'
  
  // Convertir a zona horaria de Argentina usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  return formatter.format(date)
}

// Función para obtener la fecha actual en zona horaria de Argentina
export function getCurrentDateArgentina(): Date {
  const now = new Date()
  const argentinaTime = new Date(now.toLocaleString(ARGENTINA_LOCALE, { timeZone: ARGENTINA_TIMEZONE }))
  return argentinaTime
}

// Función para formatear fecha y hora en zona horaria de Argentina
export function formatDateTime(date: Date | null): string {
  if (!date) return '-'
  
  // Convertir a zona horaria de Argentina usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  return formatter.format(date)
}

// Función para convertir una fecha a zona horaria de Argentina
export function toArgentinaTimeZone(date: Date): Date {
  const argentinaTime = new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
  return argentinaTime
}
