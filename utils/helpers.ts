
/**
 * Transforme les URLs internes `http://localhost/...` en chemins relatifs
 * accessibles depuis le navigateur (nginx proxifie /storage → MinIO).
 */
export const normalizeMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://localhost/') || url.startsWith('https://localhost/')) {
    return '/' + url.split('/').slice(3).join('/');
  }
  return url;
};

export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Default to UTC to prevent off-by-one day errors
  };
  // For en-US, we can use a locale that matches YYYY-MM-DD for consistency if needed,
  // but en-US with specified options is generally fine.
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};
