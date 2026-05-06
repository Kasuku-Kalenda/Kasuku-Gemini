
import React, { useRef, useEffect, useState, useCallback, useId } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/Sheet';
import { SearchIcon } from './icons/SearchIcon';
import { SlidersHorizontalIcon } from './icons/SlidersHorizontalIcon';
import { TagIcon } from './icons/TagIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import type { Event } from '../types';

export interface Option { label: string; value: string; }
export interface Filters {
  query: string;
  theme: string;
  country: string;
  year: string;
}

interface UnifiedSearchBarProps {
  themes: Option[];
  countries: Option[];
  allEvents: Event[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSuggestionSelect: (event: Event) => void;
  /** Appelé quand l'utilisateur valide une année pour sauter le calendrier */
  onNavigateToYear?: (year: number) => void;
  /** Nombre d'événements dans les résultats filtrés (pour le compteur) */
  resultCount?: number;
}

// ─── FilterPopover compact ────────────────────────────────────────────────────

interface FilterPopoverProps {
  triggerLabel: string;
  icon: React.ReactNode;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  triggerLabel, icon, options, selectedValue, onSelect, placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
    setFilter('');
  };

  const selectedLabel = selectedValue
    ? options.find(o => o.value === selectedValue)?.label ?? triggerLabel
    : triggerLabel;

  const isActive = !!selectedValue;

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`no-min-h inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all border ${
          isActive
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-secondary'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate max-w-[56px]">{selectedLabel}</span>
        {isActive && (
          <span
            className="shrink-0 w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 transition-colors"
            onClick={e => { e.stopPropagation(); onSelect(''); }}
            role="button"
            aria-label="Supprimer le filtre"
          >
            <svg className="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden">
          <div className="p-2 border-b border-border">
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li
              className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer rounded-lg mx-1 flex items-center gap-2"
              onClick={() => handleSelect('')}
            >
              <span className="w-4 h-4 rounded-full border-2 border-border" />
              Tous
            </li>
            {filteredOptions.map(opt => (
              <li
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer rounded-lg mx-1 flex items-center gap-2 ${
                  opt.value === selectedValue
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.value === selectedValue
                  ? <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  : <span className="w-4 h-4 rounded-full border-2 border-border" />
                }
                <span className="truncate">{opt.label}</span>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground text-center">Aucun résultat</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Chip filtre actif ─────────────────────────────────────────────────────────

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-1 rounded-full">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="no-min-h w-3.5 h-3.5 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center transition-colors ml-0.5"
      aria-label="Supprimer"
    >
      <svg className="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
      </svg>
    </button>
  </span>
);

// ─── Composant principal ──────────────────────────────────────────────────────

export function UnifiedSearchBar({
  themes, countries, allEvents, filters, onFiltersChange,
  onSuggestionSelect, onNavigateToYear, resultCount,
}: UnifiedSearchBarProps) {
  const [suggestions, setSuggestions]           = useState<Event[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSheetOpen, setIsSheetOpen]           = useState(false);
  const [yearInput, setYearInput]               = useState(filters.year);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const listboxId          = useId();

  // Sync yearInput ← filters.year (ex : quand on efface les filtres)
  useEffect(() => { setYearInput(filters.year); }, [filters.year]);

  // Fermer suggestions au clic dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsVisible(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Raccourci clavier "/" pour focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Autocomplete
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onFiltersChange({ ...filters, query: v });
    setHighlightedIndex(-1);
    if (v.length > 1) {
      setSuggestions(
        allEvents
          .filter(ev => ev.title.toLowerCase().includes(v.toLowerCase()))
          .slice(0, 6)
      );
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = useCallback((event: Event) => {
    setIsSuggestionsVisible(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSuggestionSelect(event);
  }, [onSuggestionSelect]);

  // Navigation clavier dans l'autocomplétion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsVisible || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsSuggestionsVisible(false);
      setHighlightedIndex(-1);
    }
  };

  // Navigation par année
  const commitYear = useCallback((raw: string) => {
    const y = parseInt(raw, 10);
    if (raw === '') {
      onFiltersChange({ ...filters, year: '' });
    } else if (!isNaN(y) && y >= 1800 && y <= 2100) {
      onFiltersChange({ ...filters, year: String(y) });
      onNavigateToYear?.(y);
    }
  }, [filters, onFiltersChange, onNavigateToYear]);

  // Filtres actifs
  const activeFilters = [
    filters.theme   && { key: 'theme',   label: themes.find(t => t.value === filters.theme)?.label ?? filters.theme },
    filters.country && { key: 'country', label: countries.find(c => c.value === filters.country)?.label ?? filters.country },
    filters.year    && { key: 'year',    label: `${filters.year}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const hasActiveFilters = activeFilters.length > 0;

