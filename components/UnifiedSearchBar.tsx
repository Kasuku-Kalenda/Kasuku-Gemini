
import React, { useRef, useEffect, useState } from 'react';
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
};

interface FilterPopoverProps {
  triggerLabel: string;
  icon: React.ReactNode;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ triggerLabel, icon, options, selectedValue, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(filter.toLowerCase()));

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const selectedLabel = selectedValue ? options.find(o => o.value === selectedValue)?.label : triggerLabel;

  return (
    <div ref={popoverRef} className="relative">
      <Button
        variant="ghost"
        className="gap-1 rounded-full px-2.5 py-1.5 h-auto text-xs no-min-h"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate max-w-[52px]">{selectedLabel}</span>
        {selectedValue && (
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />
        )}
      </Button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-card border rounded-md shadow-lg z-20 p-2">
          <Input 
            placeholder={placeholder} 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            className="mb-2"
          />
          <ul className="max-h-60 overflow-y-auto text-sm">
            <li 
              className="px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => handleSelect('')}
            >
              Tous
            </li>
            {filteredOptions.map(opt => (
              <li 
                key={opt.value} 
                className="px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer truncate"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export function UnifiedSearchBar({ themes, countries, allEvents, filters, onFiltersChange, onSuggestionSelect }: UnifiedSearchBarProps) {
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Mobile filters use local state until applied
  const [mobileFilters, setMobileFilters] = useState<Filters>(filters);

  useEffect(() => {
    setMobileFilters(filters);
  }, [filters]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        (document.getElementById("unified-search-input") as HTMLInputElement)?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onFiltersChange({ ...filters, query: newQuery });

    if (newQuery.length > 1) {
      const filteredSuggestions = allEvents.filter(event =>
        event.title.toLowerCase().includes(newQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filteredSuggestions);
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (event: Event) => {
    setSuggestions([]);
    setIsSuggestionsVisible(false);
    onSuggestionSelect(event);
  };

  const years = Array.from({ length: new Date().getFullYear() - 1800 + 1 }, (_, i) => String(new Date().getFullYear() - i));

  const mobileFilterContent = (
    <div className="p-4 space-y-6">
      <div>
        <label className="text-sm font-bold text-secondary uppercase tracking-wider">Thème</label>
        <select 
          value={mobileFilters.theme} 
          onChange={(e) => setMobileFilters({...mobileFilters, theme: e.target.value})} 
          className="mt-2 w-full h-12 px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition bg-white text-base"
        >
          <option value="">Tous les thèmes</option>
          {themes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
       <div>
        <label className="text-sm font-bold text-secondary uppercase tracking-wider">Pays</label>
        <select 
          value={mobileFilters.country} 
          onChange={(e) => setMobileFilters({...mobileFilters, country: e.target.value})} 
          className="mt-2 w-full h-12 px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition bg-white text-base"
        >
          <option value="">Tous les pays</option>
          {countries.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-bold text-secondary uppercase tracking-wider">Année</label>
        <Input 
          type="number" 
          placeholder="Ex: 1969" 
          value={mobileFilters.year} 
          onChange={e => setMobileFilters({...mobileFilters, year: e.target.value})} 
          className="mt-2 w-full" 
        />
      </div>
      <Button className="w-full rounded-xl h-12 font-bold" onClick={() => { onFiltersChange(mobileFilters); setIsSheetOpen(false); }}>
        Appliquer les filtres
      </Button>
    </div>
  );

  return (
    <div
      className="w-full rounded-2xl border bg-card p-2 flex items-center gap-2 shadow-soft"
      aria-label="Recherche et filtres"
      ref={searchContainerRef}
    >
      <div className="flex-1 flex items-center gap-2 relative">
        <SearchIcon className="h-4 w-4 text-muted-foreground ml-2" aria-hidden="true" />
        <Input
          id="unified-search-input"
          value={filters.query}
          onChange={handleQueryChange}
          onFocus={() => { if (filters.query.length > 1 && suggestions.length > 0) setIsSuggestionsVisible(true); }}
          placeholder="Rechercher... (appuyez sur /)"
          className="border-none shadow-none focus-visible:ring-0 px-0 h-9"
          aria-label="Rechercher"
          autoComplete="off"
          onKeyDown={(e) => { if (e.key === "Enter") setIsSuggestionsVisible(false); }}
        />
        {isSuggestionsVisible && suggestions.length > 0 && (
          <ul className="absolute top-full w-full mt-2 bg-card border rounded-md shadow-lg z-30 max-h-60 overflow-y-auto">
            {suggestions.map(event => (
              <li
                key={event.id}
                className="px-4 py-3 hover:bg-muted cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(event)}
              >
                {event.title} <span className="text-muted-foreground">({event.year || event.period})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />

      <div className="hidden md:flex items-center gap-0.5">
        <FilterPopover 
          triggerLabel="Thème"
          icon={<TagIcon className="h-4 w-4" />}
          options={themes}
          selectedValue={filters.theme}
          onSelect={(value) => onFiltersChange({...filters, theme: value})}
          placeholder="Filtrer un thème..."
        />
        <FilterPopover 
          triggerLabel="Pays"
          icon={<GlobeIcon className="h-4 w-4" />}
          options={countries}
          selectedValue={filters.country}
          onSelect={(value) => onFiltersChange({...filters, country: value})}
          placeholder="Rechercher un pays..."
        />
        <FilterPopover 
          triggerLabel="Année"
          icon={<CalendarIcon className="h-4 w-4" />}
          options={years.map(y => ({label: y, value: y}))}
          selectedValue={filters.year}
          onSelect={(value) => onFiltersChange({...filters, year: value})}
          placeholder="Filtrer par année..."
        />
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="md:hidden rounded-2xl gap-2" onClick={() => setIsSheetOpen(true)}>
            <SlidersHorizontalIcon className="h-4 w-4" />
            Filtres
          </Button>
        </SheetTrigger>
        <SheetContent isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="mb-2">
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          {mobileFilterContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
