import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TrainingModule } from '../types';

const PROGRESS_KEY_PREFIX = 'kasuku_module_progress_';

export const useModuleProgress = (module: TrainingModule | null) => {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const key = useMemo(() => module ? `${PROGRESS_KEY_PREFIX}${module.id}` : null, [module]);

  useEffect(() => {
    if (!key) return;
    try {
      const storedProgress = window.localStorage.getItem(key);
      if (storedProgress) {
        setCompletedLessons(new Set(JSON.parse(storedProgress)));
      }
    } catch (error) {
      console.error('Error reading module progress from localStorage', error);
      setCompletedLessons(new Set());
    }
  }, [key]);

  const updateLocalStorage = useCallback((ids: Set<string>) => {
    if (!key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Error saving module progress to localStorage', error);
    }
  }, [key]);

  const toggleLessonComplete = useCallback((lessonId: string) => {
    setCompletedLessons(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(lessonId)) {
        newIds.delete(lessonId);
      } else {
        newIds.add(lessonId);
      }
      updateLocalStorage(newIds);
      return newIds;
    });
  }, [updateLocalStorage]);
  
  const totalLessons = useMemo(() => {
    return module?.sections.reduce((total, section) => total + section.lessons.length, 0) || 0;
  }, [module]);

  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.size / totalLessons) * 100);
  }, [completedLessons.size, totalLessons]);

  return { completedLessons, toggleLessonComplete, progressPercentage, totalLessons };
};
