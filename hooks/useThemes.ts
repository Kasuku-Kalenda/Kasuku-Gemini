import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { Theme } from '../types';

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThemes = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getThemes();
      setThemes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch themes'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return { themes, isLoading, error, refetch: fetchThemes };
}

export function useThemeMutation() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createTheme = async (data: Omit<Theme, 'id'>) => {
    setIsMutating(true);
    setError(null);
    try {
      return await apiService.createTheme(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create theme');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteTheme = async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await apiService.deleteTheme(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete theme');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return { createTheme, deleteTheme, isMutating, error };
}
