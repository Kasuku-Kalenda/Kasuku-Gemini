
import React, { useState, useRef } from 'react';
import type { Event } from '../types';
import { formatDate } from '../utils/helpers';
import { THEME_COLORS } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface DateTimelinePageProps {
  onViewEvent: (event: Event) => void;
  events: Event[];
  date: Date;
  onBack: () => void;
}

export const DateTimelinePage: React.FC<DateTimelinePageProps> = ({ onViewEvent, events, date, onBack }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const sortedEvents = [...events].sort((a, b) => (a.year || 0) - (b.year || 0));

    const goNext = () => setActiveIndex(prev => Math.min(prev + 1, sortedEvents.length - 1));
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

    if (sortedEvents.length === 0) return (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-light font-sans">
            <div className="p-8 bg-white rounded-[3rem] shadow-soft border border-border max-w-sm">
                <p className="text-xl font-black text-secondary uppercase tracking-tight mb-3">Aucun événement</p>
                <p className="text-muted-foreground mb-8 text-sm font-medium">Il n'y a pas d'événements à afficher pour cette date.</p>
                <Button onClick={onBack} className="rounded-full px-8 py-6 h-auto font-black uppercase tracking-[0.2em] text-[10px] w-full">
                    Retour au calendrier
                </Button>
            </div>
        </div>
    );

    const activeEvent = sortedEvents[activeIndex];
    const accentColor = activeEvent.themes[0] ? (THEME_COLORS[activeEvent.themes[0].slug] || '#E67E22') : '#E67E22';

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
                        {formatDate(date, { month: 'long', day: 'numeric' })}
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-black">
                            {activeIndex + 1} / {sortedEvents.length}
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
                    disabled={activeIndex === sortedEvents.length - 1} 
                    className="absolute right-10 z-40 p-6 rounded-full bg-white/40 backdrop-blur-3xl border border-white/50 shadow-2xl disabled:opacity-0 transition-all hover:bg-white/60 active:scale-90 hidden lg:flex items-center justify-center"
                >
                    <ChevronRightIcon className="h-8 w-8 text-secondary" />
                </button>

                <div className="relative w-full max-w-5xl h-[620px] flex items-center justify-center">
                    {sortedEvents.map((event, idx) => {
                        const offset = idx - activeIndex;
                        const isFocused = offset === 0;
                        const isPrev = offset === -1;
                        const isNext = offset === 1;
                        const isFar = Math.abs(offset) > 1;

                        return (
                            <div
                                key={event.id}
                                onClick={() => {
                                    if (isPrev) goPrev();
                                    else if (isNext) goNext();
                                    else if (isFocused) onViewEvent(event);
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
                                        src={event.media[0]?.url || 'https://picsum.photos/800/600'} 
                                        alt="" 
                                        className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${isFocused ? 'scale-110' : 'scale-100 group-hover/card:scale-105'}`} 
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    <div className="absolute top-8 left-8 px-5 py-2.5 bg-black/50 backdrop-blur-xl rounded-2xl text-white text-[10px] font-black tracking-[0.2em] border border-white/20 uppercase shadow-xl">
                                        {event.year || (event.dateISO ? new Date(event.dateISO).getFullYear() : '')}
                                    </div>
                                </div>

                                <div className="p-10 sm:p-12 flex flex-col h-full bg-white/10">
                                    <h3 className="text-2xl sm:text-4xl font-black text-secondary leading-tight mb-5 tracking-tight group-hover/card:text-primary transition-colors">
                                        {event.title}
                                    </h3>
                                    <p className="text-dark/80 text-sm sm:text-lg leading-relaxed line-clamp-4 font-medium mb-8">
                                        {event.summary}
                                    </p>
                                    
                                    <div className="mt-auto flex flex-wrap gap-3">
                                        {event.themes.map(t => (
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
                            style={{ width: `${((activeIndex + 1) / sortedEvents.length) * 100}%` }}
                        ></div>
                        
                        <div className="absolute inset-0 flex justify-between px-0 items-center">
                            {sortedEvents.map((s, i) => (
                                <div 
                                    key={s.id} 
                                    className={`relative flex items-center justify-center transition-all duration-700
                                        ${i === activeIndex ? 'scale-150' : 'scale-100'}
                                    `}
                                >
                                    <div className={`h-4 w-4 rounded-full border-4 border-[#FAF8F5] shadow-xl transition-all duration-500 
                                        ${i <= activeIndex ? 'bg-primary' : 'bg-black/10'}
                                    `}></div>
                                    
                                    { (i === 0 || i === sortedEvents.length - 1 || i === activeIndex) && (
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
                           <div className="h-px w-6 bg-current" /> CHRONOLOGIE
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
