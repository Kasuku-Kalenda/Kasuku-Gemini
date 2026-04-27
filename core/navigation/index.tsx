/**
 * core/navigation/index.tsx — NavigationContext
 *
 * Replaces the scattered navigateTo / selectedEvent / selectedModule / etc.
 * state that lived in App.tsx. All shell components use useNavigation() to
 * read the current view and navigate between views.
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { Event, TrainingModule } from '../../types';

// ─── Payload ──────────────────────────────────────────────────────────────────

export type NavigationPayload = {
  id?: string | null;
  event?: Event | null;
  module?: TrainingModule | null;
  timelineSlug?: string | null;
  timelineEventId?: string | null;
  date?: Date | null;
  dateEvents?: Event[];
};

// ─── AppView ──────────────────────────────────────────────────────────────────

export type AppView =
  | 'home' | 'calendar' | 'favorites' | 'modules'
  | 'event' | 'timeline' | 'timelines' | 'module' | 'dateTimeline'
  | 'adminLogin' | 'adminDashboard'
  | 'adminEvents' | 'adminNewEvent' | 'adminEditEvent'
  | 'adminModules' | 'adminNewModule' | 'adminEditModule'
  | 'adminThemes' | 'adminNewTheme' | 'adminEditTheme'
  | 'adminTimelines' | 'adminNewTimeline' | 'adminEditTimeline'
  | 'adminFeatured' | 'adminNewFeatured' | 'adminEditFeatured'
  | 'adminMoodleInstances' | 'adminNewMoodleInstance' | 'adminEditMoodleInstance'
  | 'adminMoodleCourses' | 'adminNewMoodleCourse' | 'adminEditMoodleCourse'
  | 'adminMoodlePackages' | 'adminNewMoodlePackage' | 'adminEditMoodlePackage' | 'adminMoodlePackageUpload'
  | 'adminMoodleMaps' | 'adminNewMoodleMap' | 'adminEditMoodleMap'
  | 'adminSync' | 'adminImport'
  | 'offlineScorm' | 'offlineH5p';

// ─── Context type ─────────────────────────────────────────────────────────────

export type NavigationContextType = {
  view: AppView;
  previousView: AppView | null;
  payload: NavigationPayload;
  scrollTargetId: string | null;
  navigate: (view: AppView, payload?: NavigationPayload) => void;
  goBack: () => void;
  clearScrollTarget: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface NavigationProviderProps {
  children: ReactNode;
  initialView?: AppView;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialView = 'calendar',
}) => {
  const [view, setView] = useState<AppView>(initialView);
  const [previousView, setPreviousView] = useState<AppView | null>(null);
  const [payload, setPayload] = useState<NavigationPayload>({});
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

  const scrollPositions = useRef<Partial<Record<AppView, number>>>({});

  const navigate = useCallback((newView: AppView, newPayload?: NavigationPayload) => {
    // Save current scroll position for the view we're leaving
    scrollPositions.current[view] = window.scrollY;

    // When navigating to an event, we want to be able to scroll back to the
    // card that was clicked after returning to the list view.
    if (newView === 'event' && newPayload?.event?.id) {
      setScrollTargetId(newPayload.event.id);
    } else {
      setScrollTargetId(null);
    }

    setPreviousView(view);
    setView(newView);
    setPayload(newPayload ?? {});
    window.scrollTo(0, 0);
  }, [view]);

  const goBack = useCallback(() => {
    if (previousView) {
      // Restore scroll position when going back
      const savedPosition = scrollPositions.current[previousView];
      setView(previousView);
      setPayload({});
      // For some parent views like 'module' → 'modules', keep previousView one further back
      if (previousView === 'module') {
        setPreviousView('modules');
      } else {
        setPreviousView(null);
      }
      if (typeof savedPosition === 'number') {
        setTimeout(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }), 0);
      }
    }
  }, [previousView]);

  const clearScrollTarget = useCallback(() => setScrollTargetId(null), []);

  return (
    <NavigationContext.Provider
      value={{ view, previousView, payload, scrollTargetId, navigate, goBack, clearScrollTarget }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNavigation = (): NavigationContextType => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider');
  return ctx;
};
