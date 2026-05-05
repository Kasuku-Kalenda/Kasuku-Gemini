
import React, { useState, useEffect, useMemo } from 'react';
import { getTimelines } from '../services/api';
import type { TimelineNarrative } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { TimelineIcon } from '../components/icons/TimelineIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { StarIcon } from '../components/icons/StarIcon';

type ViewMode = 'grid' | 'list' | 'cover';
type SortKey = 'alpha-asc' | 'alpha-desc' | 'moments-desc' | 'moments-asc' | 'recent';

interface TimelineListingPageProps {
  onSelectTimeline: (slug: string) => void;
}

// ─── Stacked card visual (grid view) ────────────────────────────────────────
const StackedCardIcon: React.FC<{ thumbnail: string; count: number }> = ({ thumbnail, count }) => (
  <div className="relative w-full aspect-[4/3] group mb-6">
    <div className="absolute inset-0 translate-x-6 -translate-y-6 rounded-[2.5rem] bg-primary/10 border border-primary/10 transition-all duration-700 group-hover:translate-x-9 group-hover:-translate-y-9 opacity-40" />
    <div className="absolute inset-0 translate-x-3 -translate-y-3 rounded-[2.5rem] bg-white/40 border border-white/30 backdrop-blur-md transition-all duration-700 group-hover:translate-x-4 group-hover:-translate-y-4 shadow-md opacity-70" />
    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/50 bg-card transition-all duration-700 group-hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)]">
      <img src={thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
      <div className="absolute top-6 right-6 px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg">
        {count} MOMENTS
      </div>
    </div>
  </div>
);

// ─── Save button ─────────────────────────────────────────────────────────────
const SaveButton: React.FC<{ tl: TimelineNarrative; isFav: boolean; onToggle: () => void; dark?: boolean }> = ({
  isFav, onToggle, dark,
}) => (
  <button
    className={`no-min-h p-2.5 rounded-full transition-all active:scale-90 ${
      dark
        ? 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60'
        : isFav
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary'
    }`}
    onClick={e => { e.stopPropagation(); onToggle(); }}
    aria-label={isFav ? 'Retirer des sauvegardes' : 'Sauvegarder'}
  >
    <StarIcon className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
  </button>
);

