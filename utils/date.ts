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

export function getWeddingDate(): Date {
  const weddingDate = process.env.NEXT_PUBLIC_WEDDING_DATE || '20260214';
  const year = parseInt(weddingDate.substring(0, 4));
  const month = parseInt(weddingDate.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(weddingDate.substring(6, 8));
  
  return new Date(year, month, day);
}
