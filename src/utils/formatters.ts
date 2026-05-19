export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function truncateText(text: string, maxLength = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
