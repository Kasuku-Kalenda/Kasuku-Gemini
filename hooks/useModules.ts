import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { TrainingModule } from '../types';

export function useModules() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getModules();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch modules'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return { modules, isLoading, error, refetch: fetchModules };
}

export function useModule(id: string | null) {
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setModule(null);
      return;
    }
    setIsLoading(true);
    apiService.getModuleById(id)
      .then(setModule)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);

  return { module, isLoading, error };
}

export function useModuleMutation() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createModule = async (data: Omit<TrainingModule, 'id'>) => {
    setIsMutating(true);
    setError(null);
    try {
      return await apiService.createModule(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create module');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const updateModule = async (id: string, data: Partial<TrainingModule>) => {
    setIsMutating(true);
    setError(null);
    try {
      return await apiService.updateModule(id, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update module');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteModule = async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await apiService.deleteModule(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete module');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return { createModule, updateModule, deleteModule, isMutating, error };
}
