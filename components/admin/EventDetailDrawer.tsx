/**
 * components/admin/EventDetailDrawer.tsx
 *
 * Panneau latéral (drawer) qui affiche toutes les relations d'un Event :
 * Stories liés, StoryEvents, Modules, Thèmes, Médias.
 * Ouvert depuis AdminEventsPage au clic sur une ligne.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../../services/apiClient';
import { formatDate } from '../../utils/helpers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryEventItem {
  id: string;
  storyId: string;
  storyTitle: string;
  storySlug: string;
  storyType: string;
  storyStatus: string;
  position: number;
  narrativeText: string | null;
  quote: string | null;
  quoteAuthor: string | null;
  narrativeAudioUrl: string | null;
  narrativeVideoUrl: string | null;
  sourceStoryEventId: string | null;
  authorName: string | null;
  createdAt: string;
}

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startDate: string | null;
  displayDate: string | null;
  primaryCountryCode: string | null;
  status: string;
  featured: boolean;
  thumbnailUrl: string | null;
  themes: Array<{ id: string; name: string; color: string }>;
  people: Array<{ id: string; name: string; photoUrl: string | null; role?: string }>;
  modules: Array<{ id: string; slug: string; title: string; level: string | null; durationMin: number | null }>;
  mediaItems: Array<{ id: string; type: string; url: string; caption: string | null; isCover: boolean }>;
  storiesCount: number;
  modulesCount: number;
  themesCount: number;
  peopleCount: number;
  mediaCount: number;
  tagsCount: number;
}

interface DrawerProps {
  eventId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ label: string; count?: number }> = ({ label, count }) => (
  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 mb-3 flex items-center gap-2">
    {label}
    {count !== undefined && (
      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
        {count}
      </span>
    )}
  </h3>
);

const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-muted-foreground italic">{msg}</p>
);

// ─── Composant principal ──────────────────────────────────────────────────────

export const EventDetailDrawer: React.FC<DrawerProps> = ({ eventId, onClose, onEdit }) => {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [storyEvents, setStoryEvents] = useState<StoryEventItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) { setEvent(null); setStoryEvents([]); return; }

    setLoading(true);
    Promise.all([
      api.get<EventDetail>(`/events/${eventId}`),
      api.get<{ items: StoryEventItem[] }>(`/events/${eventId}/story-events`)
        .catch(() => ({ items: [] })),
    ]).then(([ev, se]) => {
      setEvent(ev);
      setStoryEvents(se.items);
    }).finally(() => setLoading(false));
  }, [eventId]);

  if (!eventId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-background z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b shrink-0">
          <div className="min-w-0">
            {loading || !event ? (
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {event.startDate ? formatDate(new Date(event.startDate)) : event.displayDate ?? '—'}
                  {event.primaryCountryCode && ` · ${event.primaryCountryCode}`}
                </p>
                <h2 className="font-bold text-lg text-secondary leading-tight truncate">{event.title}</h2>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <Badge variant={event.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                    {event.status}
                  </Badge>
                  {event.featured && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-0">⭐ featured</Badge>}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {event && (
              <Button size="sm" variant="outline" onClick={() => onEdit(eventId)}>
                Modifier
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Compteurs globaux */}
        {event && (
          <div className="grid grid-cols-5 divide-x border-b shrink-0">
            {[
              { label: 'Stories', val: event.storiesCount  },
              { label: 'Modules', val: event.modulesCount  },
              { label: 'Thèmes',  val: event.themesCount   },
              { label: 'Pers.',   val: event.peopleCount   },
              { label: 'Médias',  val: event.mediaCount    },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center py-2.5 px-1">
                <span className="text-lg font-bold text-secondary">{val}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">

          {loading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Chargement…
            </div>
          )}

          {!loading && event && (
            <>
              {/* Résumé */}
              {event.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {event.summary}
                </p>
              )}

              {/* ── Stories liés ─────────────────────────────────────── */}
              <section>
                <SectionTitle label="Stories liés" count={storyEvents.length} />
                {storyEvents.length === 0 ? (
                  <EmptyState msg="Cet événement n'appartient à aucun récit." />
                ) : (
                  <ul className="space-y-2">
                    {storyEvents.map(se => (
                      <li key={se.id} className="border rounded-xl p-3 bg-card space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm leading-tight">{se.storyTitle}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Position {se.position + 1}
                              {se.storyType && ` · ${se.storyType}`}
                              {se.authorName && ` · ${se.authorName}`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {se.storyStatus}
                          </Badge>
                        </div>

                        {se.narrativeText && (
                          <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-primary/30 pl-2">
                            "{se.narrativeText}"
                          </p>
                        )}

                        {se.quote && (
                          <p className="text-xs font-medium text-secondary line-clamp-1">
                            « {se.quote} »
                            {se.quoteAuthor && <span className="text-muted-foreground font-normal"> — {se.quoteAuthor}</span>}
                          </p>
                        )}

                        <div className="flex gap-3 pt-0.5">
                          {se.narrativeAudioUrl && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">🎙 Audio</span>
                          )}
                          {se.narrativeVideoUrl && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">🎬 Vidéo</span>
                          )}
                          {se.sourceStoryEventId && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-1">🔗 Cloné</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Thèmes ───────────────────────────────────────────── */}
              <section>
                <SectionTitle label="Thèmes" count={event.themes?.length} />
                {!event.themes?.length ? (
                  <EmptyState msg="Aucun thème associé." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {event.themes.map(t => (
                      <span
                        key={t.id}
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: t.color ?? '#6B7280' }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Modules liés ─────────────────────────────────────── */}
              <section>
                <SectionTitle label="Modules liés" count={event.modules?.length} />
                {!event.modules?.length ? (
                  <EmptyState msg="Aucun module associé." />
                ) : (
                  <ul className="space-y-2">
                    {event.modules.map(m => (
                      <li key={m.id} className="flex items-center justify-between border rounded-lg p-2.5 bg-card text-sm">
                        <span className="font-medium">{m.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          {m.level && <span>{m.level}</span>}
                          {m.durationMin && <span>{m.durationMin} min</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Personnes liées ──────────────────────────────────── */}
              <section>
                <SectionTitle label="Personnes liées" count={event.people?.length} />
                {!event.people?.length ? (
                  <EmptyState msg="Aucune personne associée." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {event.people.map(p => (
                      <div key={p.id} className="flex items-center gap-2 border rounded-full px-2.5 py-1 bg-card text-xs">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                            {p.name[0]}
                          </span>
                        )}
                        <span className="font-medium">{p.name}</span>
                        {p.role && <span className="text-muted-foreground">· {p.role}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Médias ───────────────────────────────────────────── */}
              <section>
                <SectionTitle label="Médias" count={event.mediaItems?.length} />
                {!event.mediaItems?.length ? (
                  <EmptyState msg="Aucun média." />
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {event.mediaItems.map(m => (
                      <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                        {m.type === 'image' ? (
                          <img src={m.url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                        )}
                        {m.isCover && (
                          <span className="absolute top-1 left-1 bg-primary text-white text-[9px] rounded px-1 py-0.5">
                            cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
