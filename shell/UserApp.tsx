/**
 * shell/UserApp.tsx — Public-facing shell
 *
 * Handles all user views. Admin views are handled by AdminApp.tsx.
 * Uses NavigationContext instead of prop-drilled navigateTo callbacks.
 */

import React, { useCallback } from 'react';
import { useNavigation } from '../core/navigation';
import type { AppView } from '../core/navigation';
import { Layout } from '../components/Layout';
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { TimelineListingPage } from '../pages/TimelineListingPage';
import { TimelinePage } from '../pages/TimelinePage';
import { ModulePage } from '../pages/ModulePage';
import { ModulesIndexPage } from '../pages/ModulesIndexPage';
import { DateTimelinePage } from '../pages/DateTimelinePage';
import { ScormPlayerPage } from '../pages/offline/ScormPlayerPage';
import { H5pPlayerPage } from '../pages/offline/H5pPlayerPage';
import { apiService } from '../services/api.service';
import type { Event } from '../types';

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

  // Adapter: Layout/BottomNav use the old (view, id?) signature
  const legacyNavigateTo = useCallback((v: string, id?: string) => {
    navigate(v as AppView, id ? { id } : undefined);
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

      default:
        return (
          <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />
        );
    }
  };

  // ── Layout selection ──────────────────────────────────────────────────────

  const isImmersive = view === 'timeline' || view === 'dateTimeline';
  const isOffline = view === 'offlineScorm' || view === 'offlineH5p';

  if (isImmersive) {
    return <div className="bg-[#FAF8F5] min-h-screen">{renderView()}</div>;
  }

  if (isOffline) {
    return <div className="bg-light min-h-screen">{renderView()}</div>;
  }

  return (
    <Layout
      currentView={view as any}
      navigateTo={legacyNavigateTo as any}
    >
      {renderView()}
    </Layout>
  );
};
