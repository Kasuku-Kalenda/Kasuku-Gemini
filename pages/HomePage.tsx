
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { Event, Theme, FeaturedStory } from '../types';
import { getEvents, getThemes, getCountries, getFeaturedItems } from '../services/api';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { useFavorites } from '../hooks/useFavorites';
import { SearchIcon } from '../components/icons/SearchIcon';
import { FeaturedStories } from '../components/home/FeaturedStories';

interface HomePageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  scrollToId?: string | null;
  onScrolled?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewEvent, navigateToModule, scrollToId, onScrolled }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const { exists, toggle } = useFavorites();
  const isInitialMount = useRef(true);
  
  const [featuredItems, setFeaturedItems] = useState<FeaturedStory[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // State for intelligent search
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollToId && onScrolled) {
      const element = document.getElementById(`event-card-${scrollToId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
      onScrolled();
    }
  }, [scrollToId, onScrolled]);

  // Effect for initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        const [initialEvents, fetchedThemes, featured] = await Promise.all([
            getEvents(), 
            getThemes(),
            getFeaturedItems()
        ]);
        setEvents(initialEvents);
        setAllEvents(initialEvents); // Keep a copy of all events for suggestions
        setThemes(fetchedThemes);
        setFeaturedItems(featured);
        setIsLoading(false);
        setIsLoadingFeatured(false);
    };
    fetchInitialData();
  }, []);
  
  // Effect for handling filter changes with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      setIsLoading(true);
      getEvents({ query, theme: selectedTheme }).then(fetchedEvents => {
        setEvents(fetchedEvents);
        setIsLoading(false);
      });
    }, 500); // Debounce search

    return () => clearTimeout(handler);
  }, [query, selectedTheme]);

  // Effect for handling clicks outside the search component to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (newQuery.length > 1) {
      const filteredSuggestions = allEvents.filter(event =>
        event.title.toLowerCase().includes(newQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (event: Event) => {
    setQuery(event.title);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
  };

  return (
    <div className="space-y-8">
      <FeaturedStories 
        items={featuredItems} 
        onNavigateToModule={navigateToModule}
        onNavigateToEvent={(slug) => {
            const event = allEvents.find(e => e.slug === slug);
            if (event) onViewEvent(event);
        }}
      />

      <div className="text-center p-8 bg-card rounded-2xl shadow-soft">
        <h1 className="text-4xl md:text-5xl font-bold text-secondary">Discover History, One Day at a Time</h1>
        <p className="mt-4 text-lg text-dark/70 max-w-2xl mx-auto">
          Explore significant cultural and historical events from around the world. Use the filters below to start your journey.
        </p>
      </div>
      
      <div className="p-4 bg-card rounded-2xl shadow-soft flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow" ref={searchContainerRef}>
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for events, people, places..."
            value={query}
            onChange={handleQueryChange}
            onFocus={() => { if (query.length > 1 && suggestions.length > 0) setIsSuggestionsVisible(true); }}
            className="w-full pl-10 pr-4 h-11 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-base"
            autoComplete="off"
          />
          {isSuggestionsVisible && suggestions.length > 0 && (
            <ul className="absolute top-full w-full mt-2 bg-card border border-border rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
              {suggestions.map(event => (
                <li
                  key={event.id}
                  className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-0"
                  onClick={() => handleSuggestionClick(event)}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleSuggestionClick(event)}
                >
                  {event.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="w-full md:w-auto h-11 px-4 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white text-base"
        >
          <option value="">All Themes</option>
          {themes.map(theme => (
            <option key={theme.id} value={theme.slug}>{theme.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)
        ) : events.length > 0 ? (
          events.map(event => (
            <EventCard 
              key={event.id} 
              id={`event-card-${event.id}`}
              event={event} 
              onView={() => onViewEvent(event)}
              isFavorite={exists('event', event.id)}
              onToggleFavorite={() => toggle({
                type: 'event',
                id: event.id,
                slug: event.slug,
                title: event.title,
                thumbnail: event.media[0]?.url
              })}
              onViewModule={navigateToModule}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <h3 className="text-xl font-semibold">No Events Found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
