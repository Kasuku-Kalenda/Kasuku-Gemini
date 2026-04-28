import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventFormSchema, EventFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import type { TimelineNarrative } from '../../types';

// ─── Pays ─────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: '', name: '— Sélectionner un pays —' },
  { code: 'UN', name: '🌍 International' },
  // Afrique
  { code: 'ZA', name: 'Afrique du Sud' }, { code: 'DZ', name: 'Algérie' },
  { code: 'AO', name: 'Angola' }, { code: 'BJ', name: 'Bénin' },
  { code: 'BW', name: 'Botswana' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' }, { code: 'CM', name: 'Cameroun' },
  { code: 'CV', name: 'Cap-Vert' }, { code: 'CF', name: 'Centrafrique' },
  { code: 'KM', name: 'Comores' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'DR Congo' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'DJ', name: 'Djibouti' }, { code: 'EG', name: 'Égypte' },
  { code: 'ER', name: 'Érythrée' }, { code: 'ET', name: 'Éthiopie' },
  { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambie' },
  { code: 'GH', name: 'Ghana' }, { code: 'GN', name: 'Guinée' },
  { code: 'GQ', name: 'Guinée équatoriale' }, { code: 'GW', name: 'Guinée-Bissau' },
  { code: 'KE', name: 'Kenya' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libye' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' }, { code: 'MA', name: 'Maroc' },
  { code: 'MR', name: 'Mauritanie' }, { code: 'MU', name: 'Maurice' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'NA', name: 'Namibie' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'UG', name: 'Ouganda' }, { code: 'RW', name: 'Rwanda' },
  { code: 'ST', name: 'São Tomé-et-Príncipe' }, { code: 'SN', name: 'Sénégal' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalie' }, { code: 'SD', name: 'Soudan' },
  { code: 'SS', name: 'Soudan du Sud' }, { code: 'SZ', name: 'Eswatini' },
  { code: 'TZ', name: 'Tanzanie' }, { code: 'TD', name: 'Tchad' },
  { code: 'TG', name: 'Togo' }, { code: 'TN', name: 'Tunisie' },
  { code: 'ZM', name: 'Zambie' }, { code: 'ZW', name: 'Zimbabwe' },
  // Reste du monde
  { code: 'BR', name: 'Brésil' }, { code: 'CN', name: 'Chine' },
  { code: 'CO', name: 'Colombie' }, { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' }, { code: 'FR', name: 'France' },
  { code: 'GB', name: 'Royaume-Uni' }, { code: 'IN', name: 'Inde' },
  { code: 'IT', name: 'Italie' }, { code: 'RU', name: 'Russie' },
  { code: 'US', name: 'États-Unis' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

const norm = (v: string | null | undefined): string | null =>
  v === '' || v === undefined ? null : v;

// ─── Composant image upload ───────────────────────────────────────────────────

interface MediaInputProps {
  index: number;
  form: ReturnType<typeof useForm<EventFormData>>;
  onRemove: () => void;
}

const MediaInput: React.FC<MediaInputProps> = ({ index, form, onRemove }) => {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUrl = form.watch(`media.${index}.url`);
  const currentType = form.watch(`media.${index}.type`);
  const urlError = (form.formState.errors.media as any)?.[index]?.url?.message;
  const captionError = (form.formState.errors.media as any)?.[index]?.caption?.message;

  // Mise à jour du preview quand l'URL change depuis l'extérieur
  useEffect(() => {
    if (currentUrl && !currentUrl.startsWith('data:')) setPreview(currentUrl);
  }, [currentUrl]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop lourd (max 5 Mo). Utilisez une image compressée.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      form.setValue(`media.${index}.url`, dataUrl, { shouldValidate: true });
      form.setValue(`media.${index}.type`, file.type.startsWith('video') ? 'video' : 'image');
      setPreview(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => { alert('Erreur de lecture du fichier.'); setUploading(false); };
    reader.readAsDataURL(file);
  }, [form, index]);

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        {/* Type image/vidéo */}
        <div className="flex gap-2">
          {(['image', 'video'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => form.setValue(`media.${index}.type`, t)}
              className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                currentType === t ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t === 'image' ? '🖼 Image' : '🎬 Vidéo'}
            </button>
          ))}
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-destructive hover:underline">Supprimer</button>
      </div>

      {/* Toggle URL / Upload */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${inputMode === 'url' ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}
        >
          🔗 Lien URL
        </button>
        <button
          type="button"
          onClick={() => { setInputMode('upload'); fileRef.current?.click(); }}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${inputMode === 'upload' ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}
        >
          {uploading ? '⏳ Chargement…' : '📁 Téléverser'}
        </button>
      </div>

      {/* Input URL */}
      {inputMode === 'url' && (
        <div>
          <Input
            placeholder="https://exemple.com/image.jpg"
            {...form.register(`media.${index}.url`)}
            onChange={(e) => {
              form.setValue(`media.${index}.url`, e.target.value, { shouldValidate: true });
              setPreview(e.target.value);
            }}
          />
          {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
        </div>
      )}

      {/* Input fichier (caché) */}
      <input
        ref={fileRef}
        type="file"
        accept={currentType === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={handleFile}
      />

      {/* Prévisualisation */}
      {preview && (
        <div className="rounded-lg overflow-hidden border bg-muted h-32 flex items-center justify-center">
          {currentType === 'video'
            ? <video src={preview} className="h-full w-full object-cover" muted />
            : <img src={preview} alt="Aperçu" className="h-full w-full object-cover" onError={() => setPreview('')} />
          }
        </div>
      )}

      {/* Légende + Crédit */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input placeholder="Légende (optionnel)" {...form.register(`media.${index}.caption`)} />
          {captionError && <p className="text-xs text-destructive mt-1">{captionError}</p>}
        </div>
        <Input placeholder="Crédit photographe" {...form.register(`media.${index}.credit`)} />
      </div>
    </div>
  );
};

// ─── Formulaire principal ─────────────────────────────────────────────────────

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

export function EventForm({ mode, initialData, onSave }: EventFormProps) {
  const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const titleRef = useRef<boolean>(false);

  const defaultValues: Partial<EventFormData> = initialData ? {
    title: initialData.title ?? '',
    slug: initialData.slug ?? '',
    summary: initialData.summary ?? '',
    dateISO: initialData.dateISO ?? '',
    year: initialData.year ?? undefined,
    period: initialData.period ?? '',
    countryCode: initialData.countryCode ?? '',
    themeIds: initialData.themes?.map((t: any) => t.id) ?? [],
    media: initialData.media ?? [],
    sources: initialData.sources ?? [],
    timelineId: initialData.timelineId ?? '',
    timelineMomentId: initialData.timelineMomentId ?? '',
  } : {
    title: '', slug: '', summary: '',
    dateISO: '', year: undefined, period: '', countryCode: '',
    themeIds: [], media: [], sources: [],
    timelineId: '', timelineMomentId: '',
  };

  const form = useForm<EventFormData>({ defaultValues: defaultValues as EventFormData });

  const { fields: mediaFields, append: appendMedia, remove: removeMedia } =
    useFieldArray({ control: form.control, name: 'media' });
  const { fields: sourcesFields, append: appendSource, remove: removeSource } =
    useFieldArray({ control: form.control, name: 'sources' });

  useEffect(() => {
    adminApi.listTimelines().then(res => setTimelines(res.items));
    adminApi.listThemes().then(res => setThemes(res.items));
  }, []);

  // Auto-slug depuis le titre (seulement en mode create et si slug non modifié manuellement)
  const titleValue = form.watch('title');
  useEffect(() => {
    if (mode === 'create' && !titleRef.current) {
      form.setValue('slug', slugify(titleValue ?? ''));
    }
  }, [titleValue, mode, form]);

  const selectedTimelineId = form.watch('timelineId');
  const selectedTimeline = timelines.find(t => t.id === selectedTimelineId);
  const selectedThemeIds = form.watch('themeIds') || [];

  const toggleTheme = (id: string) => {
    const current = form.getValues('themeIds') ?? [];
    form.setValue('themeIds', current.includes(id) ? current.filter(t => t !== id) : [...current, id]);
  };

  // ─── Soumission — validation manuelle avec Zod ────────────────────────────

  const onSubmit = async (rawValues: EventFormData) => {
    setGlobalError(null);
    setIsSaving(true);

    // Normalisation : "" → null
    const values: EventFormData = {
      ...rawValues,
      dateISO: norm(rawValues.dateISO),
      countryCode: norm(rawValues.countryCode),
      period: norm(rawValues.period),
      timelineId: norm(rawValues.timelineId),
      timelineMomentId: norm(rawValues.timelineMomentId),
    };

    // Validation Zod manuelle — plus fiable qu'un resolver
    const result = await eventFormSchema.safeParseAsync(values);

    if (!result.success) {
      // Mapper les erreurs sur les champs du formulaire
      const issues = result.error.issues;
      let hasSetError = false;

      for (const issue of issues) {
        if (issue.path.length > 0) {
          const fieldPath = issue.path.join('.') as any;
          form.setError(fieldPath, { type: 'manual', message: issue.message });
          hasSetError = true;
        }
      }

      if (!hasSetError) {
        setGlobalError(issues.map(i => i.message).join(' · '));
      } else {
        // Scroll vers le premier champ en erreur
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]');
          firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }

      setIsSaving(false);
      return;
    }

    try {
      if (mode === 'create') {
        await adminApi.createEvent(result.data);
      } else {
        await adminApi.updateEvent(initialData.id, result.data);
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
    if (!window.confirm(`Supprimer définitivement "${initialData.title}" ?`)) return;
    try {
      await adminApi.deleteEvent(initialData.id);
      onSave();
    } catch {
      alert('Impossible de supprimer cet événement.');
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  const E = ({ field }: { field: string }) => {
    const err = (form.formState.errors as any)[field]?.message;
    return err ? <p className="text-xs text-destructive mt-1" data-error="true">{err}</p> : null;
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? '+ Nouvel événement' : 'Modifier l\'événement'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create' ? 'Créez un fait historique ou culturel.' : 'Mettez à jour les informations.'}
          </p>
        </div>
        {mode === 'edit' && (
          <Button type="button" variant="destructive" onClick={handleDelete} size="sm">
            Supprimer
          </Button>
        )}
      </div>

      {/* Erreur globale */}
      {globalError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1 : Informations principales ──────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Informations principales
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="Ex: Indépendance du Sénégal"
                {...form.register('title')}
                data-error={!!form.formState.errors.title}
              />
              <E field="title" />
            </div>
            <div>
              <Label htmlFor="slug">
                Slug <span className="text-muted-foreground text-xs">(auto-généré)</span>
              </Label>
              <Input
                id="slug"
                placeholder="independance-du-senegal"
                {...form.register('slug')}
                onChange={(e) => {
                  titleRef.current = true;
                  form.setValue('slug', e.target.value);
                }}
                data-error={!!form.formState.errors.slug}
              />
              <E field="slug" />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">
              Résumé <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-xs ml-2">(min. 40 caractères)</span>
            </Label>
            <Textarea
              id="summary"
              rows={5}
              placeholder="Décrivez l'événement en détail — son contexte, son importance historique et culturelle…"
              {...form.register('summary')}
              data-error={!!form.formState.errors.summary}
            />
            <div className="flex justify-between mt-1">
              <E field="summary" />
              <span className="text-xs text-muted-foreground ml-auto">
                {(form.watch('summary') ?? '').length} / 40 min
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 2 : Dates & Localisation ──────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Date & Localisation
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateISO">
                Date précise
                <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <input
                id="dateISO"
                type="date"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                {...form.register('dateISO')}
              />
              <E field="dateISO" />
            </div>
            <div>
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                placeholder="ex: 1960"
                min="-5000"
                max="2100"
                {...form.register('year', { setValueAs: (v) => (v === '' || v === null) ? undefined : parseInt(v, 10) })}
              />
              <E field="year" />
            </div>
            <div>
              <Label htmlFor="period">Période historique</Label>
              <Input
                id="period"
                placeholder="ex: XVe siècle"
                {...form.register('period')}
              />
              <p className="text-xs text-muted-foreground mt-1">Pour les événements sans date précise</p>
            </div>
          </div>

          <div>
            <Label htmlFor="countryCode">Pays</Label>
            <select
              id="countryCode"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...form.register('countryCode')}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <E field="countryCode" />
          </div>
        </section>

        {/* ── Section 3 : Thèmes ────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Thèmes
          </h2>
          {themes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Chargement des thèmes…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedThemeIds.includes(theme.id)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 4 : Médias ────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Médias
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendMedia({ type: 'image', url: '', caption: '', credit: '' })}
            >
              + Ajouter un média
            </Button>
          </div>

          {mediaFields.length === 0 && (
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">Aucun média — cliquez "+ Ajouter" pour insérer une image ou une vidéo.</p>
            </div>
          )}

          <div className="space-y-4">
            {mediaFields.map((field, index) => (
              <MediaInput
                key={field.id}
                index={index}
                form={form}
                onRemove={() => removeMedia(index)}
              />
            ))}
          </div>
        </section>

        {/* ── Section 5 : Sources ───────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Sources & Références
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendSource({ label: '', url: '' })}
            >
              + Ajouter une source
            </Button>
          </div>

          {sourcesFields.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Aucune source — recommandé pour la crédibilité.</p>
          )}

          <div className="space-y-3">
            {sourcesFields.map((field, index) => {
              const labelErr = (form.formState.errors.sources as any)?.[index]?.label?.message;
              const urlErr = (form.formState.errors.sources as any)?.[index]?.url?.message;
              return (
                <div key={field.id} className="border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Source {index + 1}</span>
                    <button type="button" onClick={() => removeSource(index)} className="text-xs text-destructive hover:underline">Supprimer</button>
                  </div>
                  <div>
                    <Input placeholder="Ex: Wikipedia, Le Monde, BBC…" {...form.register(`sources.${index}.label`)} />
                    {labelErr && <p className="text-xs text-destructive mt-1" data-error="true">{labelErr}</p>}
                  </div>
                  <div>
                    <Input placeholder="https://…" {...form.register(`sources.${index}.url`)} />
                    {urlErr && <p className="text-xs text-destructive mt-1" data-error="true">{urlErr}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 6 : Timeline (optionnel, masquée par défaut) ─────── */}
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setShowTimeline(v => !v)}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 w-full text-left hover:text-primary transition-colors"
          >
            <span className="text-base">{showTimeline ? '▾' : '▸'}</span>
            Lier à un Parcours (Timeline)
            <span className="text-xs font-normal normal-case tracking-normal ml-1">— optionnel</span>
          </button>

          {showTimeline && (
            <div className="grid md:grid-cols-2 gap-4 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div>
                <Label>Parcours associé</Label>
                <select className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1" {...form.register('timelineId')}>
                  <option value="">Aucun parcours</option>
                  {timelines.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <Label>Moment spécifique</Label>
                <select className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1" {...form.register('timelineMomentId')} disabled={!selectedTimelineId}>
                  <option value="">Début du parcours</option>
                  {selectedTimeline?.moments?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* ── Boutons d'action ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-6 px-6">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-[160px] gap-2"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Enregistrement…
              </>
            ) : (
              <>✓ {mode === 'create' ? 'Créer l\'événement' : 'Enregistrer les modifications'}</>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {mode === 'create'
              ? 'Sera immédiatement visible dans le calendrier.'
              : 'Les modifications sont instantanées.'}
          </span>
        </div>

      </form>
    </div>
  );
}
