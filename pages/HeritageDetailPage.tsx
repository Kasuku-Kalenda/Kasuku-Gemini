import React, { useState, useEffect } from 'react';
import type { HeritageItem, HeritageResource, HeritageLinkedEvent } from '../types';
import { apiService } from '../services/api.service';
import { formatDate } from '../utils/helpers';
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

// ── Linked event card ───────────────────────────────────────────────────────

function eventDateLabel(ev: HeritageLinkedEvent): string {
  if (ev.displayDate) return ev.displayDate;
  if (ev.startDate) {
    try { return formatDate(new Date(ev.startDate + 'T12:00:00Z')); } catch { /* ignore */ }
  }
  return '';
}

const LinkedEventCard: React.FC<{ event: HeritageLinkedEvent; onClick?: () => void }> = ({ event, onClick }) => {
  const dateLabel = eventDateLabel(event);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
    >
      {event.thumbnailUrl ? (
        <img src={event.thumbnailUrl} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
      ) : (
        <span className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">📅</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-secondary truncate group-hover:text-primary transition-colors">{event.title}</p>
        {(dateLabel || event.primaryCountryCode) && (
          <p className="text-xs text-muted-foreground truncate">
            {dateLabel}{dateLabel && event.primaryCountryCode ? ' · ' : ''}{event.primaryCountryCode}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  item: HeritageItem;
  onBack: () => void;
  onViewEvent?: (eventId: string) => void;
}

export const HeritageDetailPage: React.FC<Props> = ({ item, onBack, onViewEvent }) => {
  // L'item reçu via la navigation est « léger » (grille, carousel d'événement ou
  // moment de récit) : ni resources, ni people, ni linkedEvents. On récupère le
  // détail enrichi par slug, en gardant l'item léger comme affichage immédiat.
  const [detail, setDetail] = useState<HeritageItem>(item);

  useEffect(() => {
    setDetail(item);
    if (!item.slug) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await apiService.getHeritageBySlug(item.slug);
        if (!cancelled && full) setDetail(full);
      } catch { /* échec réseau → on conserve l'item léger */ }
    })();
    return () => { cancelled = true; };
  }, [item.slug]);

  const meta = catMeta(detail.category);

  const audioRes     = (detail.resources ?? []).filter(r => r.type === 'audio');
  const videoRes     = (detail.resources ?? []).filter(r => r.type === 'video');
  const imageRes     = (detail.resources ?? []).filter(r => r.type === 'image');
  const docLinks     = (detail.resources ?? []).filter(r => r.type === 'pdf' || r.type === 'link');
  const linkedEvents = detail.linkedEvents ?? [];

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
        {detail.coverUrl ? (
          <div className="relative h-56 sm:h-72 overflow-hidden">
            <img
              src={detail.coverUrl}
              alt={detail.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg}`}>
                {meta.emoji} {meta.label}
              </span>
              {detail.countryCode && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {detail.countryCode}
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
          {!detail.coverUrl && (
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg}`}>
                {meta.emoji} {meta.label}
              </span>
              {detail.countryCode && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-muted text-secondary">
                  {detail.countryCode}
                </span>
              )}
            </div>
          )}

          {/* Title + period */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-secondary leading-tight">{detail.title}</h1>
            {detail.period && (
              <p className="text-sm text-muted-foreground mt-1 italic">{detail.period}</p>
            )}
          </div>

          {/* Themes */}
          {detail.themes && detail.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detail.themes.map(t => (
                <Badge key={t.id} variant="secondary" style={{ backgroundColor: t.color ? `${t.color}22` : undefined, color: t.color ?? undefined }}>
                  {t.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Summary */}
          {detail.summary && (
            <p className="text-base leading-relaxed text-dark/90">{detail.summary}</p>
          )}

          {/* Événements liés */}
          {linkedEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                📅 Événements liés <span className="text-muted-foreground/60">({linkedEvents.length})</span>
              </h2>
              <div className="space-y-2">
                {linkedEvents.map(ev => (
                  <LinkedEventCard key={ev.id} event={ev} onClick={() => onViewEvent?.(ev.id)} />
                ))}
              </div>
            </section>
          )}

          {/* People linked */}
          {detail.people && detail.people.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Personnages liés</h2>
              <div className="flex flex-wrap gap-3">
                {detail.people.map(p => (
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
