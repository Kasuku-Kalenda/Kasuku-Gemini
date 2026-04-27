import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { timelineFormSchema, TimelineFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

const norm = (v: string | null | undefined): string | null =>
  v === '' || v === undefined ? null : v;

// Extrait une année depuis un texte de période (ex: "Été 1944", "1943")
const extractYear = (text?: string | null): number | null => {
    if (!text) return null;
    const m = text.match(/\b(\d{3,4})\b/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    return y >= 100 && y <= 2200 ? y : null;
};

// Convertit un moment en timestamp pour comparaison
const momentTs = (m: TimelineFormData['moments'][0]): number => {
    if (m.dateExact) {
        const ts = new Date(m.dateExact + 'T12:00:00Z').getTime();
        if (!isNaN(ts)) return ts;
    }
    const y = extractYear(m.periodText);
    if (y) return new Date(`${y}-07-01T12:00:00Z`).getTime();
    return Infinity; // sans date → fin
};

// Trie les moments chronologiquement (dateExact > année de periodText > position manuelle)
const sortMomentsByDate = (moments: TimelineFormData['moments']): TimelineFormData['moments'] =>
  [...moments].sort((a, b) => {
    const ta = momentTs(a);
    const tb = momentTs(b);
    if (ta !== tb) return ta - tb;
    return (a.position ?? 0) - (b.position ?? 0);
  }).map((m, i) => ({ ...m, position: i }));

// Vérifie si un swap violerait l'ordre chronologique
const swapWouldBreakOrder = (
    moments: TimelineFormData['moments'],
    indexA: number,
    indexB: number,
): boolean => {
    if (indexA < 0 || indexB >= moments.length) return false;
    const tsA = momentTs(moments[indexA]);
    const tsB = momentTs(moments[indexB]);
    if (tsA === Infinity || tsB === Infinity) return false; // pas de date → libre
    // Si on remonte A avant B, A doit avoir ts <= tsB
    return tsA > tsB; // montée impossible si A est plus récent que B
};

// ─── Composant upload image (URL ou fichier) ──────────────────────────────────

interface ThumbnailInputProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

const ThumbnailInput: React.FC<ThumbnailInputProps> = ({
  value, onChange, error, label = 'Image de couverture', placeholder = 'https://…'
}) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop lourd (max 5 Mo).');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
      setUploading(false);
    };
    reader.onerror = () => { alert('Erreur de lecture.'); setUploading(false); };
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-2">
        <button type="button" onClick={() => setMode('url')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'url' ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}>
          🔗 URL
        </button>
        <button type="button" onClick={() => { setMode('upload'); fileRef.current?.click(); }}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === 'upload' ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}>
          {uploading ? '⏳…' : '📁 Fichier'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {mode === 'url' && (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {value && (
        <div className="rounded-xl overflow-hidden border bg-muted h-36 flex items-center justify-center mt-1">
          <img src={value} alt="Aperçu" className="h-full w-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1" data-error="true">{error}</p>}
    </div>
  );
};

// ─── Composant moment ─────────────────────────────────────────────────────────

interface MomentCardProps {
  index: number;
  total: number;
  form: ReturnType<typeof useForm<TimelineFormData>>;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const MomentCard: React.FC<MomentCardProps> = ({ index, total, form, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) => {
  const [mediaMode, setMediaMode] = useState<'url' | 'upload'>('url');
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const timeType = form.watch(`moments.${index}.timeType`);
  const mediaUrl = form.watch(`moments.${index}.media.0.url`);

  const titleErr = (form.formState.errors.moments as any)?.[index]?.title?.message;
  const narrativeErr = (form.formState.errors.moments as any)?.[index]?.narrative?.message;
  const dateErr = (form.formState.errors.moments as any)?.[index]?.dateExact?.message;

  const handleMediaFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Fichier trop lourd (max 5 Mo).'); return; }
    setMediaUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      form.setValue(`moments.${index}.media.0.url`, ev.target?.result as string, { shouldValidate: true });
      form.setValue(`moments.${index}.media.0.type`, 'image');
      setMediaUploading(false);
    };
    reader.onerror = () => { alert('Erreur de lecture.'); setMediaUploading(false); };
    reader.readAsDataURL(file);
  }, [form, index]);

  return (
    <div className="border rounded-2xl p-5 bg-card space-y-4 relative group">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0 || !canMoveUp}
            title={!canMoveUp ? 'Impossible : ce moment est plus récent que le précédent' : 'Monter'}
            className={`w-6 h-5 text-[10px] border rounded transition-colors flex items-center justify-center
              ${!canMoveUp ? 'bg-destructive/10 border-destructive/30 text-destructive/50 cursor-not-allowed' : 'bg-muted hover:bg-primary hover:text-white'}
              disabled:opacity-30`}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1 || !canMoveDown}
            title={!canMoveDown ? 'Impossible : ce moment est plus ancien que le suivant' : 'Descendre'}
            className={`w-6 h-5 text-[10px] border rounded transition-colors flex items-center justify-center
              ${!canMoveDown ? 'bg-destructive/10 border-destructive/30 text-destructive/50 cursor-not-allowed' : 'bg-muted hover:bg-primary hover:text-white'}
              disabled:opacity-30`}
          >
            ▼
          </button>
        </div>
        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1">
          <Input
            {...form.register(`moments.${index}.title`)}
            placeholder="Titre du moment…"
            className="font-semibold"
          />
          {titleErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{titleErr}</p>}
        </div>
        <button type="button" onClick={onRemove}
          className="text-xs text-destructive hover:underline flex-shrink-0">
          Supprimer
        </button>
      </div>

      {/* Corps */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div>
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Récit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              {...form.register(`moments.${index}.narrative`)}
              placeholder="Racontez ce moment du parcours… contexte, importance, anecdotes…"
              rows={4}
              className="mt-1"
            />
            {narrativeErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{narrativeErr}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Type de date</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                {...form.register(`moments.${index}.timeType`)}
              >
                <option value="date">📅 Date précise</option>
                <option value="period">🕰 Période / Époque</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                {timeType === 'date' ? 'Date' : 'Période'}
              </Label>
              {timeType === 'date' ? (
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                  {...form.register(`moments.${index}.dateExact`)}
                />
              ) : (
                <Input
                  {...form.register(`moments.${index}.periodText`)}
                  placeholder="ex: Été 1944, XIXe siècle…"
                  className="mt-1"
                />
              )}
              {dateErr && <p className="text-xs text-destructive mt-0.5" data-error="true">{dateErr}</p>}
            </div>
          </div>
        </div>

        {/* Média du moment */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
            Illustration
          </Label>
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button type="button" onClick={() => setMediaMode('url')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${mediaMode === 'url' ? 'bg-white shadow font-medium text-primary' : 'text-muted-foreground'}`}>
              🔗 URL
            </button>
            <button type="button" onClick={() => { setMediaMode('upload'); mediaFileRef.current?.click(); }}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${mediaMode === 'upload' ? 'bg-white shadow font-medium text-primary' : 'text-muted-foreground'}`}>
              {mediaUploading ? '⏳' : '📁 Fichier'}
            </button>
          </div>
          <input ref={mediaFileRef} type="file" accept="image/*" className="hidden" onChange={handleMediaFile} />
          {mediaMode === 'url' && (
            <Input
              {...form.register(`moments.${index}.media.0.url`)}
              placeholder="https://…"
              className="text-xs"
            />
          )}
          {mediaUrl && (
            <div className="rounded-xl overflow-hidden border bg-muted h-28">
              <img src={mediaUrl} alt="" className="h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <Input
            {...form.register(`moments.${index}.media.0.caption`)}
            placeholder="Légende (optionnel)"
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Formulaire principal ─────────────────────────────────────────────────────

interface TimelineFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

export function TimelineForm({ mode, initialData, onSave }: TimelineFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const titleTouched = useRef(false);

  const buildDefaultMoment = (overrides?: Partial<TimelineFormData['moments'][0]>) => ({
    title: '',
    narrative: '',
    timeType: 'date' as const,
    dateExact: null,
    periodText: null,
    position: 0,
    media: [],
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
    })),
  } : {
    title: '', subtitle: '', slug: '', type: 'evenement',
    shortDescription: '', longDescription: '', thumbnail: '',
    periodLabel: '', status: 'draft', moments: [],
  };

  const form = useForm<TimelineFormData>({ defaultValues });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'moments',
  });

  // Auto-slug depuis le titre
  const titleValue = form.watch('title');
  useEffect(() => {
    if (mode === 'create' && !titleTouched.current) {
      form.setValue('slug', slugify(titleValue ?? ''));
    }
  }, [titleValue, mode, form]);

  // Trier tous les moments par date (bouton manuel)
  const handleSortByDate = useCallback(() => {
    const current = form.getValues('moments');
    const sorted = sortMomentsByDate(current);
    form.setValue('moments', sorted);
  }, [form]);

  // Moments courants pour calculer les contraintes d'ordre
  const watchedMoments = form.watch('moments');

  // ─── Soumission ───────────────────────────────────────────────────────────

  const onSubmit = async (rawValues: TimelineFormData) => {
    setGlobalError(null);
    setIsSaving(true);

    // Normalisation
    const values: TimelineFormData = {
      ...rawValues,
      subtitle: norm(rawValues.subtitle),
      longDescription: norm(rawValues.longDescription),
      // Auto-tri des moments par date avant sauvegarde
      moments: sortMomentsByDate(
        rawValues.moments.map((m, i) => ({
          ...m,
          dateExact: norm(m.dateExact),
          periodText: norm(m.periodText),
          position: i,
          // S'assurer que media est bien formé
          media: (m.media ?? []).filter((med: any) => med?.url),
        }))
      ),
    };

    const result = await timelineFormSchema.safeParseAsync(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path.length > 0) {
          form.setError(issue.path.join('.') as any, { type: 'manual', message: issue.message });
        }
      }
      const topErrors = result.error.issues.filter(i => i.path.length === 0);
      if (topErrors.length > 0) setGlobalError(topErrors.map(i => i.message).join(' · '));
      setIsSaving(false);

      // Scroll vers la première erreur
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    try {
      if (mode === 'create') {
        await adminApi.createTimeline(result.data);
      } else {
        await adminApi.updateTimeline(initialData.id, result.data);
      }
      onSave();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setGlobalError(`Erreur lors de l'enregistrement : ${msg}`);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm(`Supprimer définitivement le parcours "${initialData.title}" et tous ses moments ?`)) return;
    try {
      await adminApi.deleteTimeline(initialData.id);
      onSave();
    } catch {
      alert('Impossible de supprimer ce parcours.');
    }
  };

  const E = ({ field }: { field: string }) => {
    const err = (form.formState.errors as any)[field]?.message;
    return err ? <p className="text-xs text-destructive mt-1" data-error="true">{err}</p> : null;
  };

  const thumbnailValue = form.watch('thumbnail');

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? '+ Nouveau Parcours' : 'Modifier le Parcours'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Créez un récit narratif ou la biographie d\'un personnage.'
              : 'Mettez à jour les informations du parcours.'}
          </p>
        </div>
        {mode === 'edit' && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            Supprimer le parcours
          </Button>
        )}
      </div>

      {/* Erreur globale */}
      {globalError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Section 1 : Informations générales ───────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Informations générales
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Titre <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('title')}
                placeholder="ex: Nelson Mandela, La Décolonisation…"
                data-error={!!form.formState.errors.title}
              />
              <E field="title" />
            </div>
            <div>
              <Label>Slug <span className="text-muted-foreground text-xs">(auto-généré)</span></Label>
              <Input
                {...form.register('slug')}
                placeholder="nelson-mandela"
                onChange={(e) => {
                  titleTouched.current = true;
                  form.setValue('slug', e.target.value);
                }}
                data-error={!!form.formState.errors.slug}
              />
              <E field="slug" />
            </div>
          </div>

          <div>
            <Label>Sous-titre <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input {...form.register('subtitle')} placeholder="ex: Un long chemin vers la liberté" />
          </div>

          <div>
            <Label>
              Description courte <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs ml-1">(10–200 caractères)</span>
            </Label>
            <Textarea
              {...form.register('shortDescription')}
              rows={2}
              placeholder="Résumé accrocheur affiché sur la carte de la timeline…"
              data-error={!!form.formState.errors.shortDescription}
            />
            <div className="flex justify-between mt-1">
              <E field="shortDescription" />
              <span className="text-xs text-muted-foreground ml-auto">
                {(form.watch('shortDescription') ?? '').length} / 200 max
              </span>
            </div>
          </div>

          <div>
            <Label>Description longue <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              {...form.register('longDescription')}
              rows={4}
              placeholder="Description complète affichée sur la page du parcours…"
            />
          </div>
        </section>

        {/* ── Section 2 : Configuration & Image ────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Configuration & Visuel
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Type <span className="text-destructive">*</span></Label>
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('type')}
              >
                <option value="evenement">🏛️ Événement historique</option>
                <option value="personnage">👤 Biographie / Personnage</option>
              </select>
              <E field="type" />
            </div>
            <div>
              <Label>Statut</Label>
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('status')}
              >
                <option value="draft">📝 Brouillon (invisible)</option>
                <option value="published">✅ Publié</option>
              </select>
            </div>
            <div>
              <Label>Label de période <span className="text-destructive">*</span></Label>
              <Input
                {...form.register('periodLabel')}
                placeholder="ex: 1918 – 2013"
                className="mt-1"
                data-error={!!form.formState.errors.periodLabel}
              />
              <E field="periodLabel" />
            </div>
          </div>

          <ThumbnailInput
            value={thumbnailValue ?? ''}
            onChange={(url) => form.setValue('thumbnail', url, { shouldValidate: true })}
            error={form.formState.errors.thumbnail?.message}
            label="Image de couverture *"
          />
        </section>

        {/* ── Section 3 : Moments du récit ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                🎬 Moments du récit
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {fields.length}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les moments sont automatiquement triés par date lors de l'enregistrement.
              </p>
            </div>
            <div className="flex gap-2">
              {fields.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSortByDate}
                  title="Réorganise tous les moments du plus ancien au plus récent"
                  className="text-primary border-primary/30 hover:bg-primary/5"
                >
                  🔄 Trier par date
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append(buildDefaultMoment({ position: fields.length }))}
              >
              + Ajouter un moment
              </Button>
            </div>
          </div>

          {/* Info : événements liés */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm text-primary/80 flex items-start gap-3">
            <span className="text-lg mt-0.5">💡</span>
            <div>
              <strong>Les événements du calendrier liés à ce parcours apparaissent automatiquement.</strong>
              <br />
              Pour lier un événement, allez dans <em>Événements → Modifier → section "Parcours"</em>
              et sélectionnez ce parcours. L'événement sera intégré à la bonne position selon sa date.
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-10 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Aucun moment — ajoutez des étapes narratives, ou liez des événements existants du calendrier.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => append(buildDefaultMoment())}
              >
                + Ajouter le premier moment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <MomentCard
                  key={field.id}
                  index={index}
                  total={fields.length}
                  form={form}
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

        {/* ── Barre d'action sticky ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-6 px-6">
          <Button type="submit" disabled={isSaving} className="min-w-[200px] gap-2">
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>✓ {mode === 'create' ? 'Créer le parcours' : 'Enregistrer les modifications'}</>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onSave}>
            Annuler
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {mode === 'create'
              ? `${fields.length} moment${fields.length > 1 ? 's' : ''} — sera visible après publication.`
              : 'Les modifications sont instantanées.'}
          </span>
        </div>

      </form>
    </div>
  );
}
