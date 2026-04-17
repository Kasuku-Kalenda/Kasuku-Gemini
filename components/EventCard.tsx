
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Event, TrainingModule } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { StarIcon } from './icons/StarIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ClockIcon } from './icons/ClockIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { formatDate } from '../utils/helpers';
import { THEME_COLORS } from '../constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';

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


interface EventCardProps {
  id?: string;
  event: Event;
  onView: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewModule: (slug: string) => void;
  variant?: 'default' | 'compact';
}

export const EventCard: React.FC<EventCardProps> = ({ id, event, onView, isFavorite, onToggleFavorite, onViewModule, variant = 'default' }) => {
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  const handleOpenModuleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.trainingModules) return;

    if (event.trainingModules.length === 1) {
      onViewModule(event.trainingModules[0].slug);
    } else {
      setIsModuleDialogOpen(true);
    }
  };
  
  const hasTrainingModules = event.trainingModules && event.trainingModules.length > 0;

  if (variant === 'compact') {
    const firstModule = event.trainingModules?.[0];
    const hasTimeline = !!event.timelineSlug;

    const firstTheme = event.themes[0];
    const themeColor = firstTheme ? (THEME_COLORS[firstTheme.slug] || '#E67E22') : '#E67E22';

    return (
      <Card 
        className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group/compact bg-white rounded-2xl mb-4"
        onClick={onView}
      >
        <div className="flex flex-col sm:flex-row h-full">
          {/* Image Section */}
          <div className="relative w-full sm:w-32 h-32 sm:h-auto shrink-0 overflow-hidden">
            {event.media[0]?.url ? (
              <img 
                src={event.media[0].url} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover/compact:scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-white/50"
                style={{ backgroundColor: themeColor }}
              >
                <GlobeIcon className="h-10 w-10 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent sm:hidden" />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {hasTimeline && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    Partie d'un récit
                  </span>
                )}
              </div>
              <button 
                onClick={handleFavoriteClick}
                className="p-1.5 -mr-1 -mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                aria-label={isFavorite ? 'Remove from saved items' : 'Save for later'}
              >
                <StarIcon className={`h-4 w-4 ${isFavorite ? 'fill-primary stroke-primary' : 'fill-transparent stroke-current'}`} />
              </button>
            </div>

            <h4 className="font-bold text-base text-dark leading-tight mb-1 group-hover/compact:text-primary transition-colors">
              {event.title}
            </h4>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {event.summary}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {event.period || (event.dateISO ? formatDate(new Date(event.dateISO)) : '')}
              </span>
              
              {firstModule && (
                <Badge className="bg-secondary/10 text-secondary border-0 text-[10px] py-0.5 px-2 flex items-center gap-1">
                  <GraduationCapIcon className="h-3 w-3" />
                  Module: {firstModule.title}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      id={id}
    >
      <Card className="group flex flex-col md:flex-row h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-0 md:border border-border bg-transparent md:bg-card">
        {/* Image Section */}
        <div className="relative w-full md:w-1/3 shrink-0">
          <img 
            src={event.media[0]?.url || 'https://picsum.photos/400/225'} 
            alt={event.title} 
            className="w-full h-48 md:h-full object-cover rounded-2xl md:rounded-none"
            referrerPolicy="no-referrer"
          />
          <button 
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-dark shadow-sm hover:bg-white transition-colors z-10"
            aria-label={isFavorite ? 'Remove from saved items' : 'Save for later'}
            aria-pressed={isFavorite}
          >
            <StarIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-primary stroke-primary' : 'fill-transparent stroke-current'}`} />
          </button>
          
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {event.themes.slice(0, 1).map(theme => (
              <Badge key={theme.id} className="bg-primary/90 text-white border-0 backdrop-blur-sm">
                {theme.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-grow p-4 md:p-6">
          <div className="flex-grow">
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2 font-medium">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5 text-primary" />
                {event.dateISO ? formatDate(new Date(event.dateISO)) : event.period}
              </span>
              {event.countryCode && (
                <span className="flex items-center gap-1">
                  <GlobeIcon className="h-3.5 w-3.5 text-primary" />
                  {event.countryCode}
                </span>
              )}
            </div>
            
            <CardTitle className="text-xl font-bold leading-tight text-dark mb-2 group-hover:text-primary transition-colors">
              {event.title}
            </CardTitle>
            
            <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3 mb-4">
              {event.summary}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <Button 
              onClick={onView} 
              className="flex-grow rounded-xl font-semibold order-2 sm:order-1"
              variant="outline"
            >
              Détails
            </Button>
            
            {hasTrainingModules && (
              <Button 
                onClick={handleOpenModuleClick} 
                className="flex-grow rounded-xl font-semibold bg-secondary text-white hover:bg-secondary/90 order-1 sm:order-2"
                aria-label={`Découvrir le module de formation lié à ${event.title}`}
              >
                <GraduationCapIcon className="mr-2 h-4 w-4" />
                Formation
              </Button>
            )}
          </div>
        </div>
      </Card>

      {hasTrainingModules && event.trainingModules.length > 1 && (
        <ModuleChooserDialog 
            isOpen={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
            modules={event.trainingModules}
            onSelectModule={onViewModule}
        />
      )}
    </motion.div>
  );
};
