/**
 * PeriodsSection — Section "Périodes & Siècles"
 *
 * Affiche les événements sans date exacte groupés par siècle/décennie.
 * Top 5 par richesse en avant, collapse pour le reste.
 * Utilisé dans DiscoverPage (HomePage).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Event } from '../types';
import { getApproximateEvents } from '../services/api';

// Convertit un numéro de siècle ou décennie en libellé lisible
function formatEra(n: number): string {
  if (n === 0) return 'Époque inconnue';
  if (n >= 1000) return `Années ${n}`;
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

const FEATURED_ERAS = 5;

interface PeriodsSectionProps {
  onViewEvent: (event: Event) => void;
}

export const PeriodsSection: React.FC<PeriodsSectionProps> = ({ onViewEvent }) => {
  const [approximateEvents, setApproximateEvents] = useState<Event[]>([]);
  const [selectedEra, setSelectedEra]             = useState<number | null>(null);
  const [showAllEras, setShowAllEras]             = useState(false);

  useEffect(() => {
    getApproximateEvents().then(setApproximateEvents);
  }, []);

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

  const sortedEras  = useMemo(
    () => [...approximateByEra].sort((a, b) => b.events.length - a.events.length),
    [approximateByEra],
  );
  const visibleEras = showAllEras ? sortedEras : sortedEras.slice(0, FEATURED_ERAS);
  const hiddenCount = Math.max(0, sortedEras.length - FEATURED_ERAS);

  if (approximateByEra.length === 0) return null;

  return (
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

      {/* Grille de cartes */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {visibleEras.map(({ era, events }, eraIdx) => {
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

              <div className={`absolute inset-0 transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-t from-primary/85 via-primary/40 to-primary/10 ring-2 ring-primary ring-inset'
                  : 'bg-gradient-to-t from-black/75 via-black/20 to-transparent'
              }`} />

              {/* Compteur */}
              <div className="absolute top-2 right-2 z-10">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white text-primary' : 'bg-black/40 text-white backdrop-blur-sm'
                }`}>
                  {events.length}
                </span>
              </div>

              {/* Thème */}
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

              {/* Titre */}
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

      {/* Bouton collapse */}
      {hiddenCount > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={() => { setShowAllEras(v => !v); if (showAllEras) setSelectedEra(null); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/60 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            {showAllEras
              ? <>Réduire ↑</>
              : <>Voir {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} période{hiddenCount > 1 ? 's' : ''} →</>
            }
          </button>
        </div>
      )}

      {/* Panel événements inline */}
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
                    + {group.events.length - 6} autres événements
                  </p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
