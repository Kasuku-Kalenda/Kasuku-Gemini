/**
 * shell/UserApp.tsx — Public-facing shell
 *
 * Handles all user views. Admin views are handled by AdminApp.tsx.
 * Uses NavigationContext instead of prop-drilled navigateTo callbacks.
 *
 * All pages are lazy-loaded (React.lazy) so each page is a separate JS
 * chunk — only parsed/executed when first navigated to.
 */

import React, { useCallback, Suspense } from 'react';
import { useNavigation } from '../core/navigation';
import type { AppView } from '../core/navigation';
import { Layout } from '../components/Layout';
import { apiService } from '../services/api.service';
import type { Event, HeritageItem } from '../types';

// ── Lazy page imports ─────────────────────────────────────────────────────────
const HomePage            = React.lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const CalendarPage        = React.lazy(() => import('../pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const FavoritesPage       = React.lazy(() => import('../pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const EventDetailPage     = React.lazy(() => import('../pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const TimelineListingPage = React.lazy(() => import('../pages/TimelineListingPage').then(m => ({ default: m.TimelineListingPage })));
const TimelinePage        = React.lazy(() => import('../pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const ModulePage          = React.lazy(() => import('../pages/ModulePage').then(m => ({ default: m.ModulePage })));
const ModulesIndexPage    = React.lazy(() => import('../pages/ModulesIndexPage').then(m => ({ default: m.ModulesIndexPage })));
const DateTimelinePage    = React.lazy(() => import('../pages/DateTimelinePage').then(m => ({ default: m.DateTimelinePage })));
const ScormPlayerPage          = React.lazy(() => import('../pages/offline/ScormPlayerPage').then(m => ({ default: m.ScormPlayerPage })));
const H5pPlayerPage            = React.lazy(() => import('../pages/offline/H5pPlayerPage').then(m => ({ default: m.H5pPlayerPage })));
const HeritageDiscoveryPage    = React.lazy(() => import('../pages/HeritageDiscoveryPage').then(m => ({ default: m.HeritageDiscoveryPage })));
const HeritageDetailPage       = React.lazy(() => import('../pages/HeritageDetailPage').then(m => ({ default: m.HeritageDetailPage })));

// ── Fallback de chargement ────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs text-muted-foreground">Chargement…</span>
    </div>
  </div>
);

export const UserApp: React.FC = () => {
  const { view, previousView, payload, navigate, goBack } = useNavigation();

  // ── Navigation helpers ────────────────────────────────────────────────────

  const viewEvent = useCallback((event: Event) => {
    navigate('event', { event });
  }, [navigate]);

  const navigateToTimeline = useCallback((slug: string, eventId?: string) => {
    navigate('timeline', { timelineSlug: slug, timelineEventId: eventId ?? null });
  }, [navigate]);

  const navigateToDateTimeline = useCallback((date: Date, events: Event[]) => {
    navigate('dateTimeline', { date, dateEvents: events });
  }, [navigate]);

  const navigateToModule = useCallback(async (slug: string) => {
    const module = await apiService.getModuleBySlug(slug);
    if (module) {
      navigate('module', { module });
      return;
    }
    const timeline = await apiService.getTimelineBySlug(slug);
    if (timeline) {
      navigateToTimeline(slug);
    }
  }, [navigate, navigateToTimeline]);

  const navigateToEventBySlug = useCallback(async (slug: string) => {
    const event = await apiService.getEventBySlug(slug);
    if (event) viewEvent(event);
  }, [viewEvent]);

  const viewEventById = useCallback(async (eventId: string) => {
    const event = await apiService.getEventById(eventId);
    if (event) viewEvent(event);
  }, [viewEvent]);

  const legacyNavigateTo = useCallback((v: string, id?: string) => {
    navigate(v as AppView, id ? { id } : undefined);
  }, [navigate]);

  const navigateToHeritage = useCallback((item: HeritageItem) => {
    navigate('heritageDetail', { heritageItem: item });
  }, [navigate]);

  const navigateToHeritageList = useCallback(() => {
    navigate('heritageList');
  }, [navigate]);

  // ── View renderer ─────────────────────────────────────────────────────────

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <HomePage
            onViewEvent={viewEvent}
            navigateToModule={navigateToModule}
          />
        );

      case 'calendar':
        return (
          <CalendarPage
            onViewEvent={viewEvent}
            navigateToModule={navigateToModule}
            navigateToEventBySlug={navigateToEventBySlug}
            navigateToDateTimeline={navigateToDateTimeline}
          />
        );

      case 'favorites':
        return (
          <FavoritesPage
            onViewEvent={viewEvent}
            navigateToModule={navigateToModule}
            navigateToTimeline={(slug) => navigateToTimeline(slug)}
          />
        );

      case 'modules':
        return <ModulesIndexPage navigateToModule={navigateToModule} />;

      case 'timelines':
        return (
          <TimelineListingPage
            onSelectTimeline={(slug) => navigateToTimeline(slug)}
          />
        );

      case 'timeline':
        return (
          <TimelinePage
            onViewEvent={viewEvent}
            timelineSlug={payload.timelineSlug ?? null}
            initialEventId={payload.timelineEventId ?? null}
            onBack={goBack}
          />
        );

      case 'dateTimeline':
        return payload.date ? (
          <DateTimelinePage
            onViewEvent={viewEvent}
            events={payload.dateEvents ?? []}
            date={payload.date}
            onBack={goBack}
          />
        ) : (
          <CalendarPage
            onViewEvent={viewEvent}
            navigateToModule={navigateToModule}
            navigateToEventBySlug={navigateToEventBySlug}
            navigateToDateTimeline={navigateToDateTimeline}
          />
        );

      case 'event':
        return payload.event ? (
          <EventDetailPage
            event={payload.event}
            onBack={goBack}
            fromView={previousView ?? 'home'}
            navigateToModule={navigateToModule}
            navigateToTimeline={navigateToTimeline}
            navigateToHeritage={navigateToHeritage}
            navigateToHeritageList={navigateToHeritageList}
          />
        ) : (
          <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />
        );

      case 'module':
        return payload.module ? (
          <ModulePage
            module={payload.module}
            onNavigateToEvent={viewEventById}
            onBack={goBack}
            navigateTo={legacyNavigateTo as any}
          />
        ) : (
          <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />
        );

      case 'offlineScorm':
        return (
          <ScormPlayerPage
            baseUrl={payload.id ?? ''}
            onBack={goBack}
          />
        );

      case 'offlineH5p':
        return (
          <H5pPlayerPage
            baseUrl={payload.id ?? ''}
            onBack={goBack}
          />
        );

      case 'heritageList':
        return (
          <HeritageDiscoveryPage
            onBack={goBack}
            onSelect={navigateToHeritage}
          />
        );

      case 'heritageDetail':
        return payload.heritageItem ? (
          <HeritageDetailPage
            item={payload.heritageItem}
            onBack={goBack}
          />
        ) : (
          <HeritageDiscoveryPage onBack={goBack} onSelect={navigateToHeritage} />
        );

      default:
        return (
          <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />
        );
    }
  };

  // ── Layout selection ──────────────────────────────────────────────────────

  const isImmersive = view === 'timeline' || view === 'dateTimeline';
  const isOffline   = view === 'offlineScorm' || view === 'offlineH5p';

  if (isImmersive) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen">
        <Suspense fallback={<PageLoader />}>{renderView()}</Suspense>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="bg-light min-h-screen">
        <Suspense fallback={<PageLoader />}>{renderView()}</Suspense>
      </div>
    );
  }

  return (
    <Layout currentView={view as any} navigateTo={legacyNavigateTo as any}>
      <Suspense fallback={<PageLoader />}>{renderView()}</Suspense>
    </Layout>
  );
};
