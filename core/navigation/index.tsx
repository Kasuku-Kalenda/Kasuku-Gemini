/**
 * core/navigation/index.tsx
 *
 * Stack-based history manager with layered keep-alive rendering.
 *
 *  • Each navigate() push creates a new HistoryEntry with a stable UUID.
 *  • All entries stay mounted (React state + scroll preserved automatically).
 *  • LayeredViewStack reads `stack` and renders each entry as an absolute layer.
 *  • ViewOverrideProvider lets each layer see its own view/payload via useNavigation().
 *  • LayerDepthProvider tells chrome components (TopBar, BottomNav) to hide in bg layers.
 *  • direction ('forward'|'backward') drives animation variants in LayeredViewStack.
 *  • Browser ← button is wired via popstate + suppressPopState guard.
 */

import React, {
  createContext, useContext, useState, useCallback, useRef, useEffect,
  useMemo, ReactNode,
} from 'react';
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
  | 'adminPeople' | 'adminNewPerson' | 'adminEditPerson'
  | 'adminHeritage' | 'adminNewHeritage' | 'adminEditHeritage'
  | 'adminKalenda'
  | 'adminSync' | 'adminImport'
  | 'offlineScorm' | 'offlineH5p';

// ─── History entry ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  /** Stable React key — never changes for the lifetime of this visit. */
  id: string;
  view: AppView;
  payload: NavigationPayload;
}

export type NavigationDirection = 'forward' | 'backward';

// ─── Context type ─────────────────────────────────────────────────────────────

export type NavigationContextType = {
  // Full stack — consumed by LayeredViewStack
  stack: HistoryEntry[];
  direction: NavigationDirection;
  // Convenience derived values (compatible with existing consumers)
  view: AppView;
  previousView: AppView | null;
  payload: NavigationPayload;
  scrollTargetId: string | null;
  canGoBack: boolean;
  // Actions
  navigate: (view: AppView, payload?: NavigationPayload) => void;
  goBack: () => void;
  clearScrollTarget: () => void;
};

// ─── Layer override context ───────────────────────────────────────────────────
// Each layer in the stack wraps its content with ViewOverrideProvider so that
// useNavigation() inside that layer sees the layer's own view/payload (not the
// current top of the stack). navigate/goBack still target the global stack.

interface LayerOverride {
  view: AppView;
  payload: NavigationPayload;
}

const LayerOverrideContext = createContext<LayerOverride | null>(null);

export const ViewOverrideProvider: React.FC<LayerOverride & { children: ReactNode }> = ({
  view, payload, children,
}) => (
  <LayerOverrideContext.Provider value={{ view, payload }}>
    {children}
  </LayerOverrideContext.Provider>
);

// ─── Layer depth context ──────────────────────────────────────────────────────
// 0 = active (top) layer  |  1+ = background layer
// TopBar and BottomNav return null when depth > 0 to avoid stacked chrome.

const LayerDepthContext = createContext(0);

export const LayerDepthProvider: React.FC<{ depth: number; children: ReactNode }> = ({
  depth, children,
}) => (
  <LayerDepthContext.Provider value={depth}>{children}</LayerDepthContext.Provider>
);

export const useLayerDepth = () => useContext(LayerDepthContext);

// ─── ID counter ───────────────────────────────────────────────────────────────

let _seq = 0;
const nextId = () => `he-${++_seq}-${Math.random().toString(36).slice(2, 6)}`;

// ─── Navigation context ───────────────────────────────────────────────────────

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialView?: AppView;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialView = 'calendar',
}) => {
  const [stack, setStack] = useState<HistoryEntry[]>([
    { id: nextId(), view: initialView, payload: {} },
  ]);
  const [direction, setDirection] = useState<NavigationDirection>('forward');
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

  const suppressPopState = useRef(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const current      = stack[stack.length - 1];
  const view         = current.view;
  const payload      = current.payload;
  const canGoBack    = stack.length > 1;
  const previousView = stack.length >= 2 ? stack[stack.length - 2].view : null;

  // ── navigate ───────────────────────────────────────────────────────────────
  const navigate = useCallback((newView: AppView, newPayload?: NavigationPayload) => {
    setDirection('forward');
    setStack(prev => [
      ...prev,
      { id: nextId(), view: newView, payload: newPayload ?? {} },
    ]);

    if (newView === 'event' && newPayload?.event?.id) {
      setScrollTargetId(newPayload.event.id);
    } else {
      setScrollTargetId(null);
    }

    // Push a browser-history entry so the ← button can trigger popstate
    window.history.pushState(null, '', window.location.href);
  }, []);

  // ── goBack ────────────────────────────────────────────────────────────────
  const goBackImpl = useCallback((fromPopState: boolean) => {
    setDirection('backward');
    setStack(prev => (prev.length <= 1 ? prev : prev.slice(0, -1)));

    if (!fromPopState) {
      suppressPopState.current = true;
      window.history.go(-1);
      setTimeout(() => { suppressPopState.current = false; }, 300);
    }
  }, []);

  const goBack = useCallback(() => goBackImpl(false), [goBackImpl]);

  // ── Browser ← button ──────────────────────────────────────────────────────
  useEffect(() => {
    const onPopState = () => {
      if (suppressPopState.current) return;
      goBackImpl(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [goBackImpl]);

  const clearScrollTarget = useCallback(() => setScrollTargetId(null), []);

  // ── Context value (memoised) ───────────────────────────────────────────────
  const value = useMemo<NavigationContextType>(() => ({
    stack,
    direction,
    view,
    previousView,
    payload,
    scrollTargetId,
    canGoBack,
    navigate,
    goBack,
    clearScrollTarget,
  }), [stack, direction, view, previousView, payload, scrollTargetId, canGoBack, navigate, goBack, clearScrollTarget]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// ─── useNavigation ────────────────────────────────────────────────────────────
// When called inside a ViewOverrideProvider (i.e. inside a background layer),
// the returned view/payload reflect that layer's snapshot — not the current top.
// All other fields (navigate, goBack, stack …) come from the global context.

export const useNavigation = (): NavigationContextType => {
  const ctx      = useContext(NavigationContext);
  const override = useContext(LayerOverrideContext);
  if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider');
  if (override) return { ...ctx, view: override.view, payload: override.payload };
  return ctx;
};
