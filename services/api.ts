
import { EVENTS, THEMES, ALL_TRAINING_MODULES, CREATORS, FEATURED_ITEMS, TIMELINES } from '../constants';
import type { Event, Theme, TrainingModule, FeaturedStory, TimelineNarrative } from '../types';

interface EventFilterOptions {
  query?: string;
  theme?: string;
  country?: string;
  date?: string; // YYYY-MM-DD
  year?: number;
}

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getEvents = async (filters: EventFilterOptions = {}): Promise<Event[]> => {
  await simulateDelay(300);
  let filteredEvents = EVENTS;

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.summary.toLowerCase().includes(query)
    );
  }
  if (filters.theme) {
    filteredEvents = filteredEvents.filter(event =>
      event.themes.some(theme => theme.slug === filters.theme)
    );
  }
  if (filters.country) {
    filteredEvents = filteredEvents.filter(event => event.countryCode === filters.country);
  }
  if (filters.year) {
    const year = Number(filters.year);
    if (!isNaN(year)) {
      filteredEvents = filteredEvents.filter(event => event.year === year);
    }
  }
  if (filters.date) {
    const targetDate = new Date(filters.date);
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    filteredEvents = filteredEvents.filter(event => {
      if (!event.dateISO) return false;
      const eventDate = new Date(event.dateISO);
      return eventDate.getMonth() === targetMonth && eventDate.getDate() === targetDay;
    });
  }
  return filteredEvents;
};

export const getModules = async (options: {
  query?: string;
  page?: number;
  limit?: number;
  level?: string;
  lang?: string;
  maxDuration?: number;
  type?: string;
  creator?: string;
} = {}): Promise<{ items: TrainingModule[]; page: number; totalPages: number; totalItems: number }> => {
  await simulateDelay(300);
  let filtered = [...ALL_TRAINING_MODULES];

  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.summary.toLowerCase().includes(q)
    );
  }
  if (options.level) {
    filtered = filtered.filter(m => m.level === options.level);
  }
  if (options.lang) {
    filtered = filtered.filter(m => m.language === options.lang);
  }
  if (options.maxDuration) {
    filtered = filtered.filter(m => (m.durationMin || 0) <= options.maxDuration!);
  }
  if (options.creator) {
    filtered = filtered.filter(m => m.creators.some(c => c.id === options.creator));
  }

  const page = options.page || 1;
  const limit = options.limit || 12;
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = filtered.slice(start, end);

  return {
    items,
    page,
    totalPages: Math.ceil(filtered.length / limit),
    totalItems: filtered.length
  };
};

export const getModuleCreators = async (): Promise<{ id: string; name: string }[]> => {
  await simulateDelay(100);
  return [...CREATORS];
};

export const getTimelines = async (): Promise<TimelineNarrative[]> => {
  await simulateDelay(200);
  return [...TIMELINES];
};

export const getTimelineBySlug = async (slug: string): Promise<TimelineNarrative | null> => {
    await simulateDelay(200);
    return TIMELINES.find(t => t.slug === slug) || null;
};

export const getThemes = async (): Promise<Theme[]> => {
  await simulateDelay(100);
  return [...THEMES];
};

export const getCountries = async (): Promise<{ code: string; name: string }[]> => {
  await simulateDelay(100);
  const countryCodes = [...new Set(EVENTS.map(e => e.countryCode).filter(Boolean))];
  const countryMap: { [key: string]: string } = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    IT: 'Italy',
    CO: 'Colombia',
    ZA: 'South Africa',
    ET: 'Ethiopia',
    GH: 'Ghana',
    EG: 'Egypt',
    ML: 'Mali',
    SN: 'Senegal',
    CD: 'DR Congo',
    BF: 'Burkina Faso',
    NG: 'Nigeria',
    KE: 'Kenya',
    LY: 'Libya',
    AO: 'Angola',
    MR: 'Mauritania',
    TZ: 'Tanzania',
    CM: 'Cameroon',
    ES: 'Spain',
    FR: 'France',
    CG: 'Congo',
    UN: 'International'
  };
  return countryCodes.map(code => ({ code: code!, name: countryMap[code!] || code! }));
};

export const getFeaturedItems = async (limit = 12): Promise<FeaturedStory[]> => {
    await simulateDelay(150);
    
    // On récupère tous les éléments actifs sans filtrage de date trop complexe pour le mock
    const activeItems = FEATURED_ITEMS.filter(item => item.active);
    
    const transformedItems: FeaturedStory[] = [];
    for (const item of activeItems) {
        const event = EVENTS.find(e => e.id === item.eventId);
        if (!event) continue;
        
        const module = ALL_TRAINING_MODULES.find(m => m.slug === item.ctaTo);
        const timeline = TIMELINES.find(t => t.slug === item.ctaTo);

        transformedItems.push({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            imageUrl: item.imageUrl,
            eventSlug: event.slug,
            dateISO: event.dateISO ? new Date(event.dateISO + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '') : (event.period || null),
            moduleSlug: module ? module.slug : null,
            ctaLabel: item.ctaLabel,
            ctaTo: item.ctaTo,
        });
    }
    
    return transformedItems.sort((a, b) => {
        const itemA = FEATURED_ITEMS.find(f => f.id === a.id);
        const itemB = FEATURED_ITEMS.find(f => f.id === b.id);
        return (itemA?.order || 0) - (itemB?.order || 0);
    });
}
