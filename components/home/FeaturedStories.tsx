
import React from "react";
import { Button } from "../ui/Button";
import type { FeaturedStory } from "../../types";
import { XIcon } from "../icons/XIcon";
import { ChevronLeftIcon } from "../icons/ChevronLeftIcon";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";
import { GraduationCapIcon } from "../icons/GraduationCapIcon";
import { CalendarDaysIcon } from "../icons/CalendarDaysIcon";
import { TimelineIcon } from "../icons/TimelineIcon";

type Props = {
  items: FeaturedStory[];
  autoplayMs?: number;
  onNavigateToModule: (slug: string) => void;
  onNavigateToEvent: (slug: string) => void;
};

// ─── Source type config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  module:   { emoji: '🎓', label: 'Module',     color: 'bg-secondary text-white' },
  timeline: { emoji: '📖', label: 'Récit',      color: 'bg-primary text-white' },
  event:    { emoji: '📅', label: 'Événement',  color: 'bg-accent text-white' },
} as const;

function getTypeKey(item: FeaturedStory): keyof typeof TYPE_CONFIG {
  if (item.sourceType === 'module' || item.ctaType === 'module')   return 'module';
  if (item.sourceType === 'story'  || item.ctaType === 'timeline') return 'timeline';
  return 'event';
}

