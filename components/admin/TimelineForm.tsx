import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { timelineFormSchema, TimelineFormData } from '../../schemas/admin';
import { adminApi, type EventStoryEventItem } from '../../services/adminApi';
import { uploadFile } from '../../services/apiClient';
import { EventForm } from './EventForm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import type { UseFormReturn } from 'react-hook-form';
import type { Event } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

const norm = (v: string | null | undefined): string | null =>
  v === '' || v === undefined ? null : v;

const extractYear = (text?: string | null): number | null => {
  if (!text) return null;
  const m = text.match(/\b(\d{3,4})\b/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return y >= 100 && y <= 2200 ? y : null;
};

const momentTs = (m: TimelineFormData['moments'][0]): number => {
  if (m.dateExact) {
    const ts = new Date(m.dateExact + 'T12:00:00Z').getTime();
    if (!isNaN(ts)) return ts;
  }
  const y = extractYear(m.periodText);
  if (y) return new Date(`${y}-07-01T12:00:00Z`).getTime();
  return Infinity;
};

const sortMomentsByDate = (moments: TimelineFormData['moments']): TimelineFormData['moments'] =>
  [...moments].sort((a, b) => {
    const ta = momentTs(a); const tb = momentTs(b);
    if (ta !== tb) return ta - tb;
    return (a.position ?? 0) - (b.position ?? 0);
  }).map((m, i) => ({ ...m, position: i }));

const swapWouldBreakOrder = (moments: TimelineFormData['moments'], indexA: number, indexB: number): boolean => {
  if (indexA < 0 || indexB >= moments.length) return false;
  const tsA = momentTs(moments[indexA]); const tsB = momentTs(moments[indexB]);
  if (tsA === Infinity || tsB === Infinity) return false;
  return tsA > tsB;
};

const uid = () => crypto.randomUUID();

const RESOURCE_ICONS: Record<string, string> = {
  audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄', link: '🔗',
};

// ─── ThumbnailInput ───────────────────────────────────────────────────────────
const ThumbnailInput: React.FC<{
  value: string; onChange: (url: string) => void; error?: string; label?: string;
}> = ({ value, onChange, error, label = 'Image de couverture' }) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'timelines');
      onChange(url);
    } catch {
      alert('Erreur lors de l\'upload. Réessayez.');
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-2">
        {(['url', 'upload'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); if (m === 'upload') fileRef.current?.click(); }}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === m ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}>
            {m === 'url' ? '🔗 URL' : uploading ? '⏳ Upload…' : '📁 Fichier'}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {mode === 'url' && <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" />}
      {value && (
        <div className="rounded-xl overflow-hidden border bg-muted h-36 flex items-center justify-center mt-1">
          <img src={value} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1" data-error="true">{error}</p>}
    </div>
  );
};

// ─── Resource list within a moment (uses useFieldArray internally) ────────────
interface MomentResourcesProps {
  momentIndex: number;
  form: UseFormReturn<TimelineFormData>;
}

const MomentResources: React.FC<MomentResourcesProps> = ({ momentIndex, form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `moments.${momentIndex}.resources` as any,
  });
  const fileRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const handleFile = (ri: number, type: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    // Auto-remplir le titre avec le nom du fichier (sans extension) si vide
    const titlePath = `moments.${momentIndex}.resources.${ri}.title` as any;
    if (!form.getValues(titlePath)) {
      form.setValue(titlePath, file.name.replace(/\.[^/.]+$/, ''));
    }
    try {
      const { url } = await uploadFile(file, 'moments');
      form.setValue(`moments.${momentIndex}.resources.${ri}.url` as any, url);
    } catch {
      alert('Erreur lors de l\'upload. Réessayez.');
    }
  };

  const resourceType = (ri: number) =>
    form.watch(`moments.${momentIndex}.resources.${ri}.type` as any) as string;

  const addResource = (type: string) => {
    append({ id: uid(), type: type as any, title: '', url: '', caption: '' } as any);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
          Ressources ({fields.length})
        </Label>
        <div className="flex gap-1 flex-wrap">
          {[['audio','🎵'],['video','🎬'],['image','🖼️'],['pdf','📄'],['link','🔗']].map(([type, icon]) => (
            <button key={type} type="button" onClick={() => addResource(type)}
              className="h-6 px-2 text-[10px] rounded-lg border border-muted hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center gap-1">
              {icon} {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1">Ajoutez audio, vidéo, PDF, image ou lien pour enrichir ce moment.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((f, ri) => {
            const type = resourceType(ri);
            const accept = type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : type === 'image' ? 'image/*' : '.pdf,application/pdf';
            const fRef = fileRefs.current.get(ri);
            return (
              <div key={f.id} className="flex items-start gap-2 bg-muted/30 p-3 rounded-xl border border-muted group">
                <span className="text-base shrink-0 mt-0.5">{RESOURCE_ICONS[type] ?? '🔗'}</span>
                <div className="flex-1 space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <select
                      {...form.register(`moments.${momentIndex}.resources.${ri}.type` as any)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="audio">🎵 Audio</option>
                      <option value="video">🎬 Vidéo</option>
                      <option value="image">🖼️ Image</option>
                      <option value="pdf">📄 PDF</option>
                      <option value="link">🔗 Lien</option>
                    </select>
                    <Input {...form.register(`moments.${momentIndex}.resources.${ri}.title` as any)} placeholder="Titre *" className="h-8 text-xs" />
                    <div className="flex gap-1">
                      <Input {...form.register(`moments.${momentIndex}.resources.${ri}.url` as any)} placeholder="URL ou fichier *" className="h-8 text-xs flex-1" />
                      {type !== 'link' && (
                        <>
                          <button type="button" className="h-8 px-2 border border-muted rounded-lg text-xs hover:border-primary/40 shrink-0"
                            onClick={() => {
                              const ref = fileRefs.current.get(ri);
                              ref?.click();
                            }}>📁</button>
                          <input type="file" accept={accept} className="hidden"
                            ref={el => { if (el) fileRefs.current.set(ri, el); else fileRefs.current.delete(ri); }}
                            onChange={handleFile(ri, type)} />
                        </>
                      )}
                    </div>
                  </div>
                  <Input {...form.register(`moments.${momentIndex}.resources.${ri}.caption` as any)} placeholder="Légende / description (optionnel)" className="h-7 text-xs" />
                </div>
                <button type="button" onClick={() => remove(ri)} className="text-red-400 hover:text-red-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Event Picker (inline dans MomentCard) ────────────────────────────────────

type PickerStep = 'list' | 'clone' | 'create';

interface CloneSelection {
  storyEvent: EventStoryEventItem;
  event: any;
}

interface EventPickerProps {
  allEvents: any[];
  excludeEventIds?: string[]; // événements déjà utilisés dans ce récit (hors moment courant)
  onSelect: (ev: any, cloneFrom?: EventStoryEventItem) => void;
  onClose: () => void;
  onEventCreated: (ev: Event) => void;
}

const EventPicker: React.FC<EventPickerProps> = ({ allEvents, excludeEventIds = [], onSelect, onClose, onEventCreated }) => {
  const [step, setStep]               = useState<PickerStep>('list');
  const [search, setSearch]           = useState('');
  const [country, setCountry]         = useState('');
  const [theme, setTheme]             = useState('');
  const [pendingEvent, setPendingEv]  = useState<any>(null);
  const [storyEvents, setStoryEvents] = useState<EventStoryEventItem[]>([]);
  const [loadingSE, setLoadingSE]     = useState(false);

  const countries = useMemo(() => [...new Set(allEvents.map((e: any) => e.countryCode).filter(Boolean))].sort() as string[], [allEvents]);
  const themes = useMemo(() => [...new Set(allEvents.flatMap((e: any) => (e.themes ?? []).map((t: any) => t.name)).filter(Boolean))].sort() as string[], [allEvents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allEvents.filter((ev: any) => {
      if (q && !ev.title.toLowerCase().includes(q) && !String(ev.year ?? '').includes(q) && !(ev.dateISO ?? '').includes(q) && !(ev.period ?? '').toLowerCase().includes(q)) return false;
      if (country && ev.countryCode !== country) return false;
      if (theme && !(ev.themes ?? []).some((t: any) => t.name === theme)) return false;
      return true;
    });
  }, [allEvents, search, country, theme]);

  // When user clicks an event in the list: check for existing story-events
  const handleEventClick = useCallback(async (ev: any) => {

    setPendingEv(ev);
    setLoadingSE(true);
    try {
      const items = await adminApi.getEventStoryEvents(ev.id);
      if (items.length > 0) {
        setStoryEvents(items);
        setStep('clone');
      } else {
        // No existing narrations — select directly
        onSelect(ev);
      }
    } catch {
      onSelect(ev);
    } finally {
      setLoadingSE(false);
    }
  }, [onSelect]);


  // ── Step: clone picker ───────────────────────────────────────────────────────
  if (step === 'clone' && pendingEvent) {
    return (
      <div className="border-2 border-blue-200 rounded-2xl bg-white shadow-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-secondary">🔗 Narration existante disponible</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              « {pendingEvent.title} » est déjà utilisé dans {storyEvents.length} récit{storyEvents.length > 1 ? 's' : ''}.
              Clonez une narration ou commencez à zéro.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-secondary">✕</button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {storyEvents.map(se => (
            <div key={se.id} className="border rounded-xl p-3 bg-card space-y-1.5 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{se.storyTitle}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pos. {se.position + 1} · {se.storyType}
                    {se.authorName && ` · ${se.authorName}`}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                  se.storyStatus === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{se.storyStatus}</span>
              </div>

              {se.narrativeText && (
                <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-blue-200 pl-2">
                  {se.narrativeText}
                </p>
              )}
              {se.quote && (
                <p className="text-xs font-medium text-secondary line-clamp-1">
                  « {se.quote} »
                  {se.quoteAuthor && <span className="text-muted-foreground font-normal"> — {se.quoteAuthor}</span>}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {se.narrativeAudioUrl && <span className="text-[10px] text-muted-foreground">🎙 Audio</span>}
                {se.narrativeVideoUrl && <span className="text-[10px] text-muted-foreground">🎬 Vidéo</span>}
                {se.sourceStoryEventId && <span className="text-[10px] text-blue-500">🔗 Déjà cloné</span>}
              </div>

              <Button
                type="button" size="sm"
                className="w-full mt-1 text-xs h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                onClick={() => onSelect(pendingEvent, se)}
              >
                ↪ Cloner cette narration
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1 border-t">
          <Button type="button" size="sm" variant="outline" className="flex-1"
            onClick={() => onSelect(pendingEvent)}>
            ✦ Commencer à zéro
          </Button>
          <Button type="button" size="sm" variant="outline"
            onClick={() => { setPendingEv(null); setStoryEvents([]); setStep('list'); }}>
            ← Retour
          </Button>
        </div>
      </div>
    );
  }

  // ── Step: create — modale plein écran avec EventForm complet ────────────────
  if (step === 'create') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="bg-background w-full max-w-3xl rounded-2xl shadow-2xl relative">
          {/* Header modale */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
            <div>
              <h2 className="text-lg font-bold text-secondary">✨ Créer un événement dans le calendrier</h2>
              <p className="text-xs text-muted-foreground mt-0.5">L'événement sera lié à ce moment une fois créé.</p>
            </div>
            <button
              type="button"
              onClick={() => setStep('list')}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Formulaire complet */}
          <div className="px-6 pb-6">
            <EventForm
              mode="create"
              compact
              onSave={() => setStep('list')}
              onCreated={(ev) => {
                onEventCreated(ev);
                setStep('list');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Step: list (default) ─────────────────────────────────────────────────────
  return (
    <div className="border-2 border-primary/20 rounded-2xl bg-white shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-secondary">📅 Sélectionner un événement du calendrier</p>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-secondary">✕ Fermer</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[130px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre, date, période…"
            className="w-full pl-7 pr-3 h-8 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        {countries.length > 0 && (
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
            <option value="">🌍 Tous pays</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {themes.length > 0 && (
          <select value={theme} onChange={e => setTheme(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
            <option value="">🏷️ Tous thèmes</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Event list */}
      <div className="max-h-52 overflow-y-auto border border-input rounded-xl divide-y divide-muted">
        {loadingSE && (
          <p className="text-center text-xs text-muted-foreground py-6 animate-pulse">Vérification des narrations existantes…</p>
        )}
        {!loadingSE && filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6 italic">Aucun événement trouvé.</p>
        )}
        {!loadingSE && filtered.map((ev: any) => {
          const alreadyUsed = excludeEventIds.includes(ev.id);
          return alreadyUsed ? (
            // Événement déjà utilisé dans ce récit → affiché en grisé, non cliquable
            <div key={ev.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left opacity-50 cursor-not-allowed bg-muted/30"
              title="Cet événement est déjà utilisé dans ce récit">
              <span className="text-base shrink-0">📅</span>
              <span className="flex-1 text-sm font-medium text-muted-foreground line-clamp-1">{ev.title}</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
                Déjà dans ce récit
              </span>
            </div>
          ) : (
            <button key={ev.id} type="button" onClick={() => handleEventClick(ev)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-left transition-colors group">
              <span className="text-base shrink-0">📅</span>
              <span className="flex-1 text-sm font-medium text-secondary line-clamp-1 group-hover:text-primary transition-colors">{ev.title}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                {ev.countryCode && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{ev.countryCode}</span>}
                {(ev.dateISO || ev.year) && <span className="text-xs text-muted-foreground">{ev.dateISO ?? ev.year}</span>}
              </span>
              <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">← Lier</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">{filtered.length} sur {allEvents.length} événements</p>
        <button type="button" onClick={() => setStep('create')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          + Créer un nouvel événement
        </button>
      </div>
    </div>
  );
};

// ─── MomentCard ───────────────────────────────────────────────────────────────
interface MomentCardProps {
  index: number;
  total: number;
  form: UseFormReturn<TimelineFormData>;
  allEvents: any[];
  usedEventIds: string[]; // tous les eventIds déjà utilisés dans le récit (pour éviter les doublons)
  onEventCreated: (ev: any) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const MomentCard: React.FC<MomentCardProps> = ({
  index, total, form, allEvents, usedEventIds, onEventCreated,
  onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  // Ref for pending clone — avoids state timing issues with useEffect
  const pendingCloneRef = useRef<{ ev: any; cloneFrom: EventStoryEventItem } | null>(null);

  const timeType = form.watch(`moments.${index}.timeType`);
  const mediaUrl = form.watch(`moments.${index}.media.0.url`);
  const eventId = form.watch(`moments.${index}.eventId` as any) as string | null;

  const linkedEvent = useMemo(() => allEvents.find((e: any) => e.id === eventId), [allEvents, eventId]);

  // Les erreurs de champ sont affichées dans le banner globalError (barre sticky)
  // et non via form.setError (qui bloquerait handleSubmit au clic suivant).
  const titleErr: string | undefined = undefined;
  const narrativeErr: string | undefined = undefined;
  const dateErr: string | undefined = undefined;

  // Select an event (optionally cloning from an existing StoryEvent)
  const handleSelectEvent = useCallback((ev: any, cloneFrom?: EventStoryEventItem) => {
    form.setValue(`moments.${index}.eventId` as any, ev.id, { shouldDirty: true });
    form.setValue(`moments.${index}.title`, ev.title, { shouldDirty: true });
    // Date
    if (ev.dateISO) {
      form.setValue(`moments.${index}.timeType`, 'date', { shouldDirty: true });
      form.setValue(`moments.${index}.dateExact`, ev.dateISO, { shouldDirty: true });
    } else if (ev.year || ev.period) {
      form.setValue(`moments.${index}.timeType`, 'period', { shouldDirty: true });
      form.setValue(`moments.${index}.periodText`, ev.period ?? String(ev.year ?? ''), { shouldDirty: true });
    }

    if (cloneFrom) {
      // Store in ref, then apply after next paint so the Controller is definitely mounted
      pendingCloneRef.current = { ev, cloneFrom };
      requestAnimationFrame(() => {
        const pending = pendingCloneRef.current;
        if (!pending) return;
        pendingCloneRef.current = null;
        form.setValue(`moments.${index}.narrative`, pending.cloneFrom.narrativeText ?? pending.ev.summary ?? '', { shouldDirty: true, shouldTouch: true });
        form.setValue(`moments.${index}.quote` as any, pending.cloneFrom.quote ?? null, { shouldDirty: true });
        form.setValue(`moments.${index}.quoteAuthor` as any, pending.cloneFrom.quoteAuthor ?? null, { shouldDirty: true });
        form.setValue(`moments.${index}.narrativeAudioUrl` as any, pending.cloneFrom.narrativeAudioUrl ?? null, { shouldDirty: true });
        form.setValue(`moments.${index}.narrativeVideoUrl` as any, pending.cloneFrom.narrativeVideoUrl ?? null, { shouldDirty: true });
        form.setValue(`moments.${index}.sourceStoryEventId` as any, pending.cloneFrom.id, { shouldDirty: true });
      });
      // Clone: toujours forcer l'image de l'événement (qu'il y en ait déjà une ou non)
      if (ev.media?.[0]?.url) {
        form.setValue(`moments.${index}.media.0.url`, ev.media[0].url, { shouldDirty: true });
        form.setValue(`moments.${index}.media.0.type`, ev.media[0].type ?? 'image', { shouldDirty: true });
      }
    } else {
      // Fresh start: pre-fill narrative with event summary if narrative is empty
      const currentNarrative = form.getValues(`moments.${index}.narrative`);
      if ((!currentNarrative || currentNarrative.trim() === '') && ev.summary) {
        form.setValue(`moments.${index}.narrative`, ev.summary, { shouldDirty: true });
      }
      // Fresh: ne pré-remplir l'image que si vide
      const currentImg = form.getValues(`moments.${index}.media.0.url`);
      if (!currentImg && ev.media?.[0]?.url) {
        form.setValue(`moments.${index}.media.0.url`, ev.media[0].url, { shouldDirty: true });
        form.setValue(`moments.${index}.media.0.type`, ev.media[0].type ?? 'image', { shouldDirty: true });
      }
    }
    setPickerOpen(false);
  }, [form, index]);

  // Unlink event (keep content, just remove the link)
  const handleUnlink = useCallback(() => {
    form.setValue(`moments.${index}.eventId` as any, null);
  }, [form, index]);

  // Appelé quand un événement vient d'être créé dans la modale EventForm
  const handleEventCreatedInModal = useCallback((newEvent: Event) => {
    onEventCreated(newEvent);
    handleSelectEvent(newEvent);
  }, [handleSelectEvent, onEventCreated]);

  const handleMediaFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { url } = await uploadFile(file, 'moments');
      form.setValue(`moments.${index}.media.0.url`, url, { shouldValidate: true });
      form.setValue(`moments.${index}.media.0.type`, 'image');
    } catch {
      alert('Erreur lors de l\'upload. Réessayez.');
    }
  }, [form, index]);

  return (
    <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">

      {/* ── Header : numéro + info événement lié ──────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b">
        {/* Réordonnement */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button type="button" onClick={onMoveUp} disabled={index === 0 || !canMoveUp}
            title={!canMoveUp ? 'Ordre chronologique bloqué' : 'Monter'}
            className={`w-6 h-5 text-[10px] border rounded flex items-center justify-center transition-colors
              ${!canMoveUp ? 'opacity-30 cursor-not-allowed bg-muted' : 'bg-muted hover:bg-primary hover:text-white'}`}>▲</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1 || !canMoveDown}
            title={!canMoveDown ? 'Ordre chronologique bloqué' : 'Descendre'}
            className={`w-6 h-5 text-[10px] border rounded flex items-center justify-center transition-colors
              ${!canMoveDown ? 'opacity-30 cursor-not-allowed bg-muted' : 'bg-muted hover:bg-primary hover:text-white'}`}>▼</button>
        </div>

        {/* Badge numéro */}
        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
          {index + 1}
        </span>

        {/* Événement lié ou placeholder */}
        {linkedEvent ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {/* Thumbnail de l'événement si dispo */}
            {linkedEvent.media?.[0]?.url && (
              <img src={linkedEvent.media[0].url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-secondary truncate leading-tight">{linkedEvent.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {linkedEvent.dateISO ?? linkedEvent.year ?? linkedEvent.period ?? ''}
                {linkedEvent.countryCode && ` · ${linkedEvent.countryCode}`}
                {linkedEvent.themes?.slice(0,2).map((t: any) => (
                  <span key={t.id} className="ml-1 text-white rounded-full px-1.5 py-px text-[9px]"
                    style={{ backgroundColor: t.color ?? '#6B7280' }}>{t.name}</span>
                ))}
              </p>
            </div>
            <button type="button" onClick={() => setPickerOpen(p => !p)}
              className="text-[11px] text-muted-foreground hover:text-primary underline shrink-0">
              Changer
            </button>
            <button type="button" onClick={handleUnlink}
              className="text-[11px] text-muted-foreground hover:text-destructive shrink-0">
              Délier
            </button>
          </div>
        ) : (
          <p className="flex-1 text-xs text-muted-foreground italic">
            Aucun événement lié — sélectionnez ou créez un événement ci-dessous.
          </p>
        )}

        <button type="button" onClick={onRemove}
          className="text-xs text-destructive hover:underline shrink-0 ml-2">
          Supprimer
        </button>
      </div>

      {/* ── Sélection d'événement (obligatoire) ────────────────────────────── */}
      {!linkedEvent && !pickerOpen && (
        <div className="px-5 py-6 flex flex-col items-center gap-3 bg-primary/[0.02] border-b">
          <p className="text-sm text-muted-foreground text-center">
            Chaque moment doit être lié à un événement du calendrier.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button type="button" onClick={() => setPickerOpen(true)}
              className="gap-2">
              📅 Sélectionner un événement existant
            </Button>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(true)}>
              ✨ Créer un nouvel événement
            </Button>
          </div>
        </div>
      )}

      {/* Modale de création d'événement (accès direct sans passer par le picker) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-background w-full max-w-3xl rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
              <div>
                <h2 className="text-lg font-bold text-secondary">✨ Créer un événement dans le calendrier</h2>
                <p className="text-xs text-muted-foreground mt-0.5">L'événement sera lié à ce moment une fois créé.</p>
              </div>
              <button type="button" onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="px-6 pb-6">
              <EventForm
                mode="create"
                compact
                onSave={() => setCreateModalOpen(false)}
                onCreated={(ev) => {
                  onEventCreated(ev);
                  handleSelectEvent(ev);
                  setCreateModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Event Picker (inline, visible when open) */}
      {pickerOpen && (
        <div className="px-5 py-4 border-b bg-white">
          <EventPicker
            allEvents={allEvents}
            excludeEventIds={usedEventIds.filter(id => id !== eventId)}
            onSelect={(ev, cloneFrom) => handleSelectEvent(ev, cloneFrom)}
            onClose={() => setPickerOpen(false)}
            onEventCreated={handleEventCreatedInModal}
          />
        </div>
      )}

      {/* ── Corps : champs narratifs (visibles seulement si événement lié) ── */}
      {linkedEvent && (
        <div className="px-5 py-4 space-y-4">

          {/* Titre narratif */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Titre du moment
              <span className="ml-1 normal-case font-normal text-muted-foreground/70">(optionnel — pré-rempli depuis l'événement)</span>
            </Label>
            <Input {...form.register(`moments.${index}.title`)} placeholder={linkedEvent.title} className="font-semibold" />
          </div>

          {/* Récit + Illustration */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  Récit <span className="text-destructive">*</span>
                </Label>
                {linkedEvent.summary && (
                  <button type="button"
                    onClick={() => form.setValue(`moments.${index}.narrative`, linkedEvent.summary, { shouldDirty: true })}
                    className="text-[10px] text-primary hover:underline font-medium">
                    ↩ Copier le résumé de l'événement
                  </button>
                )}
              </div>
              <Controller
                control={form.control}
                name={`moments.${index}.narrative` as any}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Narration de ce moment dans le récit…"
                    rows={5}
                  />
                )}
              />
            </div>

            {/* Illustration */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Illustration</Label>
              <input type="hidden" {...form.register(`moments.${index}.media.0.type`)} defaultValue="image" />
              <div className="flex gap-1">
                <Input {...form.register(`moments.${index}.media.0.url`)} placeholder="https://…" className="h-8 text-xs" />
                <button type="button" className="h-8 px-2 text-xs border border-muted rounded-md hover:border-primary/40 shrink-0"
                  onClick={() => mediaFileRef.current?.click()}>📁</button>
                <input ref={mediaFileRef} type="file" accept="image/*" className="hidden" onChange={handleMediaFile} />
              </div>
              {mediaUrl && (
                <div className="rounded-xl overflow-hidden border bg-muted h-28">
                  <img src={mediaUrl} alt="" className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <Input {...form.register(`moments.${index}.media.0.caption`)} placeholder="Légende (optionnel)" className="text-xs h-8" />
            </div>
          </div>

          {/* Citation d'époque */}
          <div className="pt-2 border-t border-muted space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Citation d'époque <span className="normal-case font-normal text-muted-foreground/70">(optionnel)</span>
            </Label>
            <div className="grid sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <Controller
                  control={form.control}
                  name={`moments.${index}.quote` as any}
                  render={({ field }) => (
                    <Input {...field} value={field.value ?? ''} placeholder="« Texte de la citation… »" className="text-xs h-8" />
                  )}
                />
              </div>
              <div>
                <Controller
                  control={form.control}
                  name={`moments.${index}.quoteAuthor` as any}
                  render={({ field }) => (
                    <Input {...field} value={field.value ?? ''} placeholder="Auteur / source" className="text-xs h-8" />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Ressources */}
          <div className="pt-2 border-t border-muted">
            <MomentResources momentIndex={index} form={form} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main TimelineForm ────────────────────────────────────────────────────────
interface TimelineFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

export function TimelineForm({ mode, initialData, onSave }: TimelineFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const titleTouched = useRef(false);
  const periodLabelTouched = useRef(!!initialData?.periodLabel); // touched if pre-existing data

  // Load events on mount
  useEffect(() => {
    adminApi.listEvents().then(r => setAllEvents(r.items)).catch(console.error);
  }, []);

  const buildDefaultMoment = (overrides?: Partial<TimelineFormData['moments'][0]>) => ({
    title: '', narrative: '', timeType: 'date' as const,
    dateExact: null, periodText: null, position: 0,
    // media[0] est toujours initialisé avec type:'image' pour que Zod reçoive toujours un type valide
    media: [{ type: 'image' as const, url: '', caption: '' }],
    resources: [], eventId: null,
    ...overrides,
  });

  const defaultValues: TimelineFormData = initialData ? {
    title: initialData.title ?? '',
    subtitle: initialData.subtitle ?? '',
    slug: initialData.slug ?? '',
    type: initialData.type ?? 'evenement',
    summary: initialData.summary ?? '',
    longDescription: initialData.longDescription ?? '',
    coverUrl: initialData.coverUrl ?? '',
    periodLabel: initialData.periodLabel ?? '',
    status: initialData.status ?? 'draft',
    moments: (initialData.moments ?? []).map((m: any) => ({
      ...buildDefaultMoment(),
      ...m,
      // API returns narrativeText; form uses narrative
      narrative: m.narrative ?? m.narrativeText ?? '',
      dateExact: m.dateExact ?? null,
      periodText: m.periodText ?? m.periodLabel ?? null,
      media: m.media ?? [],
      resources: m.resources ?? [],
      eventId: m.eventId ?? null,
      quote: m.quote ?? null,
      quoteAuthor: m.quoteAuthor ?? null,
      sourceStoryEventId: m.sourceStoryEventId ?? null,
    })),
  } : {
    title: '', subtitle: '', slug: '', type: 'evenement',
    summary: '', longDescription: '', coverUrl: '',
    periodLabel: '', status: 'draft', moments: [],
  };

  const form = useForm<TimelineFormData>({ defaultValues });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'moments' });

  // Watched values — declared first so effects below can reference them
  const titleValue = form.watch('title');
  const watchedMoments = form.watch('moments');

  // Auto-period-label from moment dates (oldest → newest year)
  useEffect(() => {
    if (periodLabelTouched.current) return;
    const years: number[] = [];
    for (const m of watchedMoments) {
      if (m.dateExact) {
        const y = new Date(m.dateExact + 'T12:00:00Z').getFullYear();
        if (!isNaN(y) && y > 0) years.push(y);
      } else if (m.periodText) {
        const y = extractYear(m.periodText);
        if (y) years.push(y);
      }
    }
    if (years.length === 0) return;
    const minY = Math.min(...years);
    const maxY = Math.max(...years);
    form.setValue('periodLabel', minY === maxY ? String(minY) : `${minY} – ${maxY}`, { shouldValidate: false });
  }, [watchedMoments, form]);

  // Auto-slug from title
  useEffect(() => {
    if (mode === 'create' && !titleTouched.current) {
      form.setValue('slug', slugify(titleValue ?? ''));
    }
  }, [titleValue, mode, form]);

  const handleSortByDate = useCallback(() => {
    form.setValue('moments', sortMomentsByDate(form.getValues('moments')));
  }, [form]);

  const onSubmit = async (rawValues: TimelineFormData) => {
    // Purger _formState.errors : sans cette ligne, RHF 7.x bloque onSubmit
    // au prochain appel si des erreurs manuelles ont été posées (form.setError).
    form.clearErrors();
    setGlobalError(null);
    setIsSaving(true);

    // ── Nettoyage et normalisation des valeurs avant validation ───────────────
    const values: TimelineFormData = {
      ...rawValues,
      subtitle: norm(rawValues.subtitle),
      longDescription: norm(rawValues.longDescription),
      moments: sortMomentsByDate(
        rawValues.moments.map((m, i) => ({
          ...m,
          dateExact: norm(m.dateExact),
          periodText: norm(m.periodText),
          position: i,
          // Filtrer les medias vides ET garantir que type est toujours 'image'|'video'
          media: (m.media ?? [])
            .filter((med: any) => med?.url?.trim())
            .map((med: any) => ({
              ...med,
              type: (['image', 'video'] as const).includes(med.type) ? med.type : 'image',
            })),
          // Filtrer les ressources incomplètes
          resources: (m.resources ?? []).filter((r: any) => r?.url?.trim() && r?.title?.trim()),
        }))
      ),
    };

    // ── Validation Zod ────────────────────────────────────────────────────────
    // IMPORTANT : on ne fait jamais form.setError() ici.
    // form.setError() écrit dans _formState.errors, et RHF 7.x refuse d'appeler
    // onSubmit au prochain clic si _formState.errors est non-vide.
    // Tout le feedback d'erreur passe par le banner globalError.
    const result = await timelineFormSchema.safeParseAsync(values);
    if (!result.success) {
      const humanLabels: Record<string, string> = {
        title: 'Titre', slug: 'Slug', summary: 'Description courte',
        coverUrl: 'Image de couverture', periodLabel: 'Label de période',
        status: 'Statut', type: 'Type',
      };
      const messages: string[] = [];
      const seenPaths = new Set<string>();

      for (const issue of result.error.issues) {
        const pathStr = issue.path.join('.');
        if (!seenPaths.has(pathStr)) {
          seenPaths.add(pathStr);
          if (issue.path.length === 1) {
            const field = humanLabels[String(issue.path[0])] ?? String(issue.path[0]);
            messages.push(`${field} : ${issue.message}`);
          } else if (issue.path[0] === 'moments') {
            const idx = Number(issue.path[1]) + 1;
            const subField = issue.path.slice(2).join(' › ');
            messages.push(`Moment ${idx} › ${subField} : ${issue.message}`);
          } else {
            messages.push(`${pathStr} : ${issue.message}`);
          }
        }
      }

      setGlobalError('Veuillez corriger les erreurs suivantes :\n' + messages.map(m => `• ${m}`).join('\n'));
      setIsSaving(false);
      // Scroller vers le banner d'erreur dans la barre sticky (toujours visible)
      setTimeout(() => {
        document.querySelector('[data-global-error]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
      return;
    }

    // ── Sauvegarde ────────────────────────────────────────────────────────────
    // Mapper narrative → narrativeText pour correspondre aux colonnes story_events
    const apiPayload = {
      ...result.data,
      moments: result.data.moments.map((m: any) => ({
        ...m,
        narrativeText: m.narrative ?? null,
        // sourceStoryEventId est déjà dans le schéma
      })),
    };

    try {
      if (mode === 'create') await adminApi.createTimeline(apiPayload as any);
      else await adminApi.updateTimeline(initialData.id, apiPayload as any);
      onSave();
    } catch (err) {
      setGlobalError(`Erreur lors de l'enregistrement : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm(`Supprimer définitivement le parcours "${initialData.title}" ?`)) return;
    try { await adminApi.deleteTimeline(initialData.id); onSave(); }
    catch { alert('Impossible de supprimer ce parcours.'); }
  };

  const E = ({ field }: { field: string }) => {
    const err = (form.formState.errors as any)[field]?.message;
    return err ? <p className="text-xs text-destructive mt-1" data-error="true">{err}</p> : null;
  };

  const coverUrlValue = form.watch('coverUrl');

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{mode === 'create' ? '+ Nouveau Parcours' : 'Modifier le Parcours'}</h1>
          <p className="text-sm text-muted-foreground mt-1">Un parcours = une suite d'événements du calendrier liés ensemble pour raconter une histoire.</p>
        </div>
        {mode === 'edit' && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>Supprimer</Button>
        )}
      </div>

      {globalError && (
        <div data-global-error className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm whitespace-pre-line">
          {globalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Informations générales ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Informations générales</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Titre <span className="text-destructive">*</span></Label>
              <Input {...form.register('title')} placeholder="ex: Nelson Mandela, La Décolonisation…" />
              <E field="title" />
            </div>
            <div>
              <Label>Slug <span className="text-muted-foreground text-xs">(auto-généré)</span></Label>
              <Input {...form.register('slug')} placeholder="nelson-mandela"
                onChange={e => { titleTouched.current = true; form.setValue('slug', e.target.value); }} />
              <E field="slug" />
            </div>
          </div>
          <div>
            <Label>Sous-titre <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input {...form.register('subtitle')} placeholder="Un long chemin vers la liberté" />
          </div>
          <div>
            <Label>Description courte <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs">(10–200 car.)</span></Label>
            <Textarea {...form.register('summary')} rows={2} placeholder="Résumé affiché sur la carte du parcours…" />
            <div className="flex justify-between mt-1">
              <E field="summary" />
              <span className="text-xs text-muted-foreground ml-auto">{(form.watch('summary') ?? '').length} / 200</span>
            </div>
          </div>
          <div>
            <Label>Description longue <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea {...form.register('longDescription')} rows={3} placeholder="Description complète affichée sur la page du parcours…" />
          </div>
        </section>

        {/* ── Configuration & Visuel ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Configuration & Visuel</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Type <span className="text-destructive">*</span></Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" {...form.register('type')}>
                <option value="evenement">🏛️ Événement historique</option>
                <option value="personnage">👤 Biographie / Personnage</option>
              </select>
              <E field="type" />
            </div>
            <div>
              <Label>Statut</Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" {...form.register('status')}>
                <option value="draft">📝 Brouillon (invisible)</option>
                <option value="published">✅ Publié</option>
              </select>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                Label de période <span className="text-destructive">*</span>
                {!periodLabelTouched.current && (
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">AUTO</span>
                )}
              </Label>
              <Input
                {...form.register('periodLabel')}
                placeholder="ex: 1918 – 2013"
                className="mt-1"
                onChange={e => {
                  periodLabelTouched.current = true;
                  form.setValue('periodLabel', e.target.value, { shouldValidate: true });
                }}
              />
              {!periodLabelTouched.current && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Calculé depuis les dates des moments — modifiez pour personnaliser.</p>
              )}
              <E field="periodLabel" />
            </div>
          </div>
          <ThumbnailInput value={coverUrlValue ?? ''} onChange={url => form.setValue('coverUrl', url, { shouldValidate: true })}
            error={form.formState.errors.coverUrl?.message} label="Image de couverture *" />
        </section>

        {/* ── Moments du récit ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                🎬 Moments du récit
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{fields.length}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Chaque moment = un événement du calendrier (existant ou à créer).</p>
            </div>
            {fields.length > 1 && (
              <Button type="button" size="sm" variant="outline" onClick={handleSortByDate} className="text-primary border-primary/30">
                🔄 Trier par date
              </Button>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">🎭</p>
              <p className="font-bold text-secondary mb-1">Aucun moment créé</p>
              <p className="text-sm text-muted-foreground mb-4">Sélectionnez des événements existants du calendrier ou créez-en de nouveaux.</p>
              <Button type="button" variant="outline" onClick={() => append(buildDefaultMoment())}>
                + Ajouter le premier moment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <MomentCard
                  key={field.id}
                  index={index} total={fields.length}
                  form={form}
                  allEvents={allEvents}
                  usedEventIds={watchedMoments.map(m => m.eventId).filter(Boolean) as string[]}
                  onEventCreated={newEv => setAllEvents(prev => [newEv, ...prev])}
                  onRemove={() => remove(index)}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  canMoveUp={index > 0 && !swapWouldBreakOrder(watchedMoments, index, index - 1)}
                  canMoveDown={index < fields.length - 1 && !swapWouldBreakOrder(watchedMoments, index + 1, index)}
                />
              ))}

              {/* Bouton "+ Ajouter un moment" toujours en bas, juste après le dernier moment */}
              <button
                type="button"
                onClick={() => append(buildDefaultMoment({ position: fields.length }))}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/30 rounded-2xl text-sm font-bold text-primary hover:bg-primary/5 hover:border-primary/60 transition-colors"
              >
                <span className="text-lg leading-none">+</span> Ajouter un moment
              </button>
            </div>
          )}
        </section>

        {/* ── Barre d'action sticky ──────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t -mx-6 px-6 pt-3 pb-4 space-y-2">
          {/* Résumé d'erreurs inline (visible même sans scroller) */}
          {globalError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-2 text-xs whitespace-pre-line leading-relaxed">
              {globalError}
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving} className="min-w-[200px] gap-2">
              {isSaving ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Enregistrement…</>
              ) : (
                <>✓ {mode === 'create' ? 'Créer le parcours' : 'Enregistrer les modifications'}</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onSave}>Annuler</Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {fields.length} moment{fields.length > 1 ? 's' : ''} — {mode === 'create' ? 'sera visible après publication.' : 'modifications instantanées.'}
            </span>
          </div>
        </div>

      </form>
    </div>
  );
}
