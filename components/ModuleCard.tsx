

import React from 'react';
import type { TrainingModule } from '../types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ClockIcon } from './icons/ClockIcon';
import { StarIcon } from './icons/StarIcon';

interface ModuleCardProps {
  module: TrainingModule;
  onNavigate: (slug: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onNavigate, isFavorite, onToggleFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <Card 
        className="rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 flex flex-col"
        aria-label={`Ouvrir le module ${module.title}`}
    >
      <div className="aspect-video relative">
        <img 
            src={module.thumbnail ?? `https://picsum.photos/seed/${module.slug}/400/225`} 
            alt={`Image de présentation pour le module ${module.title}`}
            className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {module.level && <Badge>{module.level}</Badge>}
          {module.language && <Badge variant="secondary">{module.language === 'fr' ? 'FR' : 'EN'}</Badge>}
          {module.durationMin && (
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                <ClockIcon className="h-3 w-3 mr-1" />{module.durationMin}′
            </Badge>
          )}
        </div>
        <button 
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from saved modules' : 'Save module'}
        >
            <StarIcon className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-yellow-400 stroke-yellow-400' : 'fill-transparent stroke-current'}`} />
        </button>
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-base font-bold line-clamp-2 h-12 flex-1">{module.title}</h3>
            {module.moduleType === 'moodle' && (
                <Badge variant="accent" className="ml-2 shrink-0">Moodle</Badge>
            )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mt-1 flex-grow">{module.summary}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {module.creators.slice(0,3).map(c => (
              <img 
                key={c.id} 
                src={c.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${c.name}`} 
                alt={c.name}
                title={c.name}
                className="h-8 w-8 rounded-full ring-2 ring-white"
              />
            ))}
          </div>
          <Button onClick={() => onNavigate(module.slug)} className="rounded-2xl">
            Découvrir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};