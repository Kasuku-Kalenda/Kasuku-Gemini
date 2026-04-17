import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import type { Event } from '../types';

/**
 * Hook personnalisé pour la gestion des événements.
 * Isole la logique de récupération des données de l'affichage.
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue lors de la récupération des événements'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refresh: fetchEvents };
}

/**
 * Hook personnalisé pour la gestion d'un événement unique.
 */
export function useEvent(idOrSlug: string | null) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!idOrSlug) {
      setEvent(null);
      return;
    }

    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        // On essaie d'abord par ID, puis par slug si ID non trouvé
        let data = await apiService.getEventById(idOrSlug);
        if (!data) {
          data = await apiService.getEventBySlug(idOrSlug);
        }
        setEvent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur lors de la récupération de l\'événement'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [idOrSlug]);

  return { event, isLoading, error };
}

/**
 * Hook personnalisé pour les mutations d'événements.
 */
export function useEventMutation() {
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const createEvent = async (data: Omit<Event, 'id'>) => {
    setIsMutating(true);
    try {
      const result = await apiService.createEvent(data);
      setMutationError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la création');
      setMutationError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const updateEvent = async (id: string, data: Partial<Event>) => {
    setIsMutating(true);
    try {
      const result = await apiService.updateEvent(id, data);
      setMutationError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la mise à jour');
      setMutationError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setIsMutating(true);
    try {
      await apiService.deleteEvent(id);
      setMutationError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors de la suppression');
      setMutationError(error);
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  return { createEvent, updateEvent, deleteEvent, isMutating, mutationError };
}
