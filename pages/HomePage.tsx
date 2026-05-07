
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Event, Theme, FeaturedStory } from '../types';
import {
  getEvents, getThemes, getFeaturedItems, getCarouselEvents, getEventBySlug,
} from '../services/api';
import { useFavorites } from '../hooks/useFavorites';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { FeaturedStories } from '../components/home/FeaturedStories';
import { normalizeMediaUrl } from '../utils/helpers';

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Compact carousel card ────────────────────────────────────────────────────
const CarouselCard: React.FC<{
  event: Event;
  onView: () => void;
  isFavorite: boolean;
  onToggle: () => void;
}> = ({ event, onView, isFavorite, onToggle }) => {
  const img = event.thumbnailUrl
    ? normalizeMediaUrl(event.thumbnailUrl)
    : event.media?.[0]?.url ?? null;
  const themeColor = (event.themes?.[0] as any)?.color ?? '#94a3b8';

  return (
    <div
      className="relative flex-shrink-0 w-40 sm:w-48 cursor-pointer group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
      style={{ height: '220px' }}
      onClick={onView}
    >
      {img ? (
        <img
          src={img}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: themeColor + '33' }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
        <p className="text-[10px] text-white/70 font-medium leading-none">
          {event.dateISO?.substring(0, 4) ?? event.period ?? ''}
          {event.countryCode ? ` · ${event.countryCode}` : ''}
        </p>
        <p className="text-xs font-bold text-white leading-tight line-clamp-3">
          {event.title}
        </p>
      </div>
      <button
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors no-min-h"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        aria-label={isFavorite ? 'Retirer' : 'Sauvegarder'}
      >
        <svg
          className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-white'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

// ─── Theme carousel row ───────────────────────────────────────────────────────
const ThemeCarousel: React.FC<{
  theme: Theme;
  events: Event[];
  isLoading: boolean;
  onViewEvent: (e: Event) => void;
  exists: (type: string, id: string) => boolean;
  toggle: (item: any) => void;
}> = ({ theme, events, isLoading, onViewEvent, exists, toggle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        {theme.color && (
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
        )}
        <h2 className="font-bold text-secondary text-lg leading-none">{theme.name}</h2>
        {!isLoading && events.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">{events.length}</span>
        )}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => scroll('left')}
            className="no-min-h p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Défiler à gauche"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="no-min-h p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Défiler à droite"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 sm:w-48 rounded-xl bg-muted animate-pulse" style={{ height: '220px' }} />
            ))
          : events.length === 0
            ? (
              <div className="flex-shrink-0 h-14 flex items-center px-4 text-sm text-muted-foreground italic">
                Aucun événement dans ce thème.
              </div>
            )
            : events.map(ev => (
              <CarouselCard
                key={ev.id}
                event={ev}
                onView={() => onViewEvent(ev)}
                isFavorite={exists('event', ev.id)}
                onToggle={() => toggle({ type: 'event', id: ev.id, slug: ev.slug, title: ev.title, thumbnail: ev.media?.[0]?.url })}
              />
            ))
        }
      </div>
    </section>
  );
};

