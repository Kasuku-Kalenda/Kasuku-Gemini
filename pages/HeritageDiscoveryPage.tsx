import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api.service';
import type { HeritageItem, HeritageCategory } from '../types';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

// ── Category meta ─────────────────────────────────────────────────────────────

const CATEGORIES: { value: HeritageCategory | ''; label: string; emoji: string }[] = [
  { value: '',         label: 'Tout',      emoji: '🌍' },
  { value: 'mask',     label: 'Masques',   emoji: '🎭' },
  { value: 'proverb',  label: 'Proverbes', emoji: '💬' },
  { value: 'symbol',   label: 'Symboles',  emoji: '🔯' },
  { value: 'recipe',   label: 'Recettes',  emoji: '🍲' },
  { value: 'craft',    label: 'Artisanat', emoji: '🏺' },
  { value: 'music',    label: 'Musique',   emoji: '🎵' },
  { value: 'other',    label: 'Autre',     emoji: '✨' },
];

const CAT_META: Record<string, { label: string; emoji: string; bg: string }> = {
  mask:    { label: 'Masque',    emoji: '🎭', bg: 'bg-amber-100 text-amber-800' },
  proverb: { label: 'Proverbe',  emoji: '💬', bg: 'bg-blue-100 text-blue-800'  },
  symbol:  { label: 'Symbole',   emoji: '🔯', bg: 'bg-purple-100 text-purple-800' },
  recipe:  { label: 'Recette',   emoji: '🍲', bg: 'bg-green-100 text-green-800' },
  craft:   { label: 'Artisanat', emoji: '🏺', bg: 'bg-orange-100 text-orange-800' },
  music:   { label: 'Musique',   emoji: '🎵', bg: 'bg-pink-100 text-pink-800'  },
  other:   { label: 'Patrimoine',emoji: '✨', bg: 'bg-gray-100 text-gray-700'  },
};

function catMeta(cat?: string) {
  return CAT_META[cat ?? 'other'] ?? CAT_META.other;
}

// ── Card ──────────────────────────────────────────────────────────────────────

const HeritageCard: React.FC<{ item: HeritageItem; onClick: () => void }> = ({ item, onClick }) => {
  const meta = catMeta(item.category);
  return (
    <article
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group transition-all hover:shadow-md active:scale-95"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            {meta.emoji}
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>
          {meta.emoji} {meta.label}
        </span>
        {item.countryCode && (
          <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/30 text-white">
            {item.countryCode}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="font-bold text-sm text-secondary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.period && (
          <p className="text-xs text-muted-foreground">{item.period}</p>
        )}
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>
        )}
      </div>
    </article>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  onSelect: (item: HeritageItem) => void;
}

export const HeritageDiscoveryPage: React.FC<Props> = ({ onBack, onSelect }) => {
  const [items, setItems]           = useState<HeritageItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory]     = useState<HeritageCategory | ''>('');
  const [country, setCountry]       = useState('');
  const [search, setSearch]         = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 24;

  const load = useCallback(async (opts: {
    cat?: HeritageCategory | ''; cntry?: string; q?: string; pg?: number; append?: boolean;
  } = {}) => {
    const { cat = category, cntry = country, q = search, pg = 1, append = false } = opts;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await apiService.listHeritagePublic({ category: cat, country: cntry, q, page: pg, limit: LIMIT });
      setItems(prev => append ? [...prev, ...res.items] : res.items);
      setTotal(res.totalItems);
      setPage(pg);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, country, search]);

  // Initial load
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (newCat: HeritageCategory | '', newCountry: string, newSearch: string) => {
    setCategory(newCat);
    setCountry(newCountry);
    setSearch(newSearch);
    load({ cat: newCat, cntry: newCountry, q: newSearch, pg: 1, append: false });
  };

  const handleCategoryClick = (cat: HeritageCategory | '') => {
    applyFilter(cat, country, search);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 2);
    setCountry(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilter(category, val, search);
    }, 400);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilter(category, country, val);
    }, 400);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      load({ pg: page + 1, append: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-bottom-nav md:pb-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px] px-2 shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </button>
        <div>
          <h1 className="text-2xl font-black text-secondary">🏛️ Patrimoine culturel</h1>
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {total} élément{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Rechercher un patrimoine…"
          className="w-full border rounded-xl px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-soft"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-2 px-2 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => handleCategoryClick(c.value)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              category === c.value
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Country filter */}
      <div className="mb-6 flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">Pays :</label>
        <input
          value={country}
          onChange={handleCountryChange}
          placeholder="SN, CM, CD…"
          maxLength={2}
          className="w-20 border rounded-lg px-2 py-1 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase font-mono"
        />
        {country && (
          <button
            onClick={() => { setCountry(''); applyFilter(category, '', search); }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            ✕ effacer
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">🏛️</p>
          <p className="font-semibold">Aucun patrimoine trouvé</p>
          <p className="text-sm mt-1">Essaie d'autres filtres ou une autre recherche.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <HeritageCard key={item.id} item={item} onClick={() => onSelect(item)} />
            ))}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full border font-semibold text-sm text-secondary hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Chargement…' : `Voir plus (${total - items.length} restants)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
