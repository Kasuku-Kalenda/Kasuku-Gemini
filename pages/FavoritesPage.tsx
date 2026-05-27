
import React, { useMemo, useEffect, useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { getTimelines, getEvents, getModules } from '../services/api';
import { EventCard } from '../components/EventCard';
import { ModuleCard } from '../components/ModuleCard';
import type { Event, TrainingModule, TimelineNarrative } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { StarIcon } from '../components/icons/StarIcon';
import { TimelineIcon } from '../components/icons/TimelineIcon';
import { ClockIcon } from '../components/icons/ClockIcon';

interface FavoritesPageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
  navigateToTimeline: (slug: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onViewEvent,
  navigateToModule,
  navigateToTimeline,
}) => {
  const { items, toggle, exists } = useFavorites();
  const [allTimelines, setAllTimelines] = useState<TimelineNarrative[]>([]);
  const [allEvents, setAllEvents]       = useState<Event[]>([]);
  const [allModules, setAllModules]     = useState<TrainingModule[]>([]);

  useEffect(() => {
    getTimelines().then(setAllTimelines).catch(() => {});
    getEvents({ limit: 500 }).then(setAllEvents).catch(() => {});
    getModules({ limit: 500 }).then(r => setAllModules(r.items)).catch(() => {});
  }, []);

  const favoriteEvents = useMemo(() => {
    const eventIds = new Set(items.filter(i => i.type === 'event').map(i => i.id));
    return allEvents.filter(event => eventIds.has(event.id));
  }, [items, allEvents]);

  const favoriteModules = useMemo(() => {
    const moduleIds = new Set(items.filter(i => i.type === 'module').map(i => i.id));
    return allModules.filter(module => moduleIds.has(module.id));
  }, [items, allModules]);

  const favoriteTimelines = useMemo(() => {
    const ids = new Set(items.filter(i => i.type === 'timeline').map(i => i.id));
    return allTimelines.filter(tl => ids.has(tl.id));
  }, [items, allTimelines]);

  const Empty: React.FC<{ icon: React.ReactNode; label: string; hint: string }> = ({ icon, label, hint }) => (
    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card rounded-2xl shadow-soft">
      <div className="text-muted-foreground/30">{icon}</div>
      <h3 className="text-xl font-semibold text-secondary">{label}</h3>
      <p className="text-muted-foreground text-sm text-center max-w-xs">{hint}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Mes Sauvegardes</h1>
        <p className="mt-2 text-muted-foreground text-sm">Événements, modules et récits mis de côté pour plus tard.</p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            Événements
            {favoriteEvents.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary font-black rounded-full px-1.5 py-0.5">
                {favoriteEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="timelines">
            Récits
            {favoriteTimelines.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary font-black rounded-full px-1.5 py-0.5">
                {favoriteTimelines.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="modules">
            Modules
            {favoriteModules.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary font-black rounded-full px-1.5 py-0.5">
                {favoriteModules.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Events ─────────────────────────────────────────────── */}
        <TabsContent value="events">
          {favoriteEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteEvents.map(event => (
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
                    thumbnail: event.media[0]?.url,
                  })}
                  onViewModule={navigateToModule}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon={<StarIcon className="h-14 w-14" />}
              label="Aucun événement sauvegardé"
              hint="Appuyez sur l'icône ☆ d'un événement pour le retrouver ici."
            />
          )}
        </TabsContent>

        {/* ── Timelines ──────────────────────────────────────────── */}
        <TabsContent value="timelines">
          {favoriteTimelines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoriteTimelines.map(tl => (
                <div
                  key={tl.id}
                  className="group cursor-pointer bg-card rounded-2xl shadow-soft overflow-hidden border border-border hover:shadow-md transition-all"
                  onClick={() => navigateToTimeline(tl.slug)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {tl.coverUrl ? (
                      <img
                        src={tl.coverUrl}
                        alt={tl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <TimelineIcon className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Unsave button */}
                    <button
                      className="no-min-h absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors active:scale-90"
                      onClick={e => {
                        e.stopPropagation();
                        toggle({ type: 'timeline', id: tl.id, slug: tl.slug, title: tl.title, thumbnail: tl.coverUrl });
                      }}
                      aria-label="Retirer des sauvegardes"
                    >
                      <StarIcon className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest">
                      <ClockIcon className="h-3 w-3" />
                      {tl.periodLabel}
                    </div>
                    <h3 className="font-bold text-secondary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {tl.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tl.summary}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{tl.eventCount} moments</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={<TimelineIcon className="h-14 w-14" />}
              label="Aucun récit sauvegardé"
              hint="Appuyez sur l'icône ☆ d'un récit pour le retrouver ici."
            />
          )}
        </TabsContent>

        {/* ── Modules ────────────────────────────────────────────── */}
        <TabsContent value="modules">
          {favoriteModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {favoriteModules.map(module => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onNavigate={() => navigateToModule(module.slug)}
                  isFavorite={exists('module', module.id)}
                  onToggleFavorite={() => toggle({
                    type: 'module',
                    id: module.id,
                    slug: module.slug,
                    title: module.title,
                    thumbnail: module.thumbnail,
                  })}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon={<StarIcon className="h-14 w-14" />}
              label="Aucun module sauvegardé"
              hint="Appuyez sur l'icône ☆ d'un module pour le retrouver ici."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
