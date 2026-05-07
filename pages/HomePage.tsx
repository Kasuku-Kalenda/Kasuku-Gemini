
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

// ─── "Voir tout" modal ────────────────────────────────────────────────────────
const ThemeAllEventsModal: React.FC<{
  theme: Theme;
  onClose: () => void;
  onViewEvent: (e: Event) => void;
  exists: (type: string, id: string) => boolean;
  toggle: (item: any) => void;
}> = ({ theme, onClose, onViewEvent, exists, toggle }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCarouselEvents(theme.slug).then(evs => {
      setEvents(evs);
      setLoading(false);
    });
  }, [theme.slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="no-min-h p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {theme.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />}
        <h2 className="font-bold text-lg leading-none">{theme.name}</h2>
        {!loading && (
          <span className="text-sm text-muted-foreground ml-1">({events.length})</span>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse" style={{ height: '220px' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Aucun événement dans ce thème.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {events.map(ev => (
              <CarouselCard
                key={ev.id}
                event={ev}
                onView={() => { onClose(); onViewEvent(ev); }}
                isFavorite={exists('event', ev.id)}
                onToggle={() => toggle({ type: 'event', id: ev.id, slug: ev.slug, title: ev.title, thumbnail: ev.media?.[0]?.url })}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Theme carousel row ───────────────────────────────────────────────────────
const ThemeCarousel: React.FC<{
  theme: Theme;
  events: Event[];
  isLoading: boolean;
  lazy?: boolean;
  onRequestLoad?: () => void;
  onViewEvent: (e: Event) => void;
  onViewAll?: () => void;
  activeSearch?: boolean;
  exists: (type: string, id: string) => boolean;
  toggle: (item: any) => void;
}> = ({ theme, events, isLoading, lazy, onRequestLoad, onViewEvent, onViewAll, activeSearch, exists, toggle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // ── Lazy loading via IntersectionObserver ─────────────────────────────────
  useEffect(() => {
    if (!lazy || !sectionRef.current || !onRequestLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onRequestLoad();
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } // preload 300px before entering viewport
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [lazy, onRequestLoad]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  // ── #2 : Hide section when empty (and not loading) ────────────────────────
  if (!isLoading && events.length === 0) return null;

  return (
    <section ref={sectionRef} className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        {theme.color && (
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
        )}
        <h2 className="font-bold text-secondary text-lg leading-none">{theme.name}</h2>

        {/* #6 : Count badge — show when not loading */}
        {!isLoading && events.length > 0 && (
          <span className={`text-xs ml-1 font-medium ${activeSearch ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeSearch ? `${events.length} résultat${events.length > 1 ? 's' : ''}` : events.length}
          </span>
        )}

        {/* #1 : "Voir tout" link */}
        {!isLoading && events.length > 0 && onViewAll && (
          <button
            onClick={onViewAll}
            className="no-min-h ml-1 text-xs text-primary hover:underline font-medium transition-colors"
          >
            Voir tout →
          </button>
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
  initialIndex?: number;
  onViewEvent: (e: Event, index: number) => void;
  onClose: () => void;
  exists: (type: string, id: string) => boolean;
  toggle: (item: any) => void;
  onNearEnd: () => void;
}> = ({ pool, initialIndex = 0, onViewEvent, onClose, exists, toggle, onNearEnd }) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartY = useRef<number | null>(null);
  const nearEndFired = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Swipe visual feedback ─────────────────────────────────────────────────
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const prev = useCallback(() => {
    setDragDeltaY(0);
    setIndex(i => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setDragDeltaY(0);
    setIndex(i => i + 1);
  }, []);

  // Trigger near-end load when 8 events from the end
  useEffect(() => {
    if (pool.length > 0 && index >= pool.length - 8 && !nearEndFired.current) {
      nearEndFired.current = true;
      onNearEnd();
    }
    if (index < pool.length - 15) nearEndFired.current = false;
  }, [index, pool.length, onNearEnd]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  // ── Fix swipe-down on mobile : block pull-to-refresh with passive:false ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    setDragDeltaY(delta * 0.35);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    setIsDragging(false);
    setDragDeltaY(0);
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartY.current = null;
  };

  const safeIndex = pool.length > 0 ? index % pool.length : 0;
  const event = pool[safeIndex];
  if (!event) return null;

  const img = event.thumbnailUrl
    ? normalizeMediaUrl(event.thumbnailUrl)
    : event.media?.[0]?.url ?? null;
  const themeColor = (event.themes?.[0] as any)?.color ?? '#1a1a2e';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* #4 : Drag translation wrapper */}
      <div
        className="flex-1 flex flex-col"
        style={{
          transform: `translateY(${dragDeltaY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
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
            <div className="relative flex items-center px-4 pt-safe pt-4">
              <button
                onClick={onClose}
                className="no-min-h p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content bottom — pb-24 to clear bottom nav on mobile */}
            <div className="relative mt-auto px-5 pb-24 md:pb-10 space-y-3">
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
                  onClick={() => onViewEvent(event, safeIndex)}
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
      </div>

      {/* Nav arrows (desktop) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2 hidden md:flex">
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
          className="no-min-h p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
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
  const isLoadingMoreRef                    = useRef(false);
  const shortsPageRef                       = useRef(1);
  const shortsReturnIndex                   = useRef<number | null>(null);
  const [canReturnToShorts, setCanReturnToShorts] = useState(false);
  const { exists, toggle }                  = useFavorites();
  const allEventsRef                        = useRef<Event[]>([]);

  // ── #1 : "Voir tout" modal state ──────────────────────────────────────────
  const [viewAllTheme, setViewAllTheme]     = useState<Theme | null>(null);

  // ── #3 : Lazy loading — track which themes have been requested ────────────
  const [requestedThemes, setRequestedThemes] = useState<Set<string>>(new Set());

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

  // ── #3 : Load carousels — first 3 eagerly, rest lazily on visibility ──────
  useEffect(() => {
    if (themes.length === 0) return;
    const q = debouncedQuery || undefined;

    // When query changes, reload ALL already-visible themes (first 3 + requested lazy)
    const themesToLoad = themes.filter((t, i) => i < 3 || requestedThemes.has(t.slug));
    setLoadingThemes(new Set(themesToLoad.map(t => t.slug)));

    for (const theme of themesToLoad) {
      getCarouselEvents(theme.slug, q).then(events => {
        setCarousels(prev => ({ ...prev, [theme.slug]: events }));
        setLoadingThemes(prev => {
          const next = new Set(prev);
          next.delete(theme.slug);
          return next;
        });
      });
    }
  }, [themes, debouncedQuery, requestedThemes]);

  // Called by ThemeCarousel's IntersectionObserver when a lazy theme enters viewport
  const handleThemeVisible = useCallback((slug: string) => {
    setRequestedThemes(prev => {
      if (prev.has(slug)) return prev; // Already requested
      return new Set([...prev, slug]);
    });
  }, []);

  // Load shorts pool (always reshuffles)
  const loadShorts = useCallback(async () => {
    setIsLoadingShorts(true);
    shortsPageRef.current = 1;
    isLoadingMoreRef.current = false;
    const events = await getEvents({ limit: 200 });
    allEventsRef.current = events;
    setShortsPool(shuffle(events));
    setIsLoadingShorts(false);
  }, []);

  // Append more events near end — cycles through new shuffled pages, wraps back
  const handleNearEnd = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    shortsPageRef.current += 1;
    const more = await getEvents({ limit: 200, page: shortsPageRef.current });
    const pool = more.length > 0 ? more : allEventsRef.current;
    if (more.length === 0) shortsPageRef.current = 1;
    setShortsPool(prev => [...prev, ...shuffle(pool)]);
    isLoadingMoreRef.current = false;
  }, []);

  const handleFeaturedEvent = useCallback(async (slug: string) => {
    const cached = allEventsRef.current.find(e => e.slug === slug);
    const event = cached ?? await getEventBySlug(slug);
    if (event) onViewEvent(event);
  }, [onViewEvent]);

  const [shortsStartIndex, setShortsStartIndex] = useState(0);

  const handleModeSwitch = (m: 'discover' | 'shorts') => {
    if (m === 'shorts') {
      if (shortsReturnIndex.current !== null) {
        setShortsStartIndex(shortsReturnIndex.current);
        shortsReturnIndex.current = null;
        setCanReturnToShorts(false);
        setMode('shorts');
      } else {
        setShortsStartIndex(0);
        loadShorts();
        setMode('shorts');
      }
    } else {
      setMode(m);
    }
  };

  const activeSearch = debouncedQuery.trim().length > 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── "Voir tout" modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewAllTheme && (
          <ThemeAllEventsModal
            theme={viewAllTheme}
            onClose={() => setViewAllTheme(null)}
            onViewEvent={onViewEvent}
            exists={exists}
            toggle={toggle}
          />
        )}
      </AnimatePresence>

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
            initialIndex={shortsStartIndex}
            onViewEvent={(e, idx) => {
              shortsReturnIndex.current = idx;
              setCanReturnToShorts(true);
              setMode('discover');
              onViewEvent(e);
            }}
            onClose={() => setMode('discover')}
            exists={exists}
            toggle={toggle}
            onNearEnd={handleNearEnd}
          />
        )
      )}

      {/* ── Bouton flottant "Reprendre les Shorts" ─────────────────────────── */}
      <AnimatePresence>
        {canReturnToShorts && mode === 'discover' && (
          <motion.button
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => handleModeSwitch('shorts')}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full bg-foreground text-background shadow-xl font-semibold text-sm whitespace-nowrap"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {/* Play icon */}
            <svg className="h-4 w-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reprendre les Shorts
            {/* Dismiss */}
            <span
              role="button"
              aria-label="Ignorer"
              className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
              onClick={e => { e.stopPropagation(); setCanReturnToShorts(false); shortsReturnIndex.current = null; }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

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
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 no-min-h p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Effacer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
              className={`no-min-h px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 relative ${
                mode === 'shorts' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-label={canReturnToShorts ? 'Reprendre Shorts' : 'Mode Shorts'}
            >
              {/* Icône cartes empilées — suggère du contenu swipeable */}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="5" y="8" width="14" height="13" rx="2" />
                <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" opacity="0.5" />
                <path d="M3 11h2M19 11h2" opacity="0.4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">
                {canReturnToShorts ? 'Reprendre' : 'Shorts'}
              </span>
              {canReturnToShorts && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
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
            : themes.map((theme, i) => {
                const isEager = i < 3;
                const isRequested = requestedThemes.has(theme.slug);
                const events = carousels[theme.slug] ?? [];
                const isLoading = loadingThemes.has(theme.slug) || (!isEager && !isRequested);

                return (
                  <ThemeCarousel
                    key={theme.slug}
                    theme={theme}
                    events={events}
                    isLoading={isLoading}
                    lazy={!isEager}
                    onRequestLoad={!isEager ? () => handleThemeVisible(theme.slug) : undefined}
                    onViewEvent={onViewEvent}
                    onViewAll={() => setViewAllTheme(theme)}
                    activeSearch={activeSearch}
                    exists={exists}
                    toggle={toggle}
                  />
                );
              })
          }
        </div>
      </div>
    </>
  );
};
