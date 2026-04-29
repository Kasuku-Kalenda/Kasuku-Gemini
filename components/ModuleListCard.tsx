import React from 'react';
import type { TrainingModule } from '../types';
import { Badge } from './ui/Badge';
import { ClockIcon } from './icons/ClockIcon';
import { StarIcon } from './icons/StarIcon';

interface ModuleListCardProps {
  module: TrainingModule;
  onNavigate: (slug: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * Vue compacte d'un module — ligne horizontale avec vignette, badges et favori.
 * Utilisé dans ModulesIndexPage (vue liste) et FavoritesPage.
 */
export const ModuleListCard: React.FC<ModuleListCardProps> = ({
  module: m,
  onNavigate,
  isFavorite,
  onToggleFavorite,
}) => (
  <div
    className="group flex items-center gap-4 p-3 sm:p-4 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-md cursor-pointer transition-all"
    onClick={() => onNavigate(m.slug)}
    role="button"
    tabIndex={0}
    aria-label={`Ouvrir le module ${m.title}`}
    onKeyDown={e => e.key === 'Enter' && onNavigate(m.slug)}
  >
    {/* Vignette */}
    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
      <img
        src={m.thumbnail ?? `https://picsum.photos/seed/${m.slug}/160/160`}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>

    {/* Infos */}
    <div className="flex-1 min-w-0 space-y-1">
      <p className="font-bold text-secondary leading-snug truncate group-hover:text-primary transition-colors">
        {m.title}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {m.level && (
          <Badge className="text-[10px] px-2 py-0.5">{m.level}</Badge>
        )}
        {m.language && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {m.language === 'fr' ? 'FR' : 'EN'}
          </Badge>
        )}
        {m.durationMin && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <ClockIcon className="h-3 w-3" />{m.durationMin} min
          </span>
        )}
      </div>
      {m.summary && (
        <p className="text-xs text-muted-foreground line-clamp-1">{m.summary}</p>
      )}
    </div>

    {/* Actions */}
    <div className="shrink-0 flex items-center gap-1">
      <button
        className="no-min-h p-2.5 rounded-full transition-all active:scale-90 text-muted-foreground hover:text-primary hover:bg-primary/10"
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        aria-label={isFavorite ? 'Retirer des favoris' : 'Sauvegarder'}
      >
        <StarIcon className={`h-4 w-4 ${isFavorite ? 'fill-current text-primary' : ''}`} />
      </button>
      <svg
        className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);