export const TimelineListingPage: React.FC<TimelineListingPageProps> = ({ onSelectTimeline }) => {
  const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>('grid');

  const { exists, toggle } = useFavorites();

  useEffect(() => {
    getTimelines().then(data => { setTimelines(data); setIsLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = [...timelines];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(tl => tl.title.toLowerCase().includes(q) || tl.shortDescription?.toLowerCase().includes(q));
    switch (sort) {
      case 'alpha-asc':  list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'alpha-desc': list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'moments-desc': list.sort((a, b) => b.eventCount - a.eventCount); break;
      case 'moments-asc':  list.sort((a, b) => a.eventCount - b.eventCount); break;
      case 'recent': break; // server order
    }
    return list;
  }, [timelines, search, sort]);

  const isFav = (tl: TimelineNarrative) => exists('timeline', tl.id);
  const toggleFav = (tl: TimelineNarrative) =>
    toggle({ type: 'timeline', id: tl.id, slug: tl.slug, title: tl.title, thumbnail: tl.thumbnail });

  // ── Skeletons ──────────────────────────────────────────────────────────────
  const Skeletons = () => (
    <>
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-6">
              <div className="aspect-[4/3] bg-muted animate-pulse rounded-[3rem]" />
              <div className="h-8 bg-muted animate-pulse rounded-2xl w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded-full w-1/2" />
            </div>
          ))}
        </div>
      )}
      {view !== 'grid' && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="pb-16 md:pb-4 space-y-0">

      {/* ── 2-column layout on desktop ─────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

        {/* ── COLONNE GAUCHE — Header + contrôles (sticky) ─────────────────── */}
        <div className="lg:sticky lg:top-4 space-y-4">

          {/* En-tête */}
          <div className="bg-card rounded-2xl shadow-soft p-5 space-y-4">
            <div className="inline-flex items-center gap-2.5 text-primary bg-primary/5 px-4 py-2 rounded-full">
              <TimelineIcon className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Histoires Narratives</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-secondary leading-[1.1] tracking-tight">
                Bibliothèque de <span className="text-primary">Récits</span>
              </h1>
              <p className="mt-2 text-dark/60 text-sm font-medium leading-relaxed">
                Choisissez un récit et laissez-vous guider à travers les moments fondateurs.
              </p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-card rounded-2xl shadow-soft p-4 space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un récit…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Sort + view */}
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="recent">Plus récents</option>
                <option value="alpha-asc">A → Z</option>
                <option value="alpha-desc">Z → A</option>
                <option value="moments-desc">Plus de moments</option>
                <option value="moments-asc">Moins de moments</option>
              </select>

              <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
                {(['grid', 'list', 'cover'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`no-min-h px-3 py-2 text-xs font-bold transition-colors ${
                      view === v ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                    }`}
                    aria-label={`Vue ${v}`}
                    title={v === 'grid' ? 'Grille' : v === 'list' ? 'Liste' : 'Couvertures'}
                  >
                    {v === 'grid' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                      </svg>
                    ) : v === 'list' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                        <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
                        <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="11" rx="2" strokeWidth="2" />
                        <line x1="3" y1="18" x2="10" y2="18" strokeWidth="2" strokeLinecap="round" />
                        <line x1="3" y1="21" x2="7" y2="21" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Compteur */}
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {filtered.length} récit{filtered.length !== 1 ? 's' : ''}
                {search ? ` pour « ${search} »` : ''}
              </p>
            )}
          </div>

          {/* Stat card — visible seulement si des récits sont chargés */}
          {!isLoading && timelines.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl shadow-soft p-4 text-center">
                <p className="text-2xl font-black text-primary">{timelines.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Récits</p>
              </div>
              <div className="bg-card rounded-2xl shadow-soft p-4 text-center">
                <p className="text-2xl font-black text-secondary">
                  {timelines.reduce((acc, tl) => acc + tl.eventCount, 0)}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Moments</p>
              </div>
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE — Contenu ──────────────────────────────────────── */}
        <div>
          {/* Controls bar — mobile only */}
          <div className="lg:hidden flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
            <div className="relative flex-1 min-w-0">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un récit…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
              <option value="moments-desc">Plus de moments</option>
              <option value="moments-asc">Moins de moments</option>
            </select>
            <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
              {(['grid', 'list', 'cover'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`no-min-h px-3 py-2.5 text-xs font-bold transition-colors ${
                    view === v ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {v === 'grid' ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                    </svg>
                  ) : v === 'list' ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="11" rx="2" strokeWidth="2" />
                      <line x1="3" y1="18" x2="10" y2="18" strokeWidth="2" strokeLinecap="round" />
                      <line x1="3" y1="21" x2="7" y2="21" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ──────────────────────────────────────────────────────── */}
          {isLoading ? <Skeletons /> : filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-2xl shadow-soft">
              <TimelineIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-secondary">Aucun récit trouvé</h3>
              <p className="text-muted-foreground mt-1 text-sm">Essayez un autre mot-clé.</p>
            </div>
          ) : (
            <>
              {/* ── GRID VIEW ────────────────────────────────────────────────── */}
              {view === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-16">
                  {filtered.map(tl => (
                    <div
                      key={tl.id}
                      className="group cursor-pointer flex flex-col"
                      onClick={() => onSelectTimeline(tl.slug)}
                    >
                      <div className="relative">
                        <StackedCardIcon thumbnail={tl.thumbnail} count={tl.eventCount} />
                        <div className="absolute top-2 right-8 z-10">
                          <SaveButton tl={tl} isFav={isFav(tl)} onToggle={() => toggleFav(tl)} dark />
                        </div>
                      </div>
                      <div className="space-y-3 px-2">
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.25em] opacity-80">
                          <div className="w-4 h-[2px] bg-current" />
                          {tl.periodLabel}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-secondary group-hover:text-primary transition-colors leading-tight">
                          {tl.title}
                        </h3>
                        <p className="text-dark/70 text-sm leading-relaxed line-clamp-3 font-medium">{tl.shortDescription}</p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 rounded-full px-6 py-3 border border-secondary/10 hover:border-primary/40 hover:bg-primary/5 text-secondary hover:text-primary font-black text-[11px] uppercase tracking-[0.2em] transition-all group-hover:translate-x-2 cursor-pointer">
                            Lancer le parcours →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── LIST VIEW ────────────────────────────────────────────────── */}
              {view === 'list' && (
                <div className="space-y-2">
                  {filtered.map(tl => (
                    <div
                      key={tl.id}
                      className="group flex items-center gap-4 p-3 sm:p-4 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-md cursor-pointer transition-all"
                      onClick={() => onSelectTimeline(tl.slug)}
                    >
                      <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
                        {tl.thumbnail ? (
                          <img src={tl.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <TimelineIcon className="h-6 w-6 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-primary text-[9px] font-black uppercase tracking-widest">
                          <ClockIcon className="h-3 w-3 shrink-0" /> {tl.periodLabel}
                        </div>
                        <p className="font-bold text-secondary leading-snug truncate group-hover:text-primary transition-colors">
                          {tl.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{tl.shortDescription}</p>
                        <p className="text-[10px] text-muted-foreground">{tl.eventCount} moments</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <SaveButton tl={tl} isFav={isFav(tl)} onToggle={() => toggleFav(tl)} />
                        <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── COVER VIEW ───────────────────────────────────────────────── */}
              {view === 'cover' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(tl => (
                    <div
                      key={tl.id}
                      className="group relative cursor-pointer rounded-[1.5rem] overflow-hidden aspect-[3/4] bg-muted shadow-md hover:shadow-xl transition-all"
                      onClick={() => onSelectTimeline(tl.slug)}
                    >
                      {tl.thumbnail ? (
                        <img
                          src={tl.thumbnail}
                          alt={tl.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                          <TimelineIcon className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
                      <div className="absolute top-4 right-4 z-10">
                        <SaveButton tl={tl} isFav={isFav(tl)} onToggle={() => toggleFav(tl)} dark />
                      </div>
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl text-[9px] font-black text-white uppercase tracking-widest">
                        {tl.eventCount} moments
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-white/60 text-[9px] font-black uppercase tracking-widest">
                          <ClockIcon className="h-3 w-3" /> {tl.periodLabel}
                        </div>
                        <h3 className="text-white font-black text-lg leading-tight line-clamp-3 group-hover:text-primary/90 transition-colors">
                          {tl.title}
                        </h3>
                        <p className="text-white/60 text-xs line-clamp-2">{tl.shortDescription}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Ambient glows */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-primary/5 blur-[120px] -z-10 pointer-events-none rounded-full animate-pulse" />
      <div className="fixed bottom-1/4 -left-20 w-96 h-96 bg-secondary/5 blur-[150px] -z-10 pointer-events-none rounded-full" />
    </div>
  );
};
