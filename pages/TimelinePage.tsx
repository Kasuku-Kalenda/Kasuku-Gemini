
import React, { useState, useEffect, useRef } from 'react';
import type { Event, TimelineMoment, TimelineNarrative } from '../types';
import { getTimelineBySlug, getEvents } from '../services/api';
import { formatDate } from '../utils/helpers';
import { THEME_COLORS } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface TimelinePageProps {
  onViewEvent: (event: Event) => void;
  timelineSlug?: string | null;
  initialEventId?: string | null;
  onBack: () => void;
}

// Interface unifiée pour l'affichage (Slide)
interface NarrativeSlide {
    id: string;
    title: string;
    description: string;
    dateLabel: string;
    year?: number;
    mediaUrl: string;
    themes: { id: string; name: string; slug: string }[];
    originalType: 'event' | 'moment';
    refObject: any;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({ onViewEvent, timelineSlug, initialEventId, onBack }) => {
    const [timeline, setTimeline] = useState<TimelineNarrative | null>(null);
    const [slides, setSlides] = useState<NarrativeSlide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const loadContent = async () => {
            if (!timelineSlug) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const tl = await getTimelineBySlug(timelineSlug);
            setTimeline(tl);

            let contentSlides: NarrativeSlide[] = [];

            // 1. Si la timeline a des moments narratifs (Nouveau modèle)
            if (tl && tl.moments && tl.moments.length > 0) {
                contentSlides = tl.moments.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.narrative,
                    dateLabel: m.timeType === 'date' && m.dateExact ? formatDate(new Date(m.dateExact)) : (m.periodText || ''),
                    year: m.dateExact ? new Date(m.dateExact).getFullYear() : undefined,
                    mediaUrl: m.media[0]?.url || 'https://picsum.photos/800/600',
                    themes: [], // Les moments n'ont pas de thèmes directs dans le modèle backend final
                    originalType: 'moment',
                    refObject: m
                }));
            } 
            // 2. Sinon, Fallback sur les événements liés (Ancien modèle / Compatibilité)
            else {
                const allEvents = await getEvents();
                const filtered = allEvents.filter(e => e.timelineSlug === timelineSlug || e.timelineId === tl?.id);
                const sorted = filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
                
                contentSlides = sorted.map(e => ({
                    id: e.id,
                    title: e.title,
                    description: e.summary,
                    dateLabel: e.dateISO ? formatDate(new Date(e.dateISO)) : (e.period || String(e.year || '')),
                    year: e.year || (e.dateISO ? new Date(e.dateISO).getFullYear() : undefined),
                    mediaUrl: e.media[0]?.url || 'https://picsum.photos/800/600',
                    themes: e.themes,
                    originalType: 'event',
                    refObject: e
                }));
            }

            setSlides(contentSlides);
            
            // Positionnement
            if (initialEventId) {
                const idx = contentSlides.findIndex(s => s.id === initialEventId);
                if (idx !== -1) setActiveIndex(idx);
            }
            
            setIsLoading(false);
        };
        loadContent();
    }, [timelineSlug, initialEventId]);

    const goNext = () => setActiveIndex(prev => Math.min(prev + 1, slides.length - 1));
    const goPrev = () => setActiveIndex(prev => Math.max(prev - 1, 0));

    const touchStart = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => touchStart.current = e.touches[0].clientX;
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (diff > 50) goNext();
        if (diff < -50) goPrev();
        touchStart.current = null;
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-light font-sans">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-xl"></div>
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] animate-pulse">Chargement du parcours...</p>
            </div>
        );
    }

    if (!timeline || slides.length === 0) return (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-light font-sans">
            <div className="p-8 bg-white rounded-[3rem] shadow-soft border border-border max-w-sm">
                <p className="text-xl font-black text-secondary uppercase tracking-tight mb-3">Parcours Indisponible</p>
                <p className="text-muted-foreground mb-8 text-sm font-medium">Ce récit ne contient pas encore de moments ou est en cours de rédaction.</p>
                <Button onClick={onBack} className="rounded-full px-8 py-6 h-auto font-black uppercase tracking-[0.2em] text-[10px] w-full">
                    Retour aux récits
                </Button>
            </div>
        </div>
    );

    const activeSlide = slides[activeIndex];
    const accentColor = activeSlide.themes[0] ? (THEME_COLORS[activeSlide.themes[0].slug] || '#E67E22') : '#E67E22';

    return (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] overflow-hidden flex flex-col h-screen select-none font-sans">
            {/* Ambient Dynamic Background */}
            <div 
                className="absolute inset-0 opacity-10 blur-[150px] transition-colors duration-[1500ms] ease-in-out pointer-events-none"
                style={{ backgroundColor: accentColor }}
            ></div>

            {/* Navigation Bar */}
            <header className="relative z-10 px-8 pt-10 pb-4 flex items-center justify-between">
                <button 
                    onClick={onBack} 
                    className="p-4 bg-white/50 backdrop-blur-2xl border border-white/40 rounded-full shadow-lg hover:bg-white/80 transition-all active:scale-90 flex items-center justify-center group"
                >
                    <ArrowLeftIcon className="h-6 w-6 text-secondary group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="text-center px-4">
                    <h2 className="text-xl sm:text-2xl font-black text-secondary uppercase tracking-tight leading-none mb-2">
                        {timeline.title}
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-black">
                            Moment {activeIndex + 1} / {slides.length}
                        </p>
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                    </div>
                </div>
                <div className="w-14 hidden sm:block"></div>
            </header>

            {/* Immersive Carousel */}
            <div 
                className="flex-1 relative flex items-center justify-center px-4 overflow-visible"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <button 
                    onClick={goPrev} 
                    disabled={activeIndex === 0} 
                    className="absolute left-10 z-40 p-6 rounded-full bg-white/40 backdrop-blur-3xl border border-white/50 shadow-2xl disabled:opacity-0 transition-all hover:bg-white/60 active:scale-90 hidden lg:flex items-center justify-center"
                >
                    <ChevronLeftIcon className="h-8 w-8 text-secondary" />
                </button>
                <button 
                    onClick={goNext} 
                    disabled={activeIndex === slides.length - 1} 
                    className="absolute right-10 z-40 p-6 rounded-full bg-white/40 backdrop-blur-3xl border border-white/50 shadow-2xl disabled:opacity-0 transition-all hover:bg-white/60 active:scale-90 hidden lg:flex items-center justify-center"
                >
                    <ChevronRightIcon className="h-8 w-8 text-secondary" />
                </button>

                <div className="relative w-full max-w-5xl h-[620px] flex items-center justify-center">
                    {slides.map((slide, idx) => {
                        const offset = idx - activeIndex;
                        const isFocused = offset === 0;
                        const isPrev = offset === -1;
                        const isNext = offset === 1;
                        const isFar = Math.abs(offset) > 1;

                        return (
                            <div
                                key={slide.id}
                                onClick={() => {
                                    if (isPrev) goPrev();
                                    else if (isNext) goNext();
                                    else if (isFocused && slide.originalType === 'event') onViewEvent(slide.refObject);
                                }}
                                className={`absolute transition-all duration-[800ms] cubic-bezier(0.23, 1, 0.32, 1) w-[310px] sm:w-[480px] rounded-[3.5rem] overflow-hidden border border-white/50 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] cursor-pointer group/card
                                    ${isFocused ? 'z-30 scale-100 opacity-100 translate-x-0 rotate-0 translate-y-0' : ''}
                                    ${isPrev ? 'z-20 -translate-x-[65%] sm:-translate-x-[90%] scale-90 opacity-30 blur-[4px] -rotate-6 -translate-y-4' : ''}
                                    ${isNext ? 'z-20 translate-x-[65%] sm:translate-x-[90%] scale-90 opacity-30 blur-[4px] rotate-6 -translate-y-4' : ''}
                                    ${isFar ? 'opacity-0 scale-75 pointer-events-none' : ''}
                                    bg-white/40
                                `}
                            >
                                <div className="h-72 relative overflow-hidden">
                                    <img 
                                        src={slide.mediaUrl} 
                                        alt="" 
                                        className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${isFocused ? 'scale-110' : 'scale-100 group-hover/card:scale-105'}`} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    <div className="absolute top-8 left-8 px-5 py-2.5 bg-black/50 backdrop-blur-xl rounded-2xl text-white text-[10px] font-black tracking-[0.2em] border border-white/20 uppercase shadow-xl">
                                        {slide.dateLabel}
                                    </div>
                                </div>

                                <div className="p-10 sm:p-12 flex flex-col h-full bg-white/10">
                                    <h3 className="text-2xl sm:text-4xl font-black text-secondary leading-tight mb-5 tracking-tight group-hover/card:text-primary transition-colors">
                                        {slide.title}
                                    </h3>
                                    <p className="text-dark/80 text-sm sm:text-lg leading-relaxed line-clamp-4 font-medium mb-8">
                                        {slide.description}
                                    </p>
                                    
                                    <div className="mt-auto flex flex-wrap gap-3">
                                        {slide.themes.map(t => (
                                            <Badge 
                                                key={t.id} 
                                                style={{ backgroundColor: THEME_COLORS[t.slug] || '#ccc', border: 'none', color: '#fff' }}
                                                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm"
                                            >
                                                {t.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Immersive Navigation Bar */}
            <div className="p-10 sm:p-16 relative z-10 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent">
                <div className="max-w-4xl mx-auto space-y-10">
                    <div className="relative h-1.5 w-full bg-black/5 rounded-full overflow-visible">
                        <div 
                            className="absolute h-full bg-primary transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) rounded-full shadow-[0_0_30px_rgba(230,126,34,0.6)]"
                            style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }}
                        ></div>
                        
                        <div className="absolute inset-0 flex justify-between px-0 items-center">
                            {slides.map((s, i) => (
                                <div 
                                    key={s.id} 
                                    className={`relative flex items-center justify-center transition-all duration-700
                                        ${i === activeIndex ? 'scale-150' : 'scale-100'}
                                    `}
                                >
                                    <div className={`h-4 w-4 rounded-full border-4 border-[#FAF8F5] shadow-xl transition-all duration-500 
                                        ${i <= activeIndex ? 'bg-primary' : 'bg-black/10'}
                                    `}></div>
                                    
                                    { (i === 0 || i === slides.length - 1 || i === activeIndex) && (
                                        <span className={`absolute -top-10 text-[10px] font-black whitespace-nowrap uppercase tracking-tighter transition-colors duration-500
                                            ${i === activeIndex ? 'text-primary' : 'text-secondary/40'}
                                        `}>
                                            {s.year || '...'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">
                        <span className="flex items-center gap-2">
                           <div className="h-px w-6 bg-current" /> ORIGINES
                        </span>
                        <div className="flex items-center gap-3 bg-white/40 px-6 py-2 rounded-full border border-white/60 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                            <span>GLISSER POUR NAVIGUER</span>
                        </div>
                        <span className="flex items-center gap-2">
                           PRÉSENT <div className="h-px w-6 bg-current" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
