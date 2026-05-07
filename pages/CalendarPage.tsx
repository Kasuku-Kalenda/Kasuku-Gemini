
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from '../components/ui/Calendar';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { getEvents, getCalendarDays, getApproximateEvents, getThemes, getCountries, getFeaturedItems } from '../services/api';
import type { CalendarDay } from '../services/api';
import type { Event, Theme, FeaturedStory } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { formatDate } from '../utils/helpers';
import { FeaturedStories } from '../components/home/FeaturedStories';
import { UnifiedSearchBar, Filters } from '../components/UnifiedSearchBar';

// Convertit un numéro de siècle ou décennie en libellé lisible
// ex: 18 → "XVIIIe siècle", 1960 → "Années 1960", 9 → "IXe siècle"
function formatEra(n: number): string {
  if (n === 0) return 'Époque inconnue';
  if (n >= 1000) return `Années ${n}`; // décennie (ex: 1960)
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let roman = '';
  let num = Math.abs(n);
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { roman += syms[i]; num -= vals[i]; }
  }
  const suffix = n < 0 ? 'e siècle av. J.-C.' : 'e siècle';
  return roman + suffix;
}

interface CalendarPageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  navigateToEventBySlug: (slug: string) => void;
  navigateToDateTimeline: (date: Date, events: Event[]) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onViewEvent, navigateToModule, navigateToEventBySlug, navigateToDateTimeline,
}) => {
  const [selectedDate, setSelectedDate]     = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth]   = useState<Date>(new Date());
  const [calendarDays, setCalendarDays]     = useState<Record<string, CalendarDay>>({});
  const [eventsForDate, setEventsForDate]   = useState<Event[]>([]);
  const [allEventsCache, setAllEventsCache] = useState<Event[]>([]);
  const [approximateEvents, setApproximateEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [isLoadingDate, setIsLoadingDate]          = useState(false);
  const [expandedEras, setExpandedEras]            = useState<Set<number>>(new Set());
  const [themes, setThemes]                 = useState<Theme[]>([]);
  const [countries, setCountries]           = useState<{ code: string; name: string }[]>([]);
  const [filters, setFilters]               = useState<Filters>({ query: '', theme: '', country: '', year: '' });
  const [featuredItems, setFeaturedItems]   = useState<FeaturedStory[]>([]);
  const { exists, toggle }                  = useFavorites();

  // Ref pour debounce de la recherche texte
  const calendarFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Init : données de base + cache pour l'autocomplete ───────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [fetchedThemes, fetchedCountries, featured, eventsCache] = await Promise.all([
        getThemes(),
        getCountries(),
        getFeaturedItems(),
        getEvents({ limit: 200 }), // cache léger pour l'autocomplete
      ]);
      setThemes(fetchedThemes);
      setCountries(fetchedCountries);
      setFeaturedItems(featured);
      setAllEventsCache(eventsCache);
      setIsLoading(false);
    })();
  }, []);

  // ─── Calendar days : re-fetch quand le mois ou les filtres changent ────────
  useEffect(() => {
    const month = calendarMonth.getUTCMonth() + 1;
    const year  = filters.year ? parseInt(filters.year, 10) : undefined;
    const validYear = year && !isNaN(year) ? year : undefined;
    let cancelled = false;

    const doFetch = () => {
      setCalendarDays({});
      getCalendarDays(month, {
        q:       filters.query   || undefined,
        theme:   filters.theme   || undefined,
        country: filters.country || undefined,
        year:    validYear,
      }).then(days => { if (!cancelled) setCalendarDays(days); });
    };

    // Debounce uniquement sur la saisie texte
    if (calendarFetchTimer.current) clearTimeout(calendarFetchTimer.current);
    if (filters.query) {
      calendarFetchTimer.current = setTimeout(doFetch, 300);
    } else {
      doFetch();
    }

    return () => {
      cancelled = true;
      if (calendarFetchTimer.current) clearTimeout(calendarFetchTimer.current);
    };
  }, [calendarMonth, filters.query, filters.theme, filters.country, filters.year]);

  // ─── Événements approximatifs (sans date exacte) ──────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      getApproximateEvents({
        q:       filters.query   || undefined,
        theme:   filters.theme   || undefined,
        country: filters.country || undefined,
      }).then(setApproximateEvents);
    }, filters.query ? 300 : 0);
    return () => clearTimeout(t);
  }, [filters.query, filters.theme, filters.country]);

  // ─── Événements pour la date sélectionnée ─────────────────────────────────
  // Se re-déclenche aussi quand les filtres changent (pour cohérence avec les dots)
  useEffect(() => {
    if (!selectedDate) { setEventsForDate([]); return; }

    const month = selectedDate.getUTCMonth() + 1;
    const day   = selectedDate.getUTCDate();
    const year  = filters.year ? parseInt(filters.year, 10) : undefined;
    const validYear = year && !isNaN(year) ? year : undefined;

    setIsLoadingDate(true);
    getEvents({
      month,
      day,
      query:   filters.query   || undefined,
      theme:   filters.theme   || undefined,
      country: filters.country || undefined,
      year:    validYear,
      limit:   100,
    }).then(events => {
      setEventsForDate(events);
      setIsLoadingDate(false);
    });
  }, [selectedDate, filters.query, filters.theme, filters.country, filters.year]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectDate = useCallback((date: Date | undefined) => setSelectedDate(date), []);

  const toggleEra = useCallback((era: number) => {
    setExpandedEras(prev => {
      const next = new Set(prev);
      if (next.has(era)) next.delete(era); else next.add(era);
      return next;
    });
  }, []);

  const handleNavigateToYear = useCallback((year: number) => {
    setCalendarMonth(new Date(Date.UTC(year, 0, 1)));
  }, []);

  const handleSuggestionSelected = useCallback((event: Event) => {
    if (event.dateISO) {
      setFilters({ query: event.title, theme: '', country: '', year: '' });
      const [y, m, d] = event.dateISO.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      setSelectedDate(date);
      setCalendarMonth(date);
    }
  }, []);

  const closeSheet = useCallback(() => setSelectedDate(undefined), []);

  // ─── Dérivés ───────────────────────────────────────────────────────────────
  const totalCalendarCount = useMemo(
    () => (Object.values(calendarDays) as CalendarDay[]).reduce((s, d) => s + d.count, 0),
    [calendarDays],
  );

  // ─── Groupement des événements approximatifs par siècle ───────────────────
  const approximateByEra = useMemo(() => {
    const groups = new Map<number, Event[]>();
    for (const evt of approximateEvents) {
      const key = evt.approxCentury ?? evt.approxDecade ?? 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(evt);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(([era, events]) => ({ era, events }));
  }, [approximateEvents]);

  const formattedDate = selectedDate
    ? formatDate(selectedDate, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
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
            onNavigateToYear={handleNavigateToYear}
            resultCount={totalCalendarCount}
          />

          {/* ── Panneau date — DESKTOP UNIQUEMENT ────────────────────────── */}
          <div className="hidden lg:block">
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
                      onClick={closeSheet}
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
                  {isLoadingDate ? (
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
              <div className="flex flex-col items-center justify-center gap-3 bg-card rounded-2xl shadow-soft p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                  📅
                </div>
                <div>
                  <p className="font-bold text-secondary">Explorez le calendrier</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliquez sur une date pour voir<br />les événements historiques.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── COLONNE DROITE — Calendrier + Événements approximatifs ──────── */}
        <div className="space-y-4">

          {/* Grand calendrier */}
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b">
              <h2 className="font-black text-secondary text-sm uppercase tracking-widest">Calendrier</h2>
              <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-3 py-1">
                {Object.keys(calendarDays).length} dates ce mois
              </span>
            </div>
            <div className="p-2 sm:p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                calendarDays={calendarDays}
                className="w-full"
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
              />
            </div>
            <div className="px-4 pb-3 text-center text-muted-foreground text-[10px] border-t pt-2 opacity-50">
              Cliquez sur une date pour voir les événements historiques.
            </div>
          </div>

          {/* ── Événements sans date précise — siècles dépliables ──────────── */}
          {approximateByEra.length > 0 && (
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              {/* Header fixe */}
              <div className="px-4 pt-4 pb-3 border-b flex items-center gap-2">
                <span className="text-base">⏳</span>
                <div>
                  <h2 className="font-black text-secondary text-sm uppercase tracking-widest">
                    Périodes & siècles
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {approximateEvents.length} événement{approximateEvents.length > 1 ? 's' : ''} sans date exacte · cliquez un siècle pour l'explorer
                  </p>
                </div>
              </div>

              {/* Une ligne par siècle */}
              <div className="divide-y">
                {approximateByEra.map(({ era, events }) => {
                  const isOpen = expandedEras.has(era);
                  const PREVIEW = 6;
                  return (
                    <div key={era}>
                      {/* Ligne siècle — toujours visible */}
                      <button
                        onClick={() => toggleEra(era)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-5 rounded-full transition-colors ${isOpen ? 'bg-primary' : 'bg-border'}`} />
                          <span className="font-black text-sm text-secondary group-hover:text-primary transition-colors">
                            {formatEra(era)}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                            {events.length}
                          </span>
                        </div>
                        <motion.svg
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      </button>

                      {/* Événements du siècle — dépliable */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="bg-muted/20 border-t divide-y">
                              {events.slice(0, PREVIEW).map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => onViewEvent(event)}
                                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                                >
                                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted">
                                    {event.media[0]?.url ? (
                                      <img src={event.media[0].url} alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-secondary truncate group-hover:text-primary transition-colors">
                                      {event.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {event.displayDate || formatEra(era)}{event.countryCode ? ` · ${event.countryCode}` : ''}
                                    </p>
                                  </div>
                                  {event.themes?.[0] && (
                                    <span
                                      className="shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                                      style={{ backgroundColor: (event.themes[0] as any).color || '#94a3b8' }}
                                    >
                                      {event.themes[0].name}
                                    </span>
                                  )}
                                </button>
                              ))}
                              {events.length > PREVIEW && (
                                <div className="px-5 py-2.5 text-[11px] text-muted-foreground italic">
                                  + {events.length - PREVIEW} autres événements · affinez avec les filtres
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── MOBILE BOTTOM SHEET — premium, slide-up avec animation spring ─── */}
      <AnimatePresence>
        {selectedDate && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
            />

            {/* Bottom sheet */}
            <motion.div
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-card flex flex-col"
              style={{
                borderRadius: '2rem 2rem 0 0',
                maxHeight: '82vh',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) closeSheet();
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Header */}
              <div className="px-5 pt-2 pb-4 flex items-end justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {formattedDate}
                  </p>
                  <h2 className="text-xl font-black text-secondary leading-tight mt-0.5">
                    {isLoadingDate
                      ? 'Chargement…'
                      : eventsForDate.length === 0
                        ? 'Aucun événement'
                        : `${eventsForDate.length} événement${eventsForDate.length > 1 ? 's' : ''}`}
                  </h2>
                </div>
                <button
                  onClick={closeSheet}
                  className="no-min-h w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Fermer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Scrollable event cards */}
              <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
                {isLoadingDate ? (
                  <div className="space-y-3 pt-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : eventsForDate.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-4xl mb-3">📅</p>
                    <p className="font-semibold">Aucun événement pour cette date</p>
                  </div>
                ) : (
                  eventsForDate.slice(0, 3).map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: 'spring', damping: 26, stiffness: 280 }}
                      className="group relative rounded-2xl overflow-hidden bg-muted cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
                      onClick={() => onViewEvent(event)}
                    >
                      {/* Image banner */}
                      <div className="relative" style={{ aspectRatio: '16 / 7' }}>
                        {event.media[0]?.url ? (
                          <img
                            src={event.media[0].url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30" />
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        {/* Theme chip */}
                        {event.themes?.[0] && (
                          <span className="absolute top-2.5 left-3 text-[10px] font-black uppercase tracking-wider bg-primary text-white px-2.5 py-0.5 rounded-full shadow">
                            {event.themes[0].name}
                          </span>
                        )}
                        {/* Save button */}
                        <button
                          className="absolute top-2.5 right-3 no-min-h p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 active:scale-90 transition-all"
                          onClick={e => {
                            e.stopPropagation();
                            toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media[0]?.url });
                          }}
                          aria-label={exists('event', event.id) ? 'Retirer' : 'Sauvegarder'}
                        >
                          <svg className={`h-3.5 w-3.5 ${exists('event', event.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Text content */}
                      <div className="p-4 bg-card">
                        {event.dateISO && (
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {event.dateISO}
                            {event.countryCode ? ` · ${event.countryCode}` : ''}
                          </p>
                        )}
                        <h3 className="font-black text-secondary text-[15px] leading-snug group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        {event.summary && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {event.summary}
                          </p>
                        )}
                        <div className="mt-3 flex justify-end">
                          <span className="text-xs font-black text-primary uppercase tracking-wider">
                            Lire la suite →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* CTA "Voir tous" — affiché si plus de 3 événements */}
              {eventsForDate.length > 3 && (
                <motion.div
                  className="px-4 pt-3 shrink-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, type: 'spring', damping: 28 }}
                >
                  <button
                    onClick={() => selectedDate && navigateToDateTimeline(selectedDate, eventsForDate)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-secondary text-white rounded-2xl font-black text-sm active:scale-95 transition-transform shadow-lg"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                  >
                    <span>Voir les {eventsForDate.length} événements</span>
                    <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                      <span className="text-xs font-black">{eventsForDate.length - 3} de plus</span>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