// ─── Shorts / Explorer mode ───────────────────────────────────────────────────
const ShortsViewer: React.FC<{
  pool: Event[];
  onViewEvent: (e: Event) => void;
  onClose: () => void;
  exists: (type: string, id: string) => boolean;
  toggle: (item: any) => void;
}> = ({ pool, onViewEvent, onClose, exists, toggle }) => {
  const [index, setIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(pool.length - 1, i + 1)), [pool.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartY.current = null;
  };

  const event = pool[index];
  if (!event) return null;

  const img = event.thumbnailUrl
    ? normalizeMediaUrl(event.thumbnailUrl)
    : event.media?.[0]?.url ?? null;
  const themeColor = (event.themes?.[0] as any)?.color ?? '#1a1a2e';

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex-1 flex flex-col"
        >
          {/* Background image */}
          {img ? (
            <img
              src={img}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: themeColor }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-4 pt-safe pt-4">
            <button
              onClick={onClose}
              className="no-min-h p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-white/50 text-xs">{index + 1} / {pool.length}</span>
          </div>

          {/* Content bottom */}
          <div className="relative mt-auto px-5 pb-8 space-y-3">
            {/* Theme chips */}
            {event.themes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.themes.map(t => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: ((t as any).color ?? '#94a3b8') + 'cc' }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-white/60 text-xs font-medium mb-1">
                {event.dateISO?.substring(0, 10) ?? event.period ?? ''}
                {event.countryCode ? ` · ${event.countryCode}` : ''}
              </p>
              <h2 className="text-white text-2xl font-black leading-tight">{event.title}</h2>
              {event.summary && (
                <p className="text-white/70 text-sm mt-2 line-clamp-3 leading-relaxed">{event.summary}</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 h-11 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors"
                onClick={() => onViewEvent(event)}
              >
                Voir l'événement
              </button>
              <button
                className={`no-min-h w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  exists('event', event.id) ? 'bg-amber-400 text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={() => toggle({ type: 'event', id: event.id, slug: event.slug, title: event.title, thumbnail: event.media?.[0]?.url })}
                aria-label={exists('event', event.id) ? 'Retirer' : 'Sauvegarder'}
              >
                <svg className="h-5 w-5" fill={exists('event', event.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav arrows (desktop) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 hidden md:flex">
        <button
          onClick={prev}
          disabled={index === 0}
          className="no-min-h p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-all"
          aria-label="Précédent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={next}
          disabled={index === pool.length - 1}
          className="no-min-h p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-all"
          aria-label="Suivant"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
interface HomePageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  scrollToId?: string | null;
  onScrolled?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewEvent, navigateToModule, scrollToId, onScrolled }) => {
  const [mode, setMode]                     = useState<'discover' | 'shorts'>('discover');
  const [query, setQuery]                   = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [themes, setThemes]                 = useState<Theme[]>([]);
  const [carousels, setCarousels]           = useState<Record<string, Event[]>>({});
  const [loadingThemes, setLoadingThemes]   = useState<Set<string>>(new Set());
  const [featuredItems, setFeaturedItems]   = useState<FeaturedStory[]>([]);
  const [shortsPool, setShortsPool]         = useState<Event[]>([]);
  const [isLoadingShorts, setIsLoadingShorts] = useState(false);
  const { exists, toggle }                  = useFavorites();
  const allEventsRef                        = useRef<Event[]>([]);

  useLayoutEffect(() => {
    if (scrollToId && onScrolled) {
      const el = document.getElementById(`event-card-${scrollToId}`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
      onScrolled();
    }
  }, [scrollToId, onScrolled]);

  // Initial load: themes + featured
  useEffect(() => {
    (async () => {
      const [fetchedThemes, featured] = await Promise.all([getThemes(), getFeaturedItems()]);
      setThemes(fetchedThemes);
      setFeaturedItems(featured);
    })();
  }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Load carousel events for all themes whenever query changes
  useEffect(() => {
    if (themes.length === 0) return;
    const q = debouncedQuery || undefined;
    setLoadingThemes(new Set(themes.map(t => t.slug)));
    for (const theme of themes) {
      getCarouselEvents(theme.slug, q).then(events => {
        setCarousels(prev => ({ ...prev, [theme.slug]: events }));
        setLoadingThemes(prev => { const next = new Set(prev); next.delete(theme.slug); return next; });
      });
    }
  }, [themes, debouncedQuery]);

  // Load shorts pool
  const loadShorts = useCallback(async () => {
    if (shortsPool.length > 0) return;
    setIsLoadingShorts(true);
    const events = await getEvents({ limit: 200 });
    allEventsRef.current = events;
    setShortsPool(shuffle(events));
    setIsLoadingShorts(false);
  }, [shortsPool.length]);

  const handleFeaturedEvent = useCallback(async (slug: string) => {
    const cached = allEventsRef.current.find(e => e.slug === slug);
    const event = cached ?? await getEventBySlug(slug);
    if (event) onViewEvent(event);
  }, [onViewEvent]);

  const handleModeSwitch = (m: 'discover' | 'shorts') => {
    setMode(m);
    if (m === 'shorts') loadShorts();
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Shorts overlay ─────────────────────────────────────────────────── */}
      {mode === 'shorts' && (
        isLoadingShorts ? (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="text-white text-center space-y-3">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm text-white/60">Chargement du catalogue…</p>
            </div>
          </div>
        ) : (
          <ShortsViewer
            pool={shortsPool}
            onViewEvent={e => { setMode('discover'); onViewEvent(e); }}
            onClose={() => setMode('discover')}
            exists={exists}
            toggle={toggle}
          />
        )
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="space-y-6 pb-16 md:pb-4">

        {/* Featured strip */}
        {featuredItems.length > 0 && (
          <FeaturedStories
            items={featuredItems}
            onNavigateToModule={navigateToModule}
            onNavigateToEvent={handleFeaturedEvent}
          />
        )}

        {/* Search + mode toggle */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher des événements, personnages, lieux…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-base bg-card"
              autoComplete="off"
            />
          </div>

          {/* Parcourir / Explorer toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
            <button
              onClick={() => handleModeSwitch('discover')}
              className={`no-min-h px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                mode === 'discover' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-label="Mode Parcourir"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
              </svg>
              <span className="hidden sm:inline">Parcourir</span>
            </button>
            <button
              onClick={() => handleModeSwitch('shorts')}
              className={`no-min-h px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                mode === 'shorts' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-label="Mode Explorer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
                <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Explorer</span>
            </button>
          </div>
        </div>

        {/* Theme carousels */}
        <div className="space-y-8">
          {themes.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
                  <div className="flex gap-3">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-40 sm:w-48 rounded-xl bg-muted animate-pulse" style={{ height: '220px' }} />
                    ))}
                  </div>
                </div>
              ))
            : themes.map(theme => (
                <ThemeCarousel
                  key={theme.slug}
                  theme={theme}
                  events={carousels[theme.slug] ?? []}
                  isLoading={loadingThemes.has(theme.slug)}
                  onViewEvent={onViewEvent}
                  exists={exists}
                  toggle={toggle}
                />
              ))
          }
        </div>
      </div>
    </>
  );
};
