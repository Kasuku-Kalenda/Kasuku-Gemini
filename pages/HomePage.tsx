
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { Event, Theme, FeaturedStory } from '../types';
import { getEventBySlug, getEvents, getThemes, getFeaturedItems } from '../services/api';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { useFavorites } from '../hooks/useFavorites';
import { SearchIcon } from '../components/icons/SearchIcon';
import { FeaturedStories } from '../components/home/FeaturedStories';

type ViewMode = 'grid' | 'list';
type SortKey  = 'default' | 'alpha-asc' | 'alpha-desc' | 'date-asc' | 'date-desc';

interface HomePageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  scrollToId?: string | null;
  onScrolled?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewEvent, navigateToModule, scrollToId, onScrolled }) => {
  const [events, setEvents]           = useState<Event[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [query, setQuery]             = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [themes, setThemes]           = useState<Theme[]>([]);
  const [view, setView]               = useState<ViewMode>('grid');
  const [sort, setSort]               = useState<SortKey>('default');
  const { exists, toggle }            = useFavorites();
  const isInitialMount                = useRef(true);

  const [featuredItems, setFeaturedItems] = useState<FeaturedStory[]>([]);
  const [allEvents, setAllEvents]     = useState<Event[]>([]);
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const searchContainerRef            = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollToId && onScrolled) {
      const el = document.getElementById(`event-card-${scrollToId}`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
      onScrolled();
    }
  }, [scrollToId, onScrolled]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [initialEvents, fetchedThemes, featured] = await Promise.all([
        getEvents(), getThemes(), getFeaturedItems(),
      ]);
      setEvents(initialEvents);
      setAllEvents(initialEvents);
      setThemes(fetchedThemes);
      setFeaturedItems(featured);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const h = setTimeout(() => {
      setIsLoading(true);
      getEvents({ query, theme: selectedTheme }).then(e => { setEvents(e); setIsLoading(false); });
    }, 500);
    return () => clearTimeout(h);
  }, [query, selectedTheme]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node))
        setIsSuggestionsVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (v.length > 1) {
      setSuggestions(allEvents.filter(ev => ev.title.toLowerCase().includes(v.toLowerCase())).slice(0, 5));
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleFeaturedEvent = useCallback(async (slug: string) => {
    const event = allEvents.find(e => e.slug === slug) ?? await getEventBySlug(slug);
    if (event) onViewEvent(event);
  }, [allEvents, onViewEvent]);

  const sortedEvents = useMemo(() => {
    if (sort === 'default') return events;
    const list = [...events];
    switch (sort) {
      case 'alpha-asc':  list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'alpha-desc': list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'date-desc':  list.sort((a, b) => (b.dateISO ?? '').localeCompare(a.dateISO ?? '')); break;
      case 'date-asc':   list.sort((a, b) => (a.dateISO ?? '').localeCompare(b.dateISO ?? '')); break;
    }
    return list;
  }, [events, sort]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16 md:pb-4">

      {/* ── À la une — strip full-width ───────────────────────────────────── */}
      {featuredItems.length > 0 && (
        <FeaturedStories
          items={featuredItems}
          onNavigateToModule={navigateToModule}
          onNavigateToEvent={handleFeaturedEvent}
        />
      )}

      {/* ── Hero texte — visible seulement si pas de featured ─────────────── */}
      {featuredItems.length === 0 && (
        <div className="text-center p-8 bg-card rounded-2xl shadow-soft">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">
            Découvrez l'Histoire, un jour à la fois
          </h1>
          <p className="mt-3 text-base text-dark/70 max-w-2xl mx-auto">
            Explorez les événements culturels et historiques marquants du monde entier.
          </p>
        </div>
      )}

      {/* ── Filtres + résultats ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl shadow-soft">

        {/* Barre de filtres */}
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-0" ref={searchContainerRef}>
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher des événements, personnages, lieux…"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => { if (query.length > 1 && suggestions.length > 0) setIsSuggestionsVisible(true); }}
                className="w-full pl-10 pr-4 h-11 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-base"
                autoComplete="off"
              />
              {isSuggestionsVisible && suggestions.length > 0 && (
                <ul className="absolute top-full w-full mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map(event => (
                    <li
                      key={event.id}
                      className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-0"
                      onClick={() => { setQuery(event.title); setSuggestions([]); setIsSuggestionsVisible(false); }}
                      tabIndex={0}
                      onKeyPress={e => e.key === 'Enter' && (() => { setQuery(event.title); setSuggestions([]); setIsSuggestionsVisible(false); })()}
                    >
                      {event.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Thème */}
            <select
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              className="w-full sm:w-auto h-11 px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white text-base"
            >
              <option value="">Tous les thèmes</option>
              {themes.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
            </select>
          </div>

          {/* Tri + vue */}
          <div className="flex items-center gap-2 justify-between">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="flex-1 sm:flex-none h-10 px-3 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="default">Tri par défaut</option>
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
              <option value="date-desc">Plus récents</option>
              <option value="date-asc">Plus anciens</option>
            </select>

            <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
              {(['grid', 'list'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`no-min-h px-3 py-2.5 transition-colors ${view === v ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
                  aria-label={v === 'grid' ? 'Vue grille' : 'Vue liste'}
                >
                  {v === 'grid' ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compteur */}
        {!isLoading && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-xs text-muted-foreground">
              {sortedEvents.length} événement{sortedEvents.length !== 1 ? 's' : ''}
              {query ? ` pour « ${query} »` : ''}
              {selectedTheme ? ` · thème filtré` : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Grille / Liste d'événements ─────────────────────────────────────── */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        )
      ) : sortedEvents.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {sortedEvents.map(event => (
              <EventCard
                key={event.id}
                id={`event-card-${event.id}`}
                event={event}
                onView={() => onViewEvent(event)}
                isFavorite={exists('event', event.id)}
                onToggleFavorite={() => toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media[0]?.url })}
                onViewModule={navigateToModule}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                className="group flex items-center gap-4 p-3 sm:p-4 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-md cursor-pointer transition-all"
                onClick={() => onViewEvent(event)}
              >
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
                  {event.media[0]?.url ? (
                    <img src={event.media[0].url} alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer" />
                  ) : <div className="w-full h-full bg-primary/10" />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {event.dateISO ?? event.period}{event.countryCode ? ` · ${event.countryCode}` : ''}
                  </p>
                  <p className="font-bold text-secondary leading-snug truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  {event.themes?.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {event.themes.map(t => t.name).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  className="no-min-h shrink-0 p-2.5 rounded-full transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={e => { e.stopPropagation(); toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media[0]?.url }); }}
                  aria-label={exists('event', event.id) ? 'Retirer' : 'Sauvegarder'}
                >
                  <svg className={`h-4 w-4 ${exists('event', event.id) ? 'fill-current text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl shadow-soft">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="text-xl font-semibold">Aucun événement trouvé</h3>
          <p className="text-muted-foreground mt-2 text-sm">Essayez d'ajuster votre recherche ou vos filtres.</p>
        </div>
      )}
    </div>
  );
};
