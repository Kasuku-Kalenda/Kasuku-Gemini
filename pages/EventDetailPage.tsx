
import React, { useState, useCallback } from 'react';
import type { Event, TrainingModule } from '../types';
import type { HeritageItem } from '../types';
import { apiService } from '../services/api.service';
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
import { HeritageCarousel } from '../components/HeritageCarousel';


type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timeline' | 'timelines' | 'module';

interface EventDetailPageProps {
  event: Event;
  onBack: () => void;
  fromView: View;
  navigateToModule: (slug: string) => void;
  navigateToTimeline: (slug: string, eventId?: string) => void;
  navigateToHeritage?: (item: HeritageItem) => void;
  navigateToHeritageList?: () => void;
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


export const EventDetailPage: React.FC<EventDetailPageProps> = ({ event, onBack, fromView, navigateToModule, navigateToTimeline, navigateToHeritage, navigateToHeritageList }) => {
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

  const handleOpenModule = async () => {
    // Si les modules sont déjà chargés (vue détail), on navigue directement
    if (event.trainingModules && event.trainingModules.length > 0) {
      if (event.trainingModules.length === 1) {
        navigateToModule(event.trainingModules[0].slug);
      } else {
        setIsModuleDialogOpen(true);
      }
      return;
    }
    // Sinon (event venu d'une liste — hasModule=true mais modules non chargés),
    // on fetche le détail complet pour récupérer les modules
    const full = await apiService.getEventById(event.id);
    const mods = full?.trainingModules ?? [];
    if (mods.length === 1) {
      navigateToModule(mods[0].slug);
    } else if (mods.length > 1) {
      // Ouvrir le sélecteur — on réutilise l'état mais on passe les modules fetchés
      event.trainingModules = mods; // mutation temporaire pour que ModuleChooserDialog les voie
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
    <div className="max-w-4xl mx-auto pb-bottom-nav md:pb-12">
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

        {/* LIEN VERS PARCOURS */}
        {event.timelineSlug && (
          <div
            onClick={() => navigateToTimeline(event.timelineSlug!, event.id)}
            className="mt-8 cursor-pointer group bg-primary/5 border border-primary/10 rounded-[2rem] overflow-hidden flex flex-col sm:flex-row items-stretch transition-all hover:bg-primary/10 hover:shadow-md"
          >
            {/* Vignette */}
            {event.timelineThumbnail && (
              <div className="w-full sm:w-36 h-28 sm:h-auto shrink-0 overflow-hidden">
                <img
                  src={event.timelineThumbnail}
                  alt={event.timelineTitle ?? 'Parcours'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            {/* Contenu */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 flex-1">
              <div className="flex items-center gap-4">
                {!event.timelineThumbnail && (
                  <div className="p-3 bg-primary/20 rounded-2xl shrink-0">
                    <TimelineIcon className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="font-black text-secondary uppercase tracking-wider text-[10px]">Parcours associé</p>
                  <p className="font-semibold text-base text-dark leading-snug">
                    {event.timelineTitle ?? 'Découvrir le parcours'}
                  </p>
                  <p className="text-xs text-muted-foreground">Cet événement fait partie de ce récit historique.</p>
                </div>
              </div>
              <Button
                onClick={e => { e.stopPropagation(); navigateToTimeline(event.timelineSlug!, event.id); }}
                className="shrink-0 rounded-full px-6 py-2 h-auto text-xs font-black uppercase tracking-widest bg-secondary text-white hover:bg-secondary/90 transition-transform active:scale-95"
              >
                Lire le récit →
              </Button>
            </div>
          </div>
        )}

        {/* PATRIMOINE ASSOCIÉ */}
        {event.heritageItems && event.heritageItems.length > 0 && (
          <HeritageCarousel
            items={event.heritageItems}
            onSelect={navigateToHeritage}
            onViewAll={navigateToHeritageList}
          />
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-secondary">Sources</h3>
          <SourceList sources={event.sources} />
        </div>
        
        <div className="mt-8 pt-6 border-t hidden md:flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                {(event.hasModule || (event.trainingModules && event.trainingModules.length > 0)) && (
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
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border flex gap-3 shadow-t-lg"
        style={{ padding: '0.75rem 1rem', paddingBottom: 'max(0.75rem, var(--sab, 0px))' }}
      >
        {(event.hasModule || (event.trainingModules && event.trainingModules.length > 0)) && (
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
