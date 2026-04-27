
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

// ─── Type badge ─────────────────────────────────────────────────────────────
function CtaBadge({ ctaType }: { ctaType: FeaturedStory['ctaType'] }) {
  if (ctaType === 'module') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-secondary rounded-full px-4 py-1.5 shadow-lg">
        <GraduationCapIcon className="h-3.5 w-3.5" /> Module
      </span>
    );
  }
  if (ctaType === 'timeline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-full px-4 py-1.5 shadow-lg">
        <TimelineIcon className="h-3.5 w-3.5" /> Parcours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-accent/90 text-white rounded-full px-4 py-1.5 shadow-lg">
      <CalendarDaysIcon className="h-3.5 w-3.5" /> Événement
    </span>
  );
}

export function FeaturedStories({
  items,
  autoplayMs = 6000,
  onNavigateToModule,
  onNavigateToEvent,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const rafRef = React.useRef<number>(0);
  const startTimeRef = React.useRef<number>(0);

  // ─── Keyboard navigation ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, items.length]);

  // ─── Autoplay ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = performance.now();
    setProgress(0);

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / autoplayMs);
      setProgress(p);
      if (p >= 1) {
        go(1);
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, autoplayMs]);

  function go(delta: number) {
    setProgress(0);
    setActive(i => (i + delta + items.length) % items.length);
  }

  // ─── Pointer swipe ────────────────────────────────────────────────────────
  const startX = React.useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) { startX.current = e.clientX; }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    startX.current = null;
  }

  // ─── Navigate helpers ─────────────────────────────────────────────────────
  const handleCta = (slug: string) => {
    setOpen(false);
    onNavigateToModule(slug); // navigateToModule handles both modules AND timelines
  };
  const handleViewEvent = (slug: string) => {
    setOpen(false);
    onNavigateToEvent(slug);
  };

  if (!items?.length) return null;

  const openAt = (idx: number) => { setActive(idx); setOpen(true); setProgress(0); };
  const cur = items[active];

  return (
    <div className="w-full">
      {/* ─── Rings row ────────────────────────────────────────────────────── */}
      <div
        className="flex items-end gap-3 sm:gap-5 overflow-x-auto py-4 -mx-4 px-4 no-scrollbar"
        aria-label="Stories en avant"
      >
        {items.map((it, i) => (
          <button
            key={it.id}
            className="shrink-0 flex flex-col items-center gap-2 outline-none focus-visible:ring-2 ring-offset-2 rounded-full group transition-transform active:scale-95"
            aria-label={`Ouvrir : ${it.title}`}
            onClick={() => openAt(i)}
          >
            {/* Gradient ring */}
            <div className="relative h-[62px] w-[62px] sm:h-[72px] sm:w-[72px] rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-accent to-orange-300 group-hover:rotate-12 transition-transform duration-500 shadow-md">
              <div className="h-full w-full rounded-full bg-white p-[2px]">
                <img
                  src={it.imageUrl ?? "https://i.postimg.cc/8cYFbspt/Kasuku-logo.png"}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Mini type indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white border border-white shadow-sm p-0.5">
                {it.ctaType === 'module' ? (
                  <GraduationCapIcon className="h-3 w-3 text-secondary" />
                ) : it.ctaType === 'timeline' ? (
                  <TimelineIcon className="h-3 w-3 text-primary" />
                ) : (
                  <CalendarDaysIcon className="h-3 w-3 text-accent" />
                )}
              </div>
            </div>
            <span className="w-[62px] sm:w-[72px] text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-center line-clamp-2 text-secondary/70 group-hover:text-primary transition-colors leading-tight">
              {it.title}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Fullscreen overlay ───────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Story à la une"
        >
          {/* Progress bars */}
          <div className="absolute left-0 right-0 top-0 flex gap-1 px-3 pt-safe-top pt-3 z-20 pointer-events-none">
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

          {/* Close button */}
          <button
            className="absolute top-10 right-4 sm:top-10 sm:right-6 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 p-2.5 sm:p-3 focus-visible:ring-2 z-40 transition-colors"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Content */}
          <div
            className="h-full w-full flex items-center justify-center select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {/* Desktop nav arrows */}
            <button
              aria-label="Précédent"
              className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 p-3 lg:p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
            >
              <ChevronLeftIcon className="h-7 w-7" />
            </button>

            {/* Card */}
            <div className="w-full h-full max-w-lg lg:max-w-3xl xl:max-w-4xl lg:h-[88vh] flex items-stretch justify-center lg:items-center lg:px-4">
              <div className="relative w-full h-full lg:rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-2xl">

                {/* Background image */}
                {cur.imageUrl ? (
                  <img
                    src={cur.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0E6251] via-[#1a6b5c] to-black" />
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12 flex flex-col z-30">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <CtaBadge ctaType={cur.ctaType} />
                    {cur.dateISO && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md text-white border border-white/20 rounded-full px-4 py-1.5">
                        <CalendarDaysIcon className="h-3.5 w-3.5" /> {cur.dateISO}
                      </span>
                    )}
                  </div>

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
                    <Button
                      size="lg"
                      className="rounded-full px-8 sm:px-10 py-6 sm:py-8 h-auto font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-xl"
                      onClick={(e) => { e.stopPropagation(); handleCta(cur.ctaTo); }}
                    >
                      {cur.ctaType === 'module' ? (
                        <GraduationCapIcon className="h-4 w-4 mr-2 sm:mr-3" />
                      ) : (
                        <TimelineIcon className="h-4 w-4 mr-2 sm:mr-3" />
                      )}
                      {cur.ctaLabel}
                    </Button>

                    {cur.eventSlug && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 sm:px-10 py-6 sm:py-8 h-auto font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] border-white/40 text-white hover:bg-white/15 backdrop-blur-sm transition-transform active:scale-95"
                        onClick={(e) => { e.stopPropagation(); handleViewEvent(cur.eventSlug!); }}
                      >
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Voir l'événement
                      </Button>
                    )}
                  </div>
                </div>

                {/* Story counter */}
                {items.length > 1 && (
                  <div className="absolute top-10 left-4 sm:left-6 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                      {active + 1} / {items.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              aria-label="Suivant"
              className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 p-3 lg:p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
              onClick={(e) => { e.stopPropagation(); go(1); }}
            >
              <ChevronRightIcon className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
