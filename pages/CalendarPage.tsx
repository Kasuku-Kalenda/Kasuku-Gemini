
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar } from '../components/ui/Calendar';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { SheetContent, SheetHeader, SheetTitle } from '../components/ui/Sheet';
import { getEvents, getThemes, getCountries, getFeaturedItems } from '../services/api';
import type { Event, Theme, FeaturedStory } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { formatDate } from '../utils/helpers';
import { FeaturedStories } from '../components/home/FeaturedStories';
import { UnifiedSearchBar, Filters } from '../components/UnifiedSearchBar';

interface CalendarPageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  navigateToEventBySlug: (slug: string) => void;
  navigateToDateTimeline: (date: Date, events: Event[]) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onViewEvent, navigateToModule, navigateToEventBySlug, navigateToDateTimeline }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [eventsForDate, setEventsForDate] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [allEventsCache, setAllEventsCache] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { exists, toggle } = useFavorites();
  
  const [themes, setThemes] = useState<Theme[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [filters, setFilters] = useState<Filters>({ query: '', theme: '', country: '', year: '' });
  
  const [featuredItems, setFeaturedItems] = useState<FeaturedStory[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        setIsLoading(true);
        const [fetchedThemes, fetchedCountries, initialEvents, featured] = await Promise.all([
            getThemes(),
            getCountries(),
            getEvents(),
            getFeaturedItems(),
        ]);
        setThemes(fetchedThemes);
        setCountries(fetchedCountries);
        setFilteredEvents(initialEvents);
        setAllEventsCache(initialEvents);
        setFeaturedItems(featured);
        setIsLoading(false);
        setIsLoadingFeatured(false);
    };
    fetchInitialData();
  }, []);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setIsLoading(true);
      const year = filters.year ? parseInt(filters.year, 10) : undefined;
      getEvents({ query: filters.query, theme: filters.theme, country: filters.country, year: isNaN(year!) ? undefined : year }).then(data => {
        setFilteredEvents(data);
        setIsLoading(false);
      });
    }, 300); // Debounce

    return () => clearTimeout(handler);

  }, [filters]);

  const eventsByDayOfYear = useMemo(() => {
    const map: Record<string, Event[]> = {}; // Key is "MM-DD"
    filteredEvents.forEach(event => {
      if (event.dateISO) {
        const key = event.dateISO.substring(5); // "YYYY-MM-DD" -> "MM-DD"
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(event);
      }
    });
    return map;
  }, [filteredEvents]);

  const sortedAgendaDays = useMemo(() => {
    const days = Object.keys(eventsByDayOfYear).sort();
    return days.map(day => ({
      day,
      events: eventsByDayOfYear[day]
    }));
  }, [eventsByDayOfYear]);
  
  const handleSelectDate = useCallback((date: Date | undefined) => {
      setSelectedDate(date);
  }, []);

  useEffect(() => {
    if (selectedDate) {
        const month = (selectedDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const dayOfMonth = selectedDate.getUTCDate().toString().padStart(2, '0');
        const dayOfYearKey = `${month}-${dayOfMonth}`;
        const events = eventsByDayOfYear[dayOfYearKey] || [];
        setEventsForDate(events);
        setIsSheetOpen(events.length > 0);
    } else {
      setEventsForDate([]);
      setIsSheetOpen(false);
    }
  }, [selectedDate, eventsByDayOfYear]);
  
  const handleSuggestionSelected = useCallback((event: Event) => {
      if (event.dateISO) {
          setFilters({ query: event.title, theme: '', country: '', year: '' });
          
          const [year, month, day] = event.dateISO.split('-').map(Number);
          // Use UTC to prevent timezone off-by-one errors
          const localEventDate = new Date(Date.UTC(year, month - 1, day));
          
          setSelectedDate(localEventDate);
      }
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedDate(undefined);
    // Clear search query to allow for a new search, keep other filters
    setFilters(f => ({ ...f, query: '' }));
  }, []);

  return (
    <div className="space-y-4 pb-2 md:pb-0">
      <FeaturedStories 
        items={featuredItems} 
        onNavigateToModule={navigateToModule}
        onNavigateToEvent={navigateToEventBySlug}
      />

      <UnifiedSearchBar 
          themes={themes.map(t => ({ label: t.name, value: t.slug }))}
          countries={countries.map(c => ({ label: c.name, value: c.code }))}
          allEvents={allEventsCache}
          filters={filters}
          onFiltersChange={setFilters}
          onSuggestionSelect={handleSuggestionSelected}
      />
    
      <div className="w-full max-w-3xl mx-auto bg-card p-2 sm:p-4 rounded-2xl shadow-soft">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelectDate}
          eventsByDayOfYear={eventsByDayOfYear}
          className="p-0"
        />
        <div className="p-3 text-center text-muted-foreground text-[10px] sm:text-xs border-t mt-2 opacity-60">
          Cliquez sur une date pour voir les événements historiques.
        </div>
      </div>

      <SheetContent 
        isOpen={isSheetOpen} 
        onClose={handleSheetClose} 
        side={isMobile ? 'center' : 'bottom'}
      >
        <SheetHeader>
          <SheetTitle>
             Événements pour le {selectedDate ? formatDate(selectedDate, { year: undefined, month: 'long', day: 'numeric', timeZone: 'UTC' }) : '...'}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-4">
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            ) : eventsForDate.length > 0 ? (
              <div className="flex flex-col">
                {(eventsForDate.length > 3 ? eventsForDate.slice(0, 3) : eventsForDate).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
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
                ))}
                
                {eventsForDate.length > 3 && (
                  <button 
                    onClick={() => selectedDate && navigateToDateTimeline(selectedDate, eventsForDate)}
                    className="w-full mt-4 py-3 text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary/5 rounded-xl transition-colors border border-primary/20"
                  >
                    Voir tous les {eventsForDate.length} événements
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold">Aucun événement trouvé</h3>
                <p className="text-muted-foreground mt-2">Aucun événement n'a été enregistré pour cette date avec les filtres actuels.</p>
              </div>
            )}
        </div>
      </SheetContent>
    </div>
  );
};
