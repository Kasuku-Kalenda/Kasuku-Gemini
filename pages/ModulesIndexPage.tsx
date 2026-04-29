
import React, { useState, useEffect, useCallback } from 'react';
import type { TrainingModule } from '../types';
import { getModules } from '../services/api';
import { ModuleCard } from '../components/ModuleCard';
import { ModuleCardSkeleton } from '../components/ModuleCardSkeleton';
import { ModuleFilters, Filters } from '../components/ModuleFilters';
import { Pagination } from '../components/Pagination';
import { useFavorites } from '../hooks/useFavorites';
import { SearchIcon } from '../components/icons/SearchIcon';
import { SheetContent, SheetHeader, SheetTitle } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { SlidersHorizontalIcon } from '../components/icons/SlidersHorizontalIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { Badge } from '../components/ui/Badge';

type ViewMode = 'grid' | 'list';

interface ModulesIndexPageProps {
  navigateToModule: (slug: string) => void;
}

export const ModulesIndexPage: React.FC<ModulesIndexPageProps> = ({ navigateToModule }) => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [view, setView] = useState<ViewMode>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { exists, toggle } = useFavorites();

  const fetchAndSetModules = useCallback(async (newQuery: string, newFilters: Partial<Filters>, newPage: number) => {
    setIsLoading(true);
    const result = await getModules({
      query: newQuery,
      page: newPage,
      limit: 12,
      level: newFilters.level,
      lang: newFilters.lang,
      maxDuration: newFilters.maxDuration === 180 ? undefined : newFilters.maxDuration,
      type: (Object.keys(newFilters.types || {}) as (keyof Filters['types'])[]).find(k => newFilters.types?.[k]),
      creator: newFilters.creator,
    });
    setModules(result.items);
    setPage(result.page);
    setTotalPages(result.totalPages);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAndSetModules(query, filters, 1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query, filters, fetchAndSetModules]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchAndSetModules(query, filters, newPage);
    window.scrollTo(0, 0);
  };

  const toggleFav = (m: TrainingModule) =>
    toggle({ type: 'module', id: m.id, slug: m.slug, title: m.title, thumbnail: m.thumbnail });

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8">
      {/* ── Desktop sidebar filters ───────────────────────────────────────── */}
      <aside className="hidden lg:block sticky top-24 h-fit">
        <ModuleFilters onFilterChange={handleFilterChange} />
      </aside>

      <main>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary">Tous les modules</h1>
          <p className="mt-1 text-muted-foreground text-sm">Parcourez et découvrez des modules de formation pour approfondir vos connaissances.</p>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher un module…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Mobile filters button */}
          <Button
            variant="outline"
            className="lg:hidden rounded-xl gap-2"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <SlidersHorizontalIcon className="h-4 w-4" />
            Filtres
          </Button>

          {/* View toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden bg-card shrink-0">
            {(['grid', 'list'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`no-min-h px-3 py-2.5 transition-colors ${
                  view === v ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                }`}
                aria-label={v === 'grid' ? 'Vue grille' : 'Vue liste'}
              >
                {v === 'grid' ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ModuleCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          )
        ) : modules.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl shadow-soft">
            <h3 className="text-xl font-semibold">Aucun module trouvé</h3>
            <p className="text-muted-foreground mt-2 text-sm">Essayez d'ajuster vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <>
            {/* Grid view */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {modules.map(m => (
                  <ModuleCard
                    key={m.slug}
                    module={m}
                    onNavigate={navigateToModule}
                    isFavorite={exists('module', m.id)}
                    onToggleFavorite={() => toggleFav(m)}
                  />
                ))}
              </div>
            )}

            {/* List view */}
            {view === 'list' && (
              <div className="space-y-2">
                {modules.map(m => (
                  <div
                    key={m.slug}
                    className="group flex items-center gap-4 p-3 sm:p-4 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => navigateToModule(m.slug)}
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
                      <img
                        src={m.thumbnail ?? `https://picsum.photos/seed/${m.slug}/160/160`}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-secondary leading-snug truncate group-hover:text-primary transition-colors">
                        {m.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {m.level && <Badge className="text-[10px] px-2 py-0.5">{m.level}</Badge>}
                        {m.language && <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{m.language === 'fr' ? 'FR' : 'EN'}</Badge>}
                        {m.durationMin && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                            <ClockIcon className="h-3 w-3" />{m.durationMin} min
                          </span>
                        )}
                      </div>
                      {m.shortDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.shortDescription}</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        className="no-min-h p-2.5 rounded-full transition-all active:scale-90 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={e => { e.stopPropagation(); toggleFav(m); }}
                        aria-label={exists('module', m.id) ? 'Retirer' : 'Sauvegarder'}
                      >
                        <StarIcon className={`h-4 w-4 ${exists('module', m.id) ? 'fill-current text-primary' : ''}`} />
                      </button>
                      <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </main>

      {/* ── Mobile filters sheet ──────────────────────────────────────────── */}
      <SheetContent isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} side="bottom" className="p-0">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 p-4">
          <ModuleFilters onFilterChange={(f) => { handleFilterChange(f); setIsFilterSheetOpen(false); }} />
        </div>
      </SheetContent>
    </div>
  );
};
