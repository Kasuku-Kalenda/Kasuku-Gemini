import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { timelineFormSchema, TimelineFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import type { UseFormReturn } from 'react-hook-form';

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
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Fichier trop lourd (max 5 Mo).'); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-2">
        {(['url', 'upload'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); if (m === 'upload') fileRef.current?.click(); }}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === m ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}>
            {m === 'url' ? '🔗 URL' : '📁 Fichier'}
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

  const handleFile = (ri: number, type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => form.setValue(`moments.${momentIndex}.resources.${ri}.url` as any, ev.target?.result as string);
    reader.readAsDataURL(file);
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
interface EventPickerProps {
  allEvents: any[];
  onSelect: (ev: any) => void;
  onClose: () => void;
  onCreateEvent: (ev: { title: string; dateISO: string; summary: string }) => Promise<void>;
}

const EventPicker: React.FC<EventPickerProps> = ({ allEvents, onSelect, onClose, onCreateEvent }) => {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [theme, setTheme] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async () => {
    if (!newTitle.trim() || !newSummary.trim()) return;
    setCreating(true);
    try { await onCreateEvent({ title: newTitle.trim(), dateISO: newDate, summary: newSummary.trim() }); }
    finally { setCreating(false); }
  };

  return (
    <div className="border-2 border-primary/20 rounded-2xl bg-white shadow-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-secondary">📅 Sélectionner un événement du calendrier</p>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-secondary">✕ Fermer</button>
      </div>

      {!showCreate ? (
        <>
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
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6 italic">Aucun événement trouvé.</p>
            ) : filtered.map((ev: any) => (
              <button key={ev.id} type="button" onClick={() => onSelect(ev)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-left transition-colors group">
                <span className="text-base shrink-0">📅</span>
                <span className="flex-1 text-sm font-medium text-secondary line-clamp-1 group-hover:text-primary transition-colors">{ev.title}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {ev.countryCode && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{ev.countryCode}</span>}
                  {(ev.dateISO || ev.year) && <span className="text-xs text-muted-foreground">{ev.dateISO ?? ev.year}</span>}
                </span>
                <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">← Lier</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">{filtered.length} sur {allEvents.length} événements</p>
            <button type="button" onClick={() => setShowCreate(true)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              + Créer un nouvel événement
            </button>
          </div>
        </>
      ) : (
        /* Quick event creation form */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm text-secondary">✨ Créer un événement dans le calendrier</p>
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-muted-foreground hover:text-secondary">← Retour</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Titre *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titre de l'événement" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Date (optionnel)</Label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Résumé / Description * <span className="text-muted-foreground normal-case">(min 40 caractères)</span>
            </Label>
            <Textarea value={newSummary} onChange={e => setNewSummary(e.target.value)}
              rows={3} placeholder="Résumé de l'événement — sera utilisé comme narration du moment." className="mt-1 text-sm" />
            <p className="text-xs text-muted-foreground mt-0.5">{newSummary.length} / 40 min</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" size="sm" disabled={creating || !newTitle.trim() || newSummary.trim().length < 40}
              onClick={handleCreate} className="flex-1">
              {creating ? '⏳ Création…' : '✓ Créer et lier cet événement'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
          </div>
          {newSummary.trim().length > 0 && newSummary.trim().length < 40 && (
            <p className="text-xs text-amber-600">Encore {40 - newSummary.trim().length} caractères minimum pour le résumé.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MomentCard ───────────────────────────────────────────────────────────────
interface MomentCardProps {
  index: number;
  total: number;
  form: UseFormReturn<TimelineFormData>;
  allEvents: any[];
  onEventCreated: (ev: any) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const MomentCard: React.FC<MomentCardProps> = ({
  index, total, form, allEvents, onEventCreated,
  onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const timeType = form.watch(`moments.${index}.timeType`);
  const mediaUrl = form.watch(`moments.${index}.media.0.url`);
  const eventId = form.watch(`moments.${index}.eventId` as any) as string | null;

  const linkedEvent = useMemo(() => allEvents.find((e: any) => e.id === eventId), [allEvents, eventId]);

  const titleErr = (form.formState.errors.moments as any)?.[index]?.title?.message;
  const narrativeErr = (form.formState.errors.moments as any)?.[index]?.narrative?.message;
  const dateErr = (form.formState.errors.moments as any)?.[index]?.dateExact?.message;

  // Select an event → auto-fill moment fields
  const handleSelectEvent = useCallback((ev: any) => {
    form.setValue(`moments.${index}.eventId` as any, ev.id);
    form.setValue(`moments.${index}.title`, ev.title);
    // Date
    if (ev.dateISO) {
      form.setValue(`moments.${index}.timeType`, 'date');
      form.setValue(`moments.${index}.dateExact`, ev.dateISO);
    } else if (ev.year || ev.period) {
      form.setValue(`moments.${index}.timeType`, 'period');
      form.setValue(`moments.${index}.periodText`, ev.period ?? String(ev.year ?? ''));
    }
    // Narrative: pre-fill with event summary if narrative is empty
    const currentNarrative = form.getValues(`moments.${index}.narrative`);
    if ((!currentNarrative || currentNarrative.trim() === '') && ev.summary) {
      form.setValue(`moments.${index}.narrative`, ev.summary);
    }
    // Image: pre-fill with event's first image if no image set
    const currentImg = form.getValues(`moments.${index}.media.0.url`);
    if (!currentImg && ev.media?.[0]?.url) {
      form.setValue(`moments.${index}.media.0.url`, ev.media[0].url);
      form.setValue(`moments.${index}.media.0.type`, ev.media[0].type ?? 'image');
    }
    setPickerOpen(false);
  }, [form, index]);

  // Unlink event (keep content, just remove the link)
  const handleUnlink = useCallback(() => {
    form.setValue(`moments.${index}.eventId` as any, null);
  }, [form, index]);

  // Create event inline then link it
  const handleCreateEvent = useCallback(async (data: { title: string; dateISO: string; summary: string }) => {
    try {
      const newEvent = await adminApi.createEvent({
        title: data.title,
        slug: slugify(data.title) + '-' + Date.now(),
        summary: data.summary,
        dateISO: data.dateISO || undefined,
        themeIds: [], media: [], sources: [],
      } as any);
      onEventCreated(newEvent);
      handleSelectEvent(newEvent);
    } catch (err) {
      alert('Erreur lors de la création de l\'événement.');
    }
  }, [handleSelectEvent, onEventCreated]);

  const handleMediaFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      form.setValue(`moments.${index}.media.0.url`, ev.target?.result as string, { shouldValidate: true });
      form.setValue(`moments.${index}.media.0.type`, 'image');
    };
    reader.readAsDataURL(file);
  }, [form, index]);

  return (
    <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-3 bg-muted/20 border-b border-muted">
        {/* Move buttons */}
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={onMoveUp} disabled={index === 0 || !canMoveUp}
            title={!canMoveUp ? 'Impossible : ordre chronologique' : 'Monter'}
            className={`w-6 h-5 text-[10px] border rounded flex items-center justify-center transition-colors
              ${!canMoveUp ? 'bg-destructive/10 border-destructive/30 text-destructive/50 cursor-not-allowed' : 'bg-muted hover:bg-primary hover:text-white'}
              disabled:opacity-30`}>▲</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1 || !canMoveDown}
            title={!canMoveDown ? 'Impossible : ordre chronologique' : 'Descendre'}
            className={`w-6 h-5 text-[10px] border rounded flex items-center justify-center transition-colors
              ${!canMoveDown ? 'bg-destructive/10 border-destructive/30 text-destructive/50 cursor-not-allowed' : 'bg-muted hover:bg-primary hover:text-white'}
              disabled:opacity-30`}>▼</button>
        </div>
        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">{index + 1}</span>

        {/* Event link badge or title input */}
        {linkedEvent ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20 truncate max-w-[240px]">
              📅 {linkedEvent.title}
            </span>
            <button type="button" onClick={() => setPickerOpen(p => !p)}
              className="text-[11px] text-muted-foreground hover:text-primary underline shrink-0">
              Changer
            </button>
            <button type="button" onClick={handleUnlink}
              className="text-[11px] text-muted-foreground hover:text-red-500 shrink-0">
              Délier
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => setPickerOpen(p => !p)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                pickerOpen ? 'bg-primary text-white border-primary' : 'border-primary/30 text-primary hover:bg-primary/5'
              }`}>
              {pickerOpen ? '▲ Fermer le sélecteur' : '📅 Lier un événement existant'}
            </button>
            <span className="text-[11px] text-muted-foreground">ou saisie libre ci-dessous</span>
          </div>
        )}

        <button type="button" onClick={onRemove} className="text-xs text-destructive hover:underline shrink-0">Supprimer</button>
      </div>

      {/* Event Picker (inline, visible when open) */}
      {pickerOpen && (
        <div className="px-5 py-4 border-b border-muted bg-white">
          <EventPicker
            allEvents={allEvents}
            onSelect={handleSelectEvent}
            onClose={() => setPickerOpen(false)}
            onCreateEvent={handleCreateEvent}
          />
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 space-y-4">

        {/* Title (always editable — even if auto-filled from event) */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
            Titre du moment {linkedEvent && <span className="text-primary/60 ml-1 normal-case text-[9px]">(pré-rempli depuis l'événement)</span>}
          </Label>
          <Input {...form.register(`moments.${index}.title`)} placeholder="Titre du moment…" className="font-semibold" />
          {titleErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{titleErr}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: Narrative + Date */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  Récit <span className="text-destructive">*</span>
                </Label>
                {linkedEvent?.summary && (
                  <button type="button"
                    onClick={() => form.setValue(`moments.${index}.narrative`, linkedEvent.summary)}
                    className="text-[10px] text-primary hover:underline font-medium">
                    ↩ Utiliser la description de l'événement
                  </button>
                )}
              </div>
              <Textarea {...form.register(`moments.${index}.narrative`)}
                placeholder={linkedEvent ? 'Narration de ce moment — modifiez ou utilisez la description de l\'événement…' : 'Racontez ce moment du parcours…'}
                rows={4} />
              {narrativeErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{narrativeErr}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Type de date</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  {...form.register(`moments.${index}.timeType`)}>
                  <option value="date">📅 Date précise</option>
                  <option value="period">🕰 Période / Époque</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  {timeType === 'date' ? 'Date' : 'Période'}
                  {linkedEvent && <span className="text-primary/60 ml-1 normal-case text-[9px]">(auto)</span>}
                </Label>
                {timeType === 'date' ? (
                  <input type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    {...form.register(`moments.${index}.dateExact`)} />
                ) : (
                  <Input {...form.register(`moments.${index}.periodText`)} placeholder="ex: Été 1944, XIXe siècle…" className="mt-1" />
                )}
                {dateErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{dateErr}</p>}
              </div>
            </div>
          </div>

          {/* Right: Main illustration */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Illustration principale</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              <Input {...form.register(`moments.${index}.media.0.url`)} placeholder="https://…" className="h-8 text-xs flex-1" />
              <button type="button" className="h-8 px-2 text-xs border border-muted rounded-md hover:border-primary/40"
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

        {/* Resources section */}
        <div className="pt-2 border-t border-muted">
          <MomentResources momentIndex={index} form={form} />
        </div>
      </div>
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
    media: [], resources: [], eventId: null,
    ...overrides,
  });

  const defaultValues: TimelineFormData = initialData ? {
    title: initialData.title ?? '',
    subtitle: initialData.subtitle ?? '',
    slug: initialData.slug ?? '',
    type: initialData.type ?? 'evenement',
    shortDescription: initialData.shortDescription ?? '',
    longDescription: initialData.longDescription ?? '',
    thumbnail: initialData.thumbnail ?? '',
    periodLabel: initialData.periodLabel ?? '',
    status: initialData.status ?? 'draft',
    moments: (initialData.moments ?? []).map((m: any) => ({
      ...buildDefaultMoment(),
      ...m,
      dateExact: m.dateExact ?? null,
      periodText: m.periodText ?? null,
      media: m.media ?? [],
      resources: m.resources ?? [],
      eventId: m.eventId ?? null,
    })),
  } : {
    title: '', subtitle: '', slug: '', type: 'evenement',
    shortDescription: '', longDescription: '', thumbnail: '',
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
    setGlobalError(null);
    setIsSaving(true);
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
          media: (m.media ?? []).filter((med: any) => med?.url),
          resources: (m.resources ?? []).filter((r: any) => r?.url && r?.title),
        }))
      ),
    };
    const result = await timelineFormSchema.safeParseAsync(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path.length > 0) form.setError(issue.path.join('.') as any, { type: 'manual', message: issue.message });
      }
      const top = result.error.issues.filter(i => i.path.length === 0);
      if (top.length > 0) setGlobalError(top.map(i => i.message).join(' · '));
      setIsSaving(false);
      setTimeout(() => document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    try {
      if (mode === 'create') await adminApi.createTimeline(result.data);
      else await adminApi.updateTimeline(initialData.id, result.data);
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

  const thumbnailValue = form.watch('thumbnail');

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
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">{globalError}</div>
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
            <Textarea {...form.register('shortDescription')} rows={2} placeholder="Résumé affiché sur la carte du parcours…" />
            <div className="flex justify-between mt-1">
              <E field="shortDescription" />
              <span className="text-xs text-muted-foreground ml-auto">{(form.watch('shortDescription') ?? '').length} / 200</span>
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
          <ThumbnailInput value={thumbnailValue ?? ''} onChange={url => form.setValue('thumbnail', url, { shouldValidate: true })}
            error={form.formState.errors.thumbnail?.message} label="Image de couverture *" />
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
            <div className="flex gap-2">
              {fields.length > 1 && (
                <Button type="button" size="sm" variant="outline" onClick={handleSortByDate} className="text-primary border-primary/30">
                  🔄 Trier par date
                </Button>
              )}
              <Button type="button" size="sm" variant="outline"
                onClick={() => append(buildDefaultMoment({ position: fields.length }))}>
                + Ajouter un moment
              </Button>
            </div>
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
                  onEventCreated={newEv => setAllEvents(prev => [newEv, ...prev])}
                  onRemove={() => remove(index)}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  canMoveUp={index > 0 && !swapWouldBreakOrder(watchedMoments, index, index - 1)}
                  canMoveDown={index < fields.length - 1 && !swapWouldBreakOrder(watchedMoments, index + 1, index)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Barre d'action sticky ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-6 px-6">
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

      </form>
    </div>
  );
}