// ─── Portrait card (YouTube Shorts / WhatsApp Status style) ──────────────────
function PortraitCard({ item, onClick, index }: {
  item: FeaturedStory;
  onClick: () => void;
  index: number;
}) {
  const typeKey = getTypeKey(item);
  const cfg     = TYPE_CONFIG[typeKey];

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 group relative flex flex-col outline-none focus-visible:ring-2 ring-primary ring-offset-2"
      style={{ width: 'clamp(90px, 22vw, 130px)' }}
      aria-label={`Ouvrir : ${item.title}`}
    >
      {/* Card — portrait 9:16 */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-zinc-800 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03] group-active:scale-95"
        style={{ aspectRatio: '9 / 16' }}
      >
        {/* Background image */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            loading={index < 3 ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-accent/60 to-secondary/80" />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Type badge — top left */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow ${cfg.color}`}>
            {cfg.emoji}
          </span>
        </div>

        {/* Progress ring indicator (optional visual accent) */}
        <div className="absolute top-2 right-2 z-10">
          <div className="w-1 h-8 rounded-full bg-white/20 overflow-hidden">
            <div className="w-full bg-white/60 rounded-full" style={{ height: '33%' }} />
          </div>
        </div>

        {/* Title at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 z-10">
          <p className="text-white text-[10px] sm:text-[11px] font-black leading-tight line-clamp-2 drop-shadow-lg">
            {item.title}
          </p>
        </div>
      </div>

      {/* Label below card */}
      <p className="mt-1.5 text-[9px] sm:text-[10px] font-bold text-secondary/60 text-center line-clamp-1 px-1 group-hover:text-primary transition-colors">
        {cfg.label}
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FeaturedStories({
  items,
  autoplayMs = 7000,
  onNavigateToModule,
  onNavigateToEvent,
}: Props) {
  const [open, setOpen]       = React.useState(false);
  const [active, setActive]   = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [paused, setPaused]   = React.useState(false);
  const rafRef                = React.useRef<number>(0);
  const startTimeRef          = React.useRef<number>(0);
  const pausedAtRef           = React.useRef<number>(0);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      { setOpen(false); }
      if (e.key === 'ArrowRight')  go(1);
      if (e.key === 'ArrowLeft')   go(-1);
      if (e.key === ' ')           { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, items.length]);

  // Autoplay with pause support
  React.useEffect(() => {
    if (!open || paused) {
      cancelAnimationFrame(rafRef.current);
      if (paused) pausedAtRef.current = progress;
      return;
    }

    cancelAnimationFrame(rafRef.current);
    // Resume from where we paused
    const already = (paused ? pausedAtRef.current : 0) * autoplayMs;
    startTimeRef.current = performance.now() - already;
    setProgress(already / autoplayMs);

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / autoplayMs);
      setProgress(p);
      if (p >= 1) go(1);
      else rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, autoplayMs, paused]);

  function go(delta: number) {
    setProgress(0);
    setPaused(false);
    pausedAtRef.current = 0;
    setActive(i => (i + delta + items.length) % items.length);
  }

  // Swipe / tap zones
  const startX = React.useRef<number | null>(null);
  const startY = React.useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current == null || startY.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = Math.abs(e.clientY - startY.current);
    // Only treat as swipe if horizontal movement dominates
    if (Math.abs(dx) > 40 && dy < 60) go(dx > 0 ? -1 : 1);
    startX.current = null;
  }

  // Tap on left / right third of screen to navigate
  function onTap(e: React.MouseEvent) {
    // Ignore if on a button
    if ((e.target as HTMLElement).closest('button, a')) return;
    const { clientX, currentTarget } = e;
    const w = (currentTarget as HTMLElement).offsetWidth;
    if (clientX < w * 0.33) go(-1);
    else if (clientX > w * 0.67) go(1);
    else setPaused(p => !p);
  }

  // Navigation helpers
  // Extrait le slug depuis un chemin type "/events/mon-slug" → "mon-slug"
  const slugFromPath = (path: string) => path.split('/').filter(Boolean).pop() ?? path;

  const handleCta = (item: FeaturedStory) => {
    setOpen(false);
    if (item.sourceType === 'event') {
      // Événement → onNavigateToEvent avec juste le slug
      const slug = item.eventSlug ?? slugFromPath(item.ctaTo);
      onNavigateToEvent(slug);
    } else {
      // Module ou récit → onNavigateToModule avec le slug sans préfixe
      const slug = item.sourceType === 'story'
        ? (item.storySlug  ?? slugFromPath(item.ctaTo))
        : (item.moduleSlug ?? slugFromPath(item.ctaTo));
      onNavigateToModule(slug);
    }
  };
  const handleViewEvent = (slug: string) => {
    setOpen(false);
    onNavigateToEvent(slug);
  };

  const openAt = (idx: number) => {
    setActive(idx);
    setOpen(true);
    setProgress(0);
    setPaused(false);
  };

  if (!items?.length) return null;

  const cur     = items[active];
  const typeKey = getTypeKey(cur);
  const cfg     = TYPE_CONFIG[typeKey];

  return (
    <div className="w-full">

      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-secondary">À la une</span>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <span className="hidden sm:block text-[10px] text-muted-foreground italic">Cliquez pour découvrir →</span>
      </div>

      {/* ── Portrait cards row ───────────────────────────────────────────────── */}
      <div className="relative">
        {/* Fade-out à droite — signal "il y en a d'autres" */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-stretch gap-3 overflow-x-auto py-2 -mx-4 px-4 no-scrollbar"
        aria-label="Contenus à la une"
      >
        {items.map((item, i) => {
          const k = getTypeKey(item);
          const c = TYPE_CONFIG[k];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openAt(i)}
              className="shrink-0 group relative flex flex-col outline-none focus-visible:ring-2 ring-primary ring-offset-2"
              style={{ width: 'clamp(90px, 15vw, 160px)' }}
              aria-label={`Ouvrir : ${item.title}`}
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-zinc-800 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03] group-active:scale-95"
                style={{ aspectRatio: '9 / 16' }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-accent/60 to-secondary/80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute top-2 left-2 z-10">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow ${c.color}`}>
                    {c.emoji}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2.5 z-10">
                  <p className="text-white text-[10px] sm:text-[11px] font-black leading-tight line-clamp-2 drop-shadow-lg">
                    {item.title}
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[9px] sm:text-[10px] font-bold text-secondary/60 text-center line-clamp-1 px-1 group-hover:text-primary transition-colors">
                {c.label}
              </p>
            </button>
          );
        })}

        {/* Espace à droite pour que le fade soit visible */}
        <div className="shrink-0 w-8 pointer-events-none" />
      </div>
      </div>{/* fin .relative */}

      {/* ── Fullscreen story viewer ──────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Story à la une"
          onClick={onTap}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {/* Progress bars */}
          <div
            className="absolute left-0 right-0 top-0 flex gap-1 px-3 z-20 pointer-events-none"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
          >
            {items.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={
                    i < active
                      ? { width: '100%' }
                      : i > active
                        ? { width: '0%' }
                        : { width: `${progress * 100}%`, transition: 'width 80ms linear' }
                  }
                />
              </div>
            ))}
          </div>

          {/* Top bar: type badge + counter + close */}
          <div
            className="absolute inset-x-0 flex items-center justify-between px-4 z-30 pointer-events-none"
            style={{ top: 'max(2.25rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
          >
            {/* Type badge */}
            <div className="pointer-events-none">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow ${cfg.color}`}>
                {cfg.emoji} {cfg.label}
              </span>
            </div>

            {/* Counter */}
            {items.length > 1 && (
              <span className="text-[10px] font-black text-white/70 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                {active + 1} / {items.length}
              </span>
            )}

            {/* Close */}
            <button
              className="pointer-events-auto rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 active:scale-90 p-2.5 focus-visible:ring-2 transition-all"
              aria-label="Fermer"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Card content */}
          <div className="h-full w-full flex items-center justify-center select-none overflow-hidden">

            {/* Desktop nav arrows */}
            {items.length > 1 && (
              <>
                <button
                  aria-label="Précédent"
                  className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 p-3 lg:p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
                  onClick={(e) => { e.stopPropagation(); go(-1); }}
                >
                  <ChevronLeftIcon className="h-7 w-7" />
                </button>
                <button
                  aria-label="Suivant"
                  className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 p-3 lg:p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
                  onClick={(e) => { e.stopPropagation(); go(1); }}
                >
                  <ChevronRightIcon className="h-7 w-7" />
                </button>
              </>
            )}

            {/* Story card */}
            <div className="w-full h-full max-w-lg lg:max-w-3xl xl:max-w-4xl lg:h-[88vh] flex items-stretch justify-center lg:items-center lg:px-4">
              <div className="relative w-full h-full lg:rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-2xl">

                {/* Background image with crossfade effect */}
                {cur.imageUrl ? (
                  <img
                    key={cur.id}
                    src={cur.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_0.4s_ease]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-accent/60 to-secondary/80" />
                )}

                {/* Multi-layer gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

                {/* Pause indicator */}
                {paused && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full p-5">
                      <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Content — bottom overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12 flex flex-col z-30 pointer-events-none"
                  style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
                >
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-3 leading-[1.1] drop-shadow-xl">
                    {cur.title}
                  </h2>

                  {cur.subtitle && (
                    <p className="mb-6 sm:mb-8 text-sm sm:text-lg text-white/80 line-clamp-3 font-medium leading-relaxed max-w-2xl">
                      {cur.subtitle}
                    </p>
                  )}

                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto">
                    {/* Primary CTA */}
                    <Button
                      size="lg"
                      className="rounded-full px-8 sm:px-10 py-6 sm:py-8 h-auto font-black uppercase tracking-[0.15em] text-[11px] bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-xl"
                      onClick={(e) => { e.stopPropagation(); handleCta(cur); }}
                    >
                      {typeKey === 'module' && <GraduationCapIcon className="h-4 w-4 mr-2 sm:mr-3" />}
                      {typeKey === 'timeline' && <TimelineIcon className="h-4 w-4 mr-2 sm:mr-3" />}
                      {typeKey === 'event' && <CalendarDaysIcon className="h-4 w-4 mr-2 sm:mr-3" />}
                      {cur.ctaLabel}
                    </Button>

                    {/* Secondary: voir l'événement source (si story ou module liés à un event) */}
                    {cur.eventSlug && typeKey !== 'event' && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 sm:px-10 py-6 sm:py-8 h-auto font-black uppercase tracking-[0.15em] text-[11px] border-white/40 text-white hover:bg-white/15 backdrop-blur-sm transition-transform active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handleViewEvent(cur.eventSlug!); }}
                      >
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Voir l'événement
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile tap zones hints (invisible but semantically useful) */}
                <div className="absolute inset-0 grid grid-cols-3 z-10 lg:hidden pointer-events-none">
                  <div className="border-r border-transparent" aria-label="Précédent" />
                  <div aria-label="Pause/Lecture" />
                  <div className="border-l border-transparent" aria-label="Suivant" />
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
