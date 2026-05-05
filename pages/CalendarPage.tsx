
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar } from '../components/ui/Calendar';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { getEvents, getThemes, getCountries, getFeaturedItems } from '../services/api';
import type { Event, Theme, FeaturedStory } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { formatDate } from '../utils/helpers';
import { FeaturedStories } from '../components/home/FeaturedStories';
import { UnifiedSearchBar, Filters } from '../components/UnifiedSearchBar';

interface CalendarPageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  navigateToEventBySlug: (slug: string) => void;
  navigateToDateTimeline: (date: Date, events: Event[]) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onViewEvent, navigateToModule, navigateToEventBySlug, navigateToDateTimeline,
}) => {
  const [selectedDate, setSelectedDate]   = useState<Date | undefined>(undefined);
  const [eventsForDate, setEventsForDate] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [allEventsCache, setAllEventsCache] = useState<Event[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [themes, setThemes]               = useState<Theme[]>([]);
  const [countries, setCountries]         = useState<{ code: string; name: string }[]>([]);
  const [filters, setFilters]             = useState<Filters>({ query: '', theme: '', country: '', year: '' });
  const [featuredItems, setFeaturedItems] = useState<FeaturedStory[]>([]);
  const { exists, toggle }                = useFavorites();

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [fetchedThemes, fetchedCountries, initialEvents, featured] = await Promise.all([
        getThemes(), getCountries(), getEvents(), getFeaturedItems(),
      ]);
      setThemes(fetchedThemes);
      setCountries(fetchedCountries);
      setFilteredEvents(initialEvents);
      setAllEventsCache(initialEvents);
      setFeaturedItems(featured);
      setIsLoading(false);
    })();
  }, []);

  // ─── Filtered fetch (debounced) ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      const year = filters.year ? parseInt(filters.year, 10) : undefined;
      getEvents({ query: filters.query, theme: filters.theme, country: filters.country, year: isNaN(year!) ? undefined : year })
        .then(data => { setFilteredEvents(data); setIsLoading(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  // ─── Calendar data ─────────────────────────────────────────────────────────
  const eventsByDayOfYear = useMemo(() => {
    const map: Record<string, Event[]> = {};
    filteredEvents.forEach(event => {
      if (event.dateISO) {
        const key = event.dateISO.substring(5);
        if (!map[key]) map[key] = [];
        map[key].push(event);
      }
    });
    return map;
  }, [filteredEvents]);

  // ─── Date selection ────────────────────────────────────────────────────────
  const handleSelectDate = useCallback((date: Date | undefined) => setSelectedDate(date), []);

  useEffect(() => {
    if (selectedDate) {
      const key = `${String(selectedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(selectedDate.getUTCDate()).padStart(2, '0')}`;
      setEventsForDate(eventsByDayOfYear[key] || []);
    } else {
      setEventsForDate([]);
    }
  }, [selectedDate, eventsByDayOfYear]);

  const handleSuggestionSelected = useCallback((event: Event) => {
    if (event.dateISO) {
      setFilters({ query: event.title, theme: '', country: '', year: '' });
      const [y, m, d] = event.dateISO.split('-').map(Number);
      setSelectedDate(new Date(Date.UTC(y, m - 1, d)));
    }
  }, []);

  const formattedDate = selectedDate
    ? formatDate(selectedDate, { year: undefined, month: 'long', day: 'numeric', timeZone: 'UTC' })
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-16 md:pb-4 space-y-0">

      {/* ── À la une — strip full-width ───────────────────────────────────── */}
      {featuredItems.length > 0 && (
        <div className="mb-6">
          <FeaturedStories
            items={featuredItems}
            onNavigateToModule={navigateToModule}
            onNavigateToEvent={navigateToEventBySlug}
          />
        </div>
      )}

      {/* ── Corps — 2 colonnes desktop / 1 colonne mobile ─────────────────── */}
      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

        {/* ── COLONNE GAUCHE — Search + panneau de date ───────────────────── */}
        <div className="lg:sticky lg:top-4 space-y-4">

          {/* Barre de recherche + filtres */}
          <UnifiedSearchBar
            themes={themes.map(t => ({ label: t.name, value: t.slug }))}
            countries={countries.map(c => ({ label: c.name, value: c.code }))}
            allEvents={allEventsCache}
            filters={filters}
            onFiltersChange={setFilters}
            onSuggestionSelect={handleSuggestionSelected}
          />

          {/* Panneau d'événements pour la date sélectionnée */}
          {selectedDate ? (
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Événements du
                  </p>
                  <h2 className="font-black text-secondary text-lg leading-tight capitalize">
                    {formattedDate}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {eventsForDate.length} événement{eventsForDate.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="text-muted-foreground hover:text-secondary p-1.5 rounded-full hover:bg-muted transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Liste d'événements */}
              <div className="divide-y max-h-[calc(100vh-280px)] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                  </div>
                ) : eventsForDate.length > 0 ? (
                  <>
                    {eventsForDate.slice(0, 5).map(event => (
                      <div
                        key={event.id}
                        className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => onViewEvent(event)}
                      >
                        <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-muted">
                          {event.media[0]?.url ? (
                            <img src={event.media[0].url} alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-primary/10" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-secondary truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          {event.countryCode && (
                            <p className="text-[10px] text-muted-foreground">{event.countryCode}</p>
                          )}
                        </div>
                        <button
                          className="shrink-0 p-1.5 rounded-full transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={e => { e.stopPropagation(); toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media[0]?.url }); }}
                          aria-label={exists('event', event.id) ? 'Retirer' : 'Sauvegarder'}
                        >
                          <svg className={`h-3.5 w-3.5 ${exists('event', event.id) ? 'fill-current text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {eventsForDate.length > 5 && (
                      <button
                        onClick={() => selectedDate && navigateToDateTimeline(selectedDate, eventsForDate)}
                        className="w-full py-3 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors"
                      >
                        Voir les {eventsForDate.length - 5} autres →
                      </button>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <p className="text-3xl mb-2">📅</p>
                    <p>Aucun événement pour cette date.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Placeholder quand aucune date sélectionnée */
            <div className="hidden lg:flex flex-col items-center justify-center gap-3 bg-card rounded-2xl shadow-soft p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                📅
              </div>
              <div>
                <p className="font-bold text-secondary">Explorez le calendrier</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur une date pour voir<br />les événements historiques.
                </p>
              </div>
              {filteredEvents.length > 0 && (
                <div className="mt-2 text-[11px] text-muted-foreground bg-muted/50 rounded-xl px-4 py-2">
                  {filteredEvents.length} événements chargés
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE — Grand calendrier ─────────────────────────────── */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          {/* Header calendrier */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b">
            <h2 className="font-black text-secondary text-sm uppercase tracking-widest">Calendrier</h2>
            <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-3 py-1">
              {Object.keys(eventsByDayOfYear).length} dates avec événements
            </span>
          </div>

          {/* Calendrier pleine largeur */}
          <div className="p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              eventsByDayOfYear={eventsByDayOfYear}
              className="w-full"
            />
          </div>

          <div className="px-4 pb-3 text-center text-muted-foreground text-[10px] border-t pt-2 opacity-50">
            Cliquez sur une date pour voir les événements historiques.
          </div>
        </div>

      </div>

      {/* ── Panneau mobile : drawer bas ────────────────────────────────────── */}
      {selectedDate && eventsForDate.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-16 z-50 bg-card rounded-t-3xl shadow-2xl border-t max-h-[60vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Header */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <div>
              <p className="font-black text-secondary capitalize">{formattedDate}</p>
              <p className="text-xs text-muted-foreground">{eventsForDate.length} événement{eventsForDate.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setSelectedDate(undefined)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Fermer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          {/* Events */}
          <div className="overflow-y-auto flex-1 divide-y pb-4">
            {eventsForDate.slice(0, 4).map(event => (
              <div
                key={event.id}
                className="group flex items-center gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => onViewEvent(event)}
              >
                <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-muted">
                  {event.media[0]?.url ? (
                    <img src={event.media[0].url} alt={event.title}
                      className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : <div className="w-full h-full bg-primary/10" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-secondary truncate">{event.title}</p>
                  {event.countryCode && <p className="text-[10px] text-muted-foreground">{event.countryCode}</p>}
                </div>
              </div>
            ))}
            {eventsForDate.length > 4 && (
              <button
                onClick={() => selectedDate && navigateToDateTimeline(selectedDate, eventsForDate)}
                className="w-full py-3 text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/5 transition-colors"
              >
                Voir tous les {eventsForDate.length} événements →
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
