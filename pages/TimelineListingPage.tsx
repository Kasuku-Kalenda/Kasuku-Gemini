
import React, { useState, useEffect } from 'react';
import { getTimelines } from '../services/api';
import type { TimelineNarrative } from '../types';
import { Button } from '../components/ui/Button';
import { TimelineIcon } from '../components/icons/TimelineIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { THEME_COLORS } from '../constants';

interface TimelineListingPageProps {
  onSelectTimeline: (slug: string) => void;
}

const StackedCardIcon: React.FC<{ thumbnail: string, count: number }> = ({ thumbnail, count }) => {
    return (
        <div className="relative w-full aspect-[4/3] group mb-8">
            {/* Third card (deepest) */}
            <div className="absolute inset-0 translate-x-6 -translate-y-6 rounded-[2.5rem] bg-primary/10 border border-primary/10 backdrop-blur-sm transition-all duration-700 group-hover:translate-x-9 group-hover:-translate-y-9 opacity-40" />
            
            {/* Second card */}
            <div className="absolute inset-0 translate-x-3 -translate-y-3 rounded-[2.5rem] bg-white/40 border border-white/30 backdrop-blur-md transition-all duration-700 group-hover:translate-x-4 group-hover:-translate-y-4 shadow-md opacity-70" />
            
            {/* Main top card */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/50 bg-card transition-all duration-700 group-hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)]">
                <img 
                    src={thumbnail} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                
                {/* Count Badge */}
                <div className="absolute top-6 right-6 px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg">
                    {count} MOMENTS
                </div>
            </div>
        </div>
    );
};

export const TimelineListingPage: React.FC<TimelineListingPageProps> = ({ onSelectTimeline }) => {
  const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTimelines().then(data => {
      // Filtrage sécurité (seuls les nouveaux formats "parcours" sont affichés)
      setTimelines(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24 px-4 pt-4">
      <header className="space-y-6 text-center sm:text-left max-w-2xl">
        <div className="inline-flex items-center gap-3 text-primary bg-primary/5 px-5 py-2 rounded-full">
            <TimelineIcon className="h-6 w-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Histoires Narratives</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-secondary leading-[1.1] tracking-tight">
          Bibliothèque de <br />
          <span className="text-primary">Parcours</span>
        </h1>
        <p className="text-dark/60 text-lg font-medium leading-relaxed">
          Choisissez un récit et laissez-vous guider à travers les moments fondateurs qui ont sculpté le destin de figures emblématiques.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          {[1, 2].map(i => (
             <div key={i} className="space-y-6">
                <div className="aspect-[4/3] bg-muted animate-pulse rounded-[3rem]"></div>
                <div className="h-8 bg-muted animate-pulse rounded-2xl w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded-full w-1/2"></div>
             </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          {timelines.map(tl => (
            <div 
              key={tl.id} 
              className="group cursor-pointer flex flex-col"
              onClick={() => onSelectTimeline(tl.slug)}
            >
              <StackedCardIcon thumbnail={tl.thumbnail} count={tl.eventCount} />
              
              <div className="space-y-4 px-2">
                <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.25em] opacity-80">
                   <div className="w-4 h-[2px] bg-current" />
                   {tl.periodLabel}
                </div>
                <h3 className="text-3xl font-black text-secondary group-hover:text-primary transition-colors leading-tight">
                    {tl.title}
                </h3>
                <p className="text-dark/70 text-base leading-relaxed line-clamp-3 font-medium">
                    {tl.shortDescription}
                </p>
                <div className="pt-4 flex items-center">
                    <Button variant="outline" className="rounded-full px-10 py-7 h-auto border-secondary/10 hover:border-primary/40 hover:bg-primary/5 text-secondary hover:text-primary font-black text-[11px] uppercase tracking-[0.2em] transition-all group-hover:translate-x-2">
                        Lancer le parcours
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Dynamic Visual Elements */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-primary/5 blur-[120px] -z-10 pointer-events-none rounded-full animate-pulse"></div>
      <div className="fixed bottom-1/4 -left-20 w-96 h-96 bg-secondary/5 blur-[150px] -z-10 pointer-events-none rounded-full"></div>
    </div>
  );
};
