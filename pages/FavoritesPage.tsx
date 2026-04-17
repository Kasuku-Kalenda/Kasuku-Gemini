
import React, { useRef, useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { EVENTS, ALL_TRAINING_MODULES } from '../constants';
import { EventCard } from '../components/EventCard';
import { ModuleCard } from '../components/ModuleCard';
import type { Event, TrainingModule } from '../types';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';

interface FavoritesPageProps {
  onViewEvent: (event: Event) => void;
  navigateToModule: (slug: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ onViewEvent, navigateToModule }) => {
  const { items, toggle, exists, exportJson, importJson } = useFavorites();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const favoriteEvents = useMemo(() => {
    const eventIds = new Set(items.filter(i => i.type === 'event').map(i => i.id));
    return EVENTS.filter(event => eventIds.has(event.id));
  }, [items]);

  const favoriteModules = useMemo(() => {
    const moduleIds = new Set(items.filter(i => i.type === 'module').map(i => i.id));
    return ALL_TRAINING_MODULES.filter(module => moduleIds.has(module.id));
  }, [items]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importJson(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">My Saved Items</h1>
          <p className="mt-2 text-muted-foreground">The events and modules you've saved for later.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleImportClick} 
            className="flex-1 md:flex-none gap-2 rounded-xl h-11"
          >
            <UploadIcon className="h-4 w-4" />
            Import
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <Button 
            onClick={exportJson} 
            className="flex-1 md:flex-none gap-2 rounded-xl h-11 bg-secondary text-white hover:bg-secondary/90"
          >
            <DownloadIcon className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events ({favoriteEvents.length})</TabsTrigger>
          <TabsTrigger value="modules">Modules ({favoriteModules.length})</TabsTrigger>
        </TabsList>
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
                    thumbnail: event.media[0]?.url
                  })}
                  onViewModule={navigateToModule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-2xl shadow-soft">
              <h3 className="text-xl font-semibold">No Saved Events</h3>
              <p className="text-muted-foreground mt-2">Click the ☆ icon on any event to save it here.</p>
            </div>
          )}
        </TabsContent>
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
                    thumbnail: module.thumbnail
                  })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-2xl shadow-soft">
              <h3 className="text-xl font-semibold">No Saved Modules</h3>
              <p className="text-muted-foreground mt-2">Click the ☆ icon on any module to save it here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
