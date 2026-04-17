
import React, { useState, useEffect, useCallback } from 'react';
import type { TrainingModule } from '../types';
import { getModules } from '../services/api';
import { ModuleCard } from '../components/ModuleCard';
import { ModuleCardSkeleton } from '../components/ModuleCardSkeleton';
import { ModuleFilters, Filters } from '../components/ModuleFilters';
import { Pagination } from '../components/Pagination';
import { useFavorites } from '../hooks/useFavorites';
import { SearchIcon } from '../components/icons/SearchIcon';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/Sheet';
import { Button } from '../components/ui/Button';
import { SlidersHorizontalIcon } from '../components/icons/SlidersHorizontalIcon';


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
  const { exists, toggle } = useFavorites();

  const fetchAndSetModules = useCallback(async (newQuery: string, newFilters: Partial<Filters>, newPage: number) => {
    setIsLoading(true);
    const result = await getModules({
      query: newQuery,
      page: newPage,
      limit: 12,
      level: newFilters.level,
      lang: newFilters.lang,
      maxDuration: newFilters.maxDuration === 180 ? undefined : newFilters.maxDuration, // Don't filter if max
      type: (Object.keys(newFilters.types || {}) as (keyof Filters['types'])[]).find(k => newFilters.types?.[k]),
      creator: newFilters.creator
    });
    setModules(result.items);
    setPage(result.page);
    setTotalPages(result.totalPages);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAndSetModules(query, filters, 1);
    }, 500); // Debounce
    return () => clearTimeout(handler);
  }, [query, filters, fetchAndSetModules]);
  
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({...prev, ...newFilters}));
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchAndSetModules(query, filters, newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8">
      <aside className="hidden lg:block sticky top-24 h-fit">
        <ModuleFilters onFilterChange={handleFilterChange} />
      </aside>

      <main>
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-secondary">Tous les modules</h1>
            <p className="mt-2 text-muted-foreground">Parcourez, filtrez et découvrez des modules de formation pour approfondir vos connaissances.</p>
        </div>
        <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-grow">
                 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Rechercher un module..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none transition"
                />
            </div>
          
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
                        Filtres
                    </Button>
                </SheetTrigger>
                <SheetContent isOpen={false} onClose={() => {}} className="p-0">
                    <ModuleFilters onFilterChange={handleFilterChange} />
                </SheetContent>
            </Sheet>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ModuleCardSkeleton key={i} />)}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl shadow-soft">
            <h3 className="text-xl font-semibold">Aucun module trouvé</h3>
            <p className="text-muted-foreground mt-2">Essayez d’ajuster vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {modules.map(m => (
                <ModuleCard 
                    key={m.slug} 
                    module={m} 
                    onNavigate={navigateToModule} 
                    isFavorite={exists('module', m.id)}
                    onToggleFavorite={() => toggle({
                        type: 'module',
                        id: m.id,
                        slug: m.slug,
                        title: m.title,
                        thumbnail: m.thumbnail,
                    })}
                />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </main>
    </div>
  );
};
