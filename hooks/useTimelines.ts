import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { TimelineNarrative } from '../types';

export function useTimelines() {
  const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTimelines = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getTimelines();
      setTimelines(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch timelines'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, []);

  return { timelines, isLoading, error, refetch: fetchTimelines };
}

export function useTimeline(id: string | null) {
  const [timeline, setTimeline] = useState<TimelineNarrative | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setTimeline(null);
      return;
    }
    setIsLoading(true);
    apiService.getTimelineById(id)
      .then(setTimeline)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);

  return { timeline, isLoading, error };
}

export function useTimelineMutation() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createTimeline = async (data: Omit<TimelineNarrative, 'id'>) => {
    setIsMutating(true);
    setError(null);
    try {
      return await apiService.createTimeline(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create timeline');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const updateTimeline = async (id: string, data: Partial<TimelineNarrative>) => {
    setIsMutating(true);
    setError(null);
    try {
      return await apiService.updateTimeline(id, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update timeline');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteTimeline = async (id: string) => {
    setIsMutating(true);
    setError(null);
    try {
      await apiService.deleteTimeline(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete timeline');
      setError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return { createTimeline, updateTimeline, deleteTimeline, isMutating, error };
}
