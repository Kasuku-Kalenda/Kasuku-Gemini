
import React, { useState } from 'react';
import type { Event, TrainingModule } from '../types';
import { Badge } from '../components/ui/Badge';
import { MediaGallery } from '../components/MediaGallery';
import { SourceList } from '../components/SourceList';
import { useFavorites } from '../hooks/useFavorites';
import { StarIcon } from '../components/icons/StarIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';
import { TimelineIcon } from '../components/icons/TimelineIcon';
import { generatePdf } from '../utils/pdfGenerator';
import { formatDate } from '../utils/helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';


type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timeline' | 'timelines' | 'module';

interface EventDetailPageProps {
  event: Event;
  onBack: () => void;
  fromView: View;
  navigateToModule: (slug: string) => void;
  navigateToTimeline: (slug: string, eventId?: string) => void;
}

const ModuleChooserDialog: React.FC<{
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    modules: TrainingModule[];
    onSelectModule: (slug: string) => void;
}> = ({ isOpen, onOpenChange, modules, onSelectModule }) => {
    
    const handleStartModule = (module: TrainingModule) => {
        onSelectModule(module.slug);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choose a module</DialogTitle>
                    <DialogDescription>
                        This event has multiple training modules available.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {modules.map(m => (
                        <Card key={m.id} className="rounded-2xl">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{m.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {m.level ?? ""}{m.durationMin ? ` • ${m.durationMin} min` : ""}
                                    </p>
                                </div>
                                <Button onClick={() => handleStartModule(m)} size="sm">Start</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}


export const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, onBack, fromView, navigateToModule, navigateToTimeline }) => {
  const { exists, toggle } = useFavorites();
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const isFav = exists('event', event.id);

  const handleToggleFavorite = () => {
    toggle({
      type: 'event',
      id: event.id,
      slug: event.slug,
      title: event.title,
      thumbnail: event.media[0]?.url,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownload = () => {
    generatePdf(event);
  }

  const handleOpenModule = () => {
      if (!event.trainingModules) return;
      if (event.trainingModules.length === 1) {
          navigateToModule(event.trainingModules[0].slug);
      } else if (event.trainingModules.length > 1) {
          setIsModuleDialogOpen(true);
      }
  };

  const backButtonText: Record<View, string> = {
    home: 'Discover',
    calendar: 'Calendar',
    favorites: 'Saved Items',
    timelines: 'Récits',
    timeline: 'Parcours',
    event: 'Retour',
    module: 'Retour',
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-sm text-primary mb-6 hover:underline min-h-[44px] px-2"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour à {backButtonText[fromView] || 'Back'}
      </button>
      
      <article className="bg-card p-6 sm:p-8 rounded-2xl shadow-soft">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span>{event.dateISO ? formatDate(new Date(event.dateISO)) : event.period}</span>
            {event.countryCode && <><span>&middot;</span><span>{event.countryCode}</span></>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary">{event.title}</h1>
          <div className="flex flex-wrap gap-2 mt-4">
            {event.themes.map(theme => (
              <Badge key={theme.id} variant="secondary">{theme.name}</Badge>
            ))}
          </div>
        </header>

        <MediaGallery media={event.media} />

        <div className="prose max-w-none mt-6 text-dark/90">
          <p className="text-lg leading-relaxed">{event.summary}</p>
        </div>

        {/* LIEN VERS PARCOURS - NOUVELLE LOGIQUE "PARCOURS" */}
        {event.timelineSlug && (
          <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:bg-primary/10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-primary/20 rounded-[1.5rem] shadow-sm">
                <TimelineIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-secondary uppercase tracking-wider text-[11px]">Expérience Narrative</h4>
                <p className="text-sm text-muted-foreground font-medium leading-tight">Cet événement est un moment clé du parcours.</p>
              </div>
            </div>
            <Button 
                onClick={() => navigateToTimeline(event.timelineSlug!, event.id)} 
                className="rounded-full shadow-lg px-8 py-7 h-auto font-black uppercase tracking-[0.2em] text-[10px] bg-secondary text-white hover:bg-secondary/90 transition-transform active:scale-95"
            >
               Découvrir le parcours associé
            </Button>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-secondary">Sources</h3>
          <SourceList sources={event.sources} />
        </div>
        
        <div className="mt-8 pt-6 border-t hidden md:flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                {event.trainingModules && event.trainingModules.length > 0 && (
                    <Button
                        onClick={handleOpenModule}
                        className="rounded-full shadow-sm w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6"
                    >
                        <GraduationCapIcon className="mr-2 h-4 w-4" />
                        🎓 Découvrir le module
                    </Button>
                )}
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button onClick={handleToggleFavorite} variant={isFav ? 'secondary' : 'outline'} aria-pressed={isFav} className="w-full sm:w-auto rounded-full">
                    <StarIcon className={`mr-2 h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    {isFav ? '★ Sauvegardé' : '☆ Sauvegarder'}
                </Button>
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium hover:bg-muted transition-colors min-h-[44px]">
                    <ShareIcon className="h-4 w-4" />
                    Partager
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]">
                    <DownloadIcon className="h-4 w-4" />
                    PDF
                </button>
            </div>
        </div>
      </article>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border p-4 flex gap-3 shadow-t-lg">
        {event.trainingModules && event.trainingModules.length > 0 && (
          <Button
            onClick={handleOpenModule}
            className="flex-1 rounded-xl bg-secondary text-white hover:bg-secondary/90 font-bold h-12"
          >
            <GraduationCapIcon className="mr-2 h-5 w-5" />
            Formation
          </Button>
        )}
        <Button 
          onClick={handleToggleFavorite} 
          variant={isFav ? 'secondary' : 'outline'} 
          className="flex-1 rounded-xl font-bold h-12"
        >
          <StarIcon className={`mr-2 h-5 w-5 ${isFav ? 'fill-current' : ''}`} />
          {isFav ? 'Sauvegardé' : 'Sauvegarder'}
        </Button>
      </div>

      {event.trainingModules && event.trainingModules.length > 1 && (
        <ModuleChooserDialog 
            isOpen={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
            modules={event.trainingModules}
            onSelectModule={navigateToModule}
        />
      )}
    </div>
  );
};
