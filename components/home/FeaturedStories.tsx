
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

export function FeaturedStories({ items, autoplayMs = 6000, onNavigateToModule, onNavigateToEvent }: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<number>(0);
  const progressRef = React.useRef<number>(0); // 0..1
  const [progress, setProgress] = React.useState(0);

  // keyboard nav in overlay
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, active, items.length]);

  // autoplay in overlay
  React.useEffect(() => {
    if (!open) return;
    const start = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(1, elapsed / autoplayMs);
      progressRef.current = p;
      setProgress(p);
      if (p >= 1) {
        go(1);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, active, autoplayMs]);

  function go(delta: number) {
    setProgress(0);
    progressRef.current = 0;
    setActive(i => (i + delta + items.length) % items.length);
  }

  const handleNavigateToModule = (slug: string) => {
    setOpen(false);
    onNavigateToModule(slug);
  };

  const handleNavigateToEvent = (slug: string) => {
    setOpen(false);
    onNavigateToEvent(slug);
  };

  // basic swipe (pointer events)
  const startX = React.useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) { startX.current = e.clientX; }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (dx > 50) go(-1);
    else if (dx < -50) go(1);
    startX.current = null;
  }

  if (!items?.length) return null;

  const openAt = (idx: number) => { setActive(idx); setOpen(true); setProgress(0); };

  return (
    <div className="w-full">
      {/* Rings row */}
      <div className="flex items-center gap-4 overflow-x-auto py-4 -mx-4 px-4 no-scrollbar" aria-label="Stories en avant">
        {items.map((it, i) => (
          <button
            key={it.id}
            className="shrink-0 outline-none focus-visible:ring-2 ring-offset-2 rounded-full group transition-transform active:scale-95"
            aria-label={`Ouvrir la story: ${it.title}`}
            onClick={() => openAt(i)}
          >
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full p-[3px] bg-gradient-to-tr from-primary to-accent group-hover:rotate-12 transition-transform duration-500">
              <div className="h-full w-full rounded-full bg-white p-1">
                <img
                  src={it.imageUrl ?? "https://i.postimg.cc/8cYFbspt/Kasuku-logo.png"}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="mt-2 w-16 sm:w-20 text-[10px] font-black uppercase tracking-tighter text-center line-clamp-1 text-secondary/80 group-hover:text-primary transition-colors">{it.title}</div>
          </button>
        ))}
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Stories à la une"
        >
          {/* bars top */}
          <div className="absolute left-0 right-0 top-0 px-4 pt-4 flex gap-1.5 z-20">
            {items.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className={`h-full ${i < active ? "w-full" : i > active ? "w-0" : ""} bg-white`}
                  style={i === active ? { width: `${progress * 100}%`, transition: "width 100ms linear" } : undefined}
                />
              </div>
            ))}
          </div>

          {/* close */}
          <button
            className="absolute top-8 right-6 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 focus-visible:ring-2 z-40 transition-colors"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          >
            <XIcon className="h-6 w-6" />
          </button>

          {/* content */}
          <div
            className="h-full w-full flex items-center justify-center select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {/* Nav Desktop Only */}
            <button
              aria-label="Précédent"
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>

            <div className="w-full h-full max-w-lg lg:max-w-4xl lg:h-[85vh] lg:px-4 flex items-center justify-center">
              <div className="relative w-full h-full lg:rounded-[3rem] overflow-hidden bg-zinc-900 shadow-2xl">
                {/* image background */}
                {items[active].imageUrl ? (
                  <img
                    src={items[active].imageUrl!}
                    alt={`Visuel pour la story: ${items[active].title}`}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0E6251] to-black" />
                )}

                {/* content area */}
                <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent z-30">
                  <div className="flex items-center gap-3 mb-4">
                    {items[active].moduleSlug ? (
                         <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-white text-secondary rounded-full px-4 py-1.5 shadow-lg">
                            <GraduationCapIcon className="h-4 w-4 mr-2" /> Module
                        </span>
                    ) : (
                        <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-full px-4 py-1.5 shadow-lg">
                            <TimelineIcon className="h-4 w-4 mr-2" /> Récit
                        </span>
                    )}
                    
                    {items[active].dateISO && (
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md text-white border border-white/20 rounded-full px-4 py-1.5">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" /> {items[active].dateISO}
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-[1.1] drop-shadow-2xl">{items[active].title}</h2>
                  {items[active].subtitle && (
                    <p className="mb-8 text-base sm:text-xl text-white/80 line-clamp-3 font-medium leading-relaxed max-w-2xl">{items[active].subtitle}</p>
                  )}

                  <div className="flex gap-3 flex-wrap pointer-events-auto">
                    <Button
                      size="lg"
                      className="rounded-full px-10 py-8 h-auto font-black uppercase tracking-[0.2em] text-[11px] bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-xl"
                      onClick={(e) => { e.stopPropagation(); handleNavigateToModule(items[active].ctaTo); }}
                    >
                      {items[active].moduleSlug ? <GraduationCapIcon className="h-5 w-5 mr-3" /> : <TimelineIcon className="h-5 w-5 mr-3" />}
                      {items[active].ctaLabel}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-10 py-8 h-auto font-black uppercase tracking-[0.2em] text-[11px] border-white/40 text-white hover:bg-white/10 backdrop-blur-sm transition-transform active:scale-95"
                      onClick={(e) => { e.stopPropagation(); handleNavigateToEvent(items[active].eventSlug); }}
                    >
                      Voir l’événement
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <button
              aria-label="Suivant"
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 p-4 focus-visible:ring-2 z-30 hidden lg:flex items-center justify-center transition-all"
              onClick={(e) => { e.stopPropagation(); go(1); }}
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
            
            {/* Tappable areas for mobile nav - REDUCED HEIGHT TO AVOID OVERLAPPING BUTTONS */}
            <div className="absolute inset-0 h-2/3 flex lg:hidden z-10">
                <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); go(-1); }}></div>
                <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); go(1); }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
