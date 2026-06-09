import React from 'react';
import type { HeritageItem, HeritageResource } from '../types';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { Badge } from '../components/ui/Badge';

// ── Category meta ─────────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; emoji: string; bg: string }> = {
  mask:    { label: 'Masque',    emoji: '🎭', bg: 'bg-amber-100 text-amber-800' },
  proverb: { label: 'Proverbe',  emoji: '💬', bg: 'bg-blue-100 text-blue-800'  },
  symbol:  { label: 'Symbole',   emoji: '🔯', bg: 'bg-purple-100 text-purple-800' },
  recipe:  { label: 'Recette',   emoji: '🍲', bg: 'bg-green-100 text-green-800' },
  craft:   { label: 'Artisanat', emoji: '🏺', bg: 'bg-orange-100 text-orange-800' },
  music:   { label: 'Musique',   emoji: '🎵', bg: 'bg-pink-100 text-pink-800'  },
  other:   { label: 'Patrimoine',emoji: '✨', bg: 'bg-gray-100 text-gray-700'  },
};

function catMeta(cat?: string) {
  return CAT_META[cat ?? 'other'] ?? CAT_META.other;
}

// ── Resource renderer ─────────────────────────────────────────────────────────

const ResourceItem: React.FC<{ resource: HeritageResource }> = ({ resource }) => {
  const { type, url, title, credit } = resource;

  const label = title || url;

  if (type === 'audio') {
    return (
      <div className="space-y-1">
        {title && <p className="text-sm font-medium text-secondary">{title}</p>}
        <audio controls src={url} className="w-full rounded-lg" />
        {credit && <p className="text-xs text-muted-foreground">{credit}</p>}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="space-y-1">
        {title && <p className="text-sm font-medium text-secondary">{title}</p>}
        <video controls src={url} className="w-full rounded-xl max-h-80 bg-black" />
        {credit && <p className="text-xs text-muted-foreground">{credit}</p>}
      </div>
    );
  }

  if (type === 'image') {
    return (
      <figure className="space-y-1">
        <img src={url} alt={title ?? ''} className="w-full rounded-xl object-cover max-h-64" referrerPolicy="no-referrer" />
        {(title || credit) && (
          <figcaption className="text-xs text-muted-foreground">
            {title}{title && credit ? ' — ' : ''}{credit}
          </figcaption>
        )}
      </figure>
    );
  }

  // pdf | link
  const icon = type === 'pdf' ? '📄' : '🔗';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-secondary truncate group-hover:text-primary transition-colors">
          {label}
        </p>
        {credit && <p className="text-xs text-muted-foreground">{credit}</p>}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">↗</span>
    </a>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  item: HeritageItem;
  onBack: () => void;
}

export const HeritageDetailPage: React.FC<Props> = ({ item, onBack }) => {
  const meta = catMeta(item.category);

  const audioRes   = (item.resources ?? []).filter(r => r.type === 'audio');
  const videoRes   = (item.resources ?? []).filter(r => r.type === 'video');
  const imageRes   = (item.resources ?? []).filter(r => r.type === 'image');
  const docLinks   = (item.resources ?? []).filter(r => r.type === 'pdf' || r.type === 'link');

  return (
    <div className="max-w-3xl mx-auto pb-bottom-nav md:pb-12">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-primary mb-6 hover:underline min-h-[44px] px-2"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Retour
      </button>

      <article className="bg-card rounded-2xl shadow-soft overflow-hidden">

        {/* Cover */}
        {item.coverUrl ? (
          <div className="relative h-56 sm:h-72 overflow-hidden">
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg}`}>
                {meta.emoji} {meta.label}
              </span>
              {item.countryCode && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {item.countryCode}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="h-32 bg-muted flex items-center justify-center text-6xl">
            {meta.emoji}
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Without cover — show badges inline */}
          {!item.coverUrl && (
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg}`}>
                {meta.emoji} {meta.label}
              </span>
              {item.countryCode && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted text-secondary">
                  {item.countryCode}
                </span>
              )}
            </div>
          )}

          {/* Title + period */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-secondary leading-tight">{item.title}</h1>
            {item.period && (
              <p className="text-sm text-muted-foreground mt-1 italic">{item.period}</p>
            )}
          </div>

          {/* Themes */}
          {item.themes && item.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.themes.map(t => (
                <Badge key={t.id} variant="secondary" style={{ backgroundColor: t.color ? `${t.color}22` : undefined, color: t.color ?? undefined }}>
                  {t.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Summary */}
          {item.summary && (
            <p className="text-base leading-relaxed text-dark/90">{item.summary}</p>
          )}

          {/* People linked */}
          {item.people && item.people.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Personnages liés</h2>
              <div className="flex flex-wrap gap-3">
                {item.people.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                    <span className="text-sm font-medium text-secondary">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio resources */}
          {audioRes.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">🎵 Audio</h2>
              <div className="space-y-3">
                {audioRes.map((r, i) => <ResourceItem key={r.id ?? i} resource={r} />)}
              </div>
            </section>
          )}

          {/* Video resources */}
          {videoRes.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">🎬 Vidéo</h2>
              <div className="space-y-4">
                {videoRes.map((r, i) => <ResourceItem key={r.id ?? i} resource={r} />)}
              </div>
            </section>
          )}

          {/* Image gallery */}
          {imageRes.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">🖼️ Galerie</h2>
              <div className={`grid gap-3 ${imageRes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {imageRes.map((r, i) => <ResourceItem key={r.id ?? i} resource={r} />)}
              </div>
            </section>
          )}

          {/* Docs & links */}
          {docLinks.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">📎 Documents & liens</h2>
              <div className="space-y-2">
                {docLinks.map((r, i) => <ResourceItem key={r.id ?? i} resource={r} />)}
              </div>
            </section>
          )}

        </div>
      </article>
    </div>
  );
};