  const clearAll = () => {
    onFiltersChange({ ...filters, theme: '', country: '', year: '' });
    setYearInput('');
  };

  // Contenu filtres mobile
  const [mobileFilters, setMobileFilters] = useState<Filters>(filters);
  useEffect(() => { setMobileFilters(filters); }, [filters]);

  return (
    <div
      className="w-full rounded-2xl border bg-card shadow-soft overflow-visible"
      aria-label="Recherche et filtres"
      ref={searchContainerRef}
    >
      {/* ── Ligne principale : champ + filtres desktop ─────────────────────── */}
      <div className="flex items-center gap-2 p-2">

        {/* Champ de recherche */}
        <div className="flex-1 flex items-center gap-2 relative min-w-0">
          <SearchIcon className="h-4 w-4 text-muted-foreground ml-1.5 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            id="unified-search-input"
            type="text"
            role="combobox"
            aria-expanded={isSuggestionsVisible}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
            value={filters.query}
            onChange={handleQueryChange}
            onFocus={() => {
              if (filters.query.length > 1 && suggestions.length > 0)
                setIsSuggestionsVisible(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher… (appuyez sur /)"
            className="flex-1 min-w-0 border-none shadow-none outline-none bg-transparent text-sm h-9 placeholder:text-muted-foreground/60"
            autoComplete="off"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => {
                onFiltersChange({ ...filters, query: '' });
                setSuggestions([]);
                setIsSuggestionsVisible(false);
                inputRef.current?.focus();
              }}
              className="no-min-h shrink-0 w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors mr-1"
              aria-label="Effacer la recherche"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Dropdown autocomplétion */}
          {isSuggestionsVisible && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-card border border-border rounded-2xl shadow-xl z-40 overflow-hidden"
            >
              {suggestions.map((event, i) => (
                <li
                  key={event.id}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    i === highlightedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                  } ${i < suggestions.length - 1 ? 'border-b border-border/50' : ''}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSuggestionClick(event)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted">
                    {event.media?.[0]?.url
                      ? <img src={event.media[0].url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm">📅</div>
                    }
                  </div>
                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-secondary truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {event.dateISO ?? event.period}
                      {event.countryCode ? ` · ${event.countryCode}` : ''}
                    </p>
                  </div>
                  {/* Flèche */}
                  <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </li>
              ))}
              <li className="px-3 py-2 text-[10px] text-muted-foreground/60 text-center border-t border-border/40">
                ↑↓ naviguer · Entrée sélectionner · Échap fermer
              </li>
            </ul>
          )}
        </div>

        {/* Séparateur */}
        <span className="h-5 w-px bg-border shrink-0 hidden sm:block" aria-hidden />

        {/* ── Filtres desktop ──────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <FilterPopover
            triggerLabel="Thème"
            icon={<TagIcon className="h-3.5 w-3.5" />}
            options={themes}
            selectedValue={filters.theme}
            onSelect={v => onFiltersChange({ ...filters, theme: v })}
            placeholder="Filtrer un thème…"
          />
          <FilterPopover
            triggerLabel="Pays"
            icon={<GlobeIcon className="h-3.5 w-3.5" />}
            options={countries}
            selectedValue={filters.country}
            onSelect={v => onFiltersChange({ ...filters, country: v })}
            placeholder="Rechercher un pays…"
          />

          {/* Année — input numérique compact (saute le calendrier) */}
          <div className={`relative inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 border text-xs font-bold transition-all ${
            filters.year
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}>
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            <input
              type="number"
              value={yearInput}
              onChange={e => setYearInput(e.target.value)}
              onBlur={e => commitYear(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { commitYear(yearInput); (e.target as HTMLInputElement).blur(); } }}
              placeholder="Année"
              min={1800}
              max={2100}
              className={`w-14 bg-transparent border-none outline-none text-xs font-bold placeholder:font-normal ${
                filters.year ? 'placeholder:text-white/60' : 'placeholder:text-muted-foreground/60'
              }`}
              aria-label="Filtrer par année (appuyez sur Entrée)"
            />
            {filters.year && (
              <button
                type="button"
                onClick={() => { setYearInput(''); onFiltersChange({ ...filters, year: '' }); }}
                className="no-min-h w-3.5 h-3.5 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors"
                aria-label="Effacer l'année"
              >
                <svg className="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bouton filtres mobile avec badge */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className={`md:hidden no-min-h relative inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-bold transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-secondary border-border hover:border-primary/40'
              }`}
            >
              <SlidersHorizontalIcon className="h-4 w-4" />
              <span>Filtres</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-white/25 text-[10px] font-black flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} side="bottom" className="h-auto rounded-t-2xl">
            <SheetHeader className="mb-2">
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-5">
              <div>
                <label className="text-xs font-black text-secondary uppercase tracking-wider">Thème</label>
                <select
                  value={mobileFilters.theme}
                  onChange={e => setMobileFilters(f => ({ ...f, theme: e.target.value }))}
                  className="mt-2 w-full h-11 px-4 border border-border rounded-xl bg-white text-sm focus:outline-none"
                >
                  <option value="">Tous les thèmes</option>
                  {themes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-secondary uppercase tracking-wider">Pays</label>
                <select
                  value={mobileFilters.country}
                  onChange={e => setMobileFilters(f => ({ ...f, country: e.target.value }))}
                  className="mt-2 w-full h-11 px-4 border border-border rounded-xl bg-white text-sm focus:outline-none"
                >
                  <option value="">Tous les pays</option>
                  {countries.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-secondary uppercase tracking-wider">Année</label>
                <Input
                  type="number"
                  placeholder="Ex : 1969"
                  value={mobileFilters.year}
                  onChange={e => setMobileFilters(f => ({ ...f, year: e.target.value }))}
                  className="mt-2 w-full"
                  min={1800}
                  max={2100}
                />
              </div>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold"
                    onClick={() => {
                      setMobileFilters({ query: filters.query, theme: '', country: '', year: '' });
                    }}
                  >
                    Effacer tout
                  </Button>
                )}
                <Button
                  className="flex-1 rounded-xl h-11 font-bold"
                  onClick={() => {
                    onFiltersChange(mobileFilters);
                    if (mobileFilters.year) {
                      const y = parseInt(mobileFilters.year, 10);
                      if (!isNaN(y)) onNavigateToYear?.(y);
                    }
                    setIsSheetOpen(false);
                  }}
                >
                  Appliquer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Chips des filtres actifs + compteur ──────────────────────────────── */}
      {(hasActiveFilters || resultCount !== undefined) && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-3 pb-2.5 pt-0.5 border-t border-border/40">

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map(f => (
              <FilterChip
                key={f.key}
                label={f.label}
                onRemove={() => {
                  onFiltersChange({ ...filters, [f.key]: '' });
                  if (f.key === 'year') setYearInput('');
                }}
              />
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="no-min-h text-[11px] text-muted-foreground hover:text-secondary font-bold px-2 py-0.5 rounded-full hover:bg-muted transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          {/* Compteur résultats */}
          {resultCount !== undefined && (
            <span className="text-[11px] text-muted-foreground font-medium ml-auto">
              {resultCount} événement{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
