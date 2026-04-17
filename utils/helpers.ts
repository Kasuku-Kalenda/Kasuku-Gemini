
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
