
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
  const [selectedEra, setSelectedEra]              = useState<number | null>(null);
  const [themes, setThemes]                 = useState<Theme[]>([]);
  const [countries, setCountries]           = useState<{ code: string; name: string }[]>([]);
  const [filters, setFilters]               = useState<Filters>({ query: '', theme: '', country: '', year: '' });
  const [featuredItems, setFeaturedItems]   = useState<FeaturedStory[]>([]);
  const { exists, toggle }                  = useFavorites();

  // ─── Desktop full-screen modal state ─────────────────────────────────────
  const [desktopEventIdx, setDesktopEventIdx] = useState(0);
  const [desktopSidebar, setDesktopSidebar]   = useState(true);

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

  // Reset desktop event index when date or events change
  useEffect(() => { setDesktopEventIdx(0); }, [selectedDate]);

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

          {/* ── Hint desktop — visible tant qu'aucune date n'est sélectionnée ── */}
          <div className="hidden lg:block">
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

          {/* ── Périodes & siècles — grille de cartes ─────────────────────────── */}
          {approximateByEra.length > 0 && (
            <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b flex items-center gap-2">
                <span className="text-base">⏳</span>
                <div>
                  <h2 className="font-black text-secondary text-sm uppercase tracking-widest">
                    Périodes & siècles
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {approximateEvents.length} événement{approximateEvents.length > 1 ? 's' : ''} sans date exacte
                  </p>
                </div>
              </div>

              {/* Grille de cartes siècle */}
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {approximateByEra.map(({ era, events }, eraIdx) => {
                  const isSelected = selectedEra === era;
                  const coverImg   = events.find(e => e.media[0]?.url)?.media[0]?.url;
                  const mainTheme  = events.find(e => e.themes?.[0])?.themes?.[0];

                  return (
                    <motion.button
                      key={era}
                      onClick={() => setSelectedEra(isSelected ? null : era)}
                      className="group relative w-full rounded-2xl overflow-hidden text-left focus-visible:ring-2 ring-primary ring-offset-2 outline-none"
                      style={{ aspectRatio: '4 / 3' }}
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                      {/* Image de fond */}
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={formatEra(era)}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading={eraIdx < 6 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/40" />
                      )}

                      {/* Overlay gradient */}
                      <div className={`absolute inset-0 transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-t from-primary/85 via-primary/40 to-primary/10 ring-2 ring-primary ring-inset'
                          : 'bg-gradient-to-t from-black/75 via-black/20 to-transparent'
                      }`} />

                      {/* Compteur — top right */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white text-primary' : 'bg-black/40 text-white backdrop-blur-sm'
                        }`}>
                          {events.length}
                        </span>
                      </div>

                      {/* Thème chip — top left */}
                      {mainTheme && (
                        <div className="absolute top-2 left-2 z-10">
                          <span
                            className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white shadow"
                            style={{ backgroundColor: (mainTheme as any).color || '#94a3b8' }}
                          >
                            {mainTheme.name}
                          </span>
                        </div>
                      )}

                      {/* Titre + CTA en bas */}
                      <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 z-10">
                        <p className="text-white font-black text-sm leading-tight drop-shadow-lg">
                          {formatEra(era)}
                        </p>
                        <p className={`text-[10px] mt-0.5 transition-colors ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                          {isSelected ? 'Fermer ↑' : 'Explorer →'}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Panel événements — s'affiche sous la grille quand un siècle est sélectionné */}
              <AnimatePresence initial={false}>
                {selectedEra !== null && (() => {
                  const group = approximateByEra.find(g => g.era === selectedEra);
                  if (!group) return null;
                  return (
                    <motion.div
                      key={selectedEra}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t"
                    >
                      {/* Sub-header du siècle sélectionné */}
                      <div className="px-4 py-3 bg-primary/5 flex items-center justify-between">
                        <div>
                          <p className="font-black text-secondary text-sm">{formatEra(selectedEra)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {group.events.length} événement{group.events.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedEra(null)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                          aria-label="Fermer"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Grille d'événements 2 col sur desktop, 1 sur mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                        {group.events.slice(0, 6).map(event => (
                          <button
                            key={event.id}
                            onClick={() => onViewEvent(event)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left group border-b border-border/30"
                          >
                            <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-muted">
                              {event.media[0]?.url ? (
                                <img src={event.media[0].url} alt={event.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-secondary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                {event.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                {event.displayDate || formatEra(selectedEra)}{event.countryCode ? ` · ${event.countryCode}` : ''}
                              </p>
                            </div>
                            <svg className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        ))}
                      </div>

                      {group.events.length > 6 && (
                        <div className="px-4 py-3 border-t border-border/40 text-center">
                          <p className="text-[11px] text-muted-foreground italic">
                            + {group.events.length - 6} autres événements · affinez avec les filtres
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>

      {/* ── DESKTOP FULL-SCREEN MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            className="hidden lg:flex fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Événement principal — plein écran ─────────────────────────── */}
            <div className="flex-1 relative overflow-hidden">
              {/* Image de fond */}
              {(() => {
                const evt = eventsForDate[desktopEventIdx] ?? eventsForDate[0];
                if (!evt && isLoadingDate) {
                  return <div className="absolute inset-0 bg-zinc-900 animate-pulse" />;
                }
                if (!evt) {
                  return (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex flex-col items-center justify-center">
                      <p className="text-white/50 text-6xl mb-4">📅</p>
                      <p className="text-white/70 text-lg font-bold">Aucun événement pour cette date</p>
                    </div>
                  );
                }
                return (
                  <>
                    {/* Background */}
                    {evt.media[0]?.url ? (
                      <motion.img
                        key={evt.id}
                        src={evt.media[0].url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/40" />
                    )}

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                    {/* Navigation arrows — visible si plusieurs événements */}
                    {eventsForDate.length > 1 && (
                      <>
                        <button
                          onClick={() => setDesktopEventIdx(i => Math.max(0, i - 1))}
                          disabled={desktopEventIdx === 0}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all disabled:opacity-20 z-10"
                          aria-label="Précédent"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 18l-6-6 6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDesktopEventIdx(i => Math.min(eventsForDate.length - 1, i + 1))}
                          disabled={desktopEventIdx >= eventsForDate.length - 1}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all disabled:opacity-20 z-10"
                          aria-label="Suivant"
                          style={{ right: desktopSidebar ? 'calc(20rem + 1rem)' : '1rem' }}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Dots pagination */}
                    {eventsForDate.length > 1 && eventsForDate.length <= 10 && (
                      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                        {eventsForDate.slice(0, Math.min(5, eventsForDate.length)).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setDesktopEventIdx(i)}
                            className={`rounded-full transition-all ${i === desktopEventIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Contenu texte bas */}
                    <motion.div
                      key={evt.id + '-text'}
                      className="absolute bottom-0 inset-x-0 px-10 pb-10 z-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                    >
                      {/* Date + thème */}
                      <div className="flex items-center gap-3 mb-3">
                        {evt.themes?.[0] && (
                          <span
                            className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white"
                            style={{ backgroundColor: (evt.themes[0] as any).color || '#E67E22' }}
                          >
                            {evt.themes[0].name}
                          </span>
                        )}
                        {evt.dateISO && (
                          <span className="text-white/60 text-sm font-semibold">
                            {formatDate(new Date(evt.dateISO + 'T00:00:00Z'), { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                            {evt.countryCode ? ` · ${evt.countryCode}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h1 className="text-white font-black text-3xl xl:text-4xl leading-tight mb-3 max-w-2xl drop-shadow-lg">
                        {evt.title}
                      </h1>

                      {/* Résumé */}
                      {evt.summary && (
                        <p className="text-white/75 text-base leading-relaxed mb-5 max-w-xl line-clamp-3">
                          {evt.summary}
                        </p>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => { closeSheet(); onViewEvent(evt); }}
                        className="inline-flex items-center gap-2 bg-white text-secondary font-black px-6 py-3 rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl text-sm"
                      >
                        Lire la suite
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </motion.div>
                  </>
                );
              })()}

              {/* ── Top bar ─────────────────────────────────────────────────── */}
              <div className="absolute top-0 inset-x-0 px-6 py-5 flex items-center justify-between z-20">
                {/* Fermer */}
                <button
                  onClick={closeSheet}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                  aria-label="Fermer"
                >
                  <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold hidden xl:block">Fermer</span>
                </button>

                {/* Date sélectionnée */}
                <div className="text-center">
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Événements du</p>
                  <p className="text-white font-black text-lg leading-tight capitalize">{formattedDate}</p>
                  {eventsForDate.length > 0 && (
                    <p className="text-white/50 text-xs mt-0.5">
                      {desktopEventIdx + 1} / {eventsForDate.length} événement{eventsForDate.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Toggle sidebar */}
                {eventsForDate.length > 1 && (
                  <button
                    onClick={() => setDesktopSidebar(p => !p)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                    aria-label={desktopSidebar ? 'Masquer la liste' : 'Afficher la liste'}
                  >
                    <span className="text-sm font-bold hidden xl:block">
                      {desktopSidebar ? 'Masquer liste' : 'Voir la liste'}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6h16M4 12h16M4 18h7" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </button>
                )}
                {eventsForDate.length <= 1 && <div className="w-10" />}
              </div>
            </div>

            {/* ── Sidebar rétractable ─────────────────────────────────────────── */}
            <AnimatePresence>
              {desktopSidebar && eventsForDate.length > 1 && (
                <motion.div
                  className="w-80 xl:w-96 bg-card/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden shrink-0"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
                >
                  {/* Sidebar header */}
                  <div className="px-5 py-5 border-b shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ce jour-là</p>
                    <h3 className="font-black text-secondary text-base leading-tight mt-0.5 capitalize">{formattedDate}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {eventsForDate.length} événement{eventsForDate.length !== 1 ? 's' : ''} historique{eventsForDate.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Liste des événements */}
                  <div className="flex-1 overflow-y-auto divide-y">
                    {isLoadingDate ? (
                      <div className="p-4 space-y-3">
                        <EventCardSkeleton />
                        <EventCardSkeleton />
                        <EventCardSkeleton />
                      </div>
                    ) : (
                      eventsForDate.slice(0, 5).map((event, i) => (
                        <button
                          key={event.id}
                          onClick={() => setDesktopEventIdx(i)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors group ${
                            i === desktopEventIdx ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/60'
                          }`}
                        >
                          <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted">
                            {event.media[0]?.url ? (
                              <img
                                src={event.media[0].url}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm leading-snug line-clamp-2 transition-colors ${
                              i === desktopEventIdx ? 'text-primary' : 'text-secondary group-hover:text-primary'
                            }`}>
                              {event.title}
                            </p>
                            {event.countryCode && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{event.countryCode}</p>
                            )}
                          </div>
                          <button
                            className="shrink-0 p-1.5 rounded-full transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={e => {
                              e.stopPropagation();
                              toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media[0]?.url });
                            }}
                            aria-label={exists('event', event.id) ? 'Retirer' : 'Sauvegarder'}
                          >
                            <svg className={`h-3.5 w-3.5 ${exists('event', event.id) ? 'fill-current text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </button>
                      ))
                    )}
                  </div>

                  {/* "Voir plus" si > 5 événements */}
                  {eventsForDate.length > 5 && (
                    <div className="px-4 py-4 border-t shrink-0">
                      <button
                        onClick={() => { closeSheet(); navigateToDateTimeline(selectedDate!, eventsForDate); }}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-secondary text-white rounded-2xl font-black text-sm hover:bg-secondary/90 active:scale-95 transition-all shadow-md"
                      >
                        <span>Voir plus</span>
                        <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                          <span className="text-xs font-black">+{eventsForDate.length - 5}</span>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="lg:hidden fixed inset-x-0 z-50 bg-card flex flex-col"
              style={{
                bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
                borderRadius: '2rem 2rem 0 0',
                maxHeight: '82vh',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                paddingBottom: '1rem',
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
