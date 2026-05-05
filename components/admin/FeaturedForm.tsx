"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { featuredFormSchema, FeaturedFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { uploadFile } from '../../services/apiClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

interface FeaturedFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

// ─── Types de source ──────────────────────────────────────────────────────────
type SourceType = 'event' | 'story' | 'module';

const SOURCE_CONFIG = {
  event:  { label: 'Événement',  emoji: '📅', ctaDefault: 'Voir l\'événement',    ctaPrefix: '/events/' },
  story:  { label: 'Récit',      emoji: '📖', ctaDefault: 'Lire le récit',         ctaPrefix: '/timelines/' },
  module: { label: 'Module',     emoji: '🎓', ctaDefault: 'Commencer le module',   ctaPrefix: '/modules/' },
} as const;

// ─── Badge de visibilité ──────────────────────────────────────────────────────
function VisibilityBadge({ active, startDate, endDate }: { active: boolean; startDate: string; endDate: string }) {
  const today = new Date().toISOString().split('T')[0];
  if (!active) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="h-2 w-2 rounded-full bg-gray-400" /> Inactif
    </span>
  );
  if (today < startDate) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
      <span className="h-2 w-2 rounded-full bg-blue-500" /> Programmé — à partir du {startDate}
    </span>
  );
  if (today > endDate) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
      <span className="h-2 w-2 rounded-full bg-amber-500" /> Expiré depuis le {endDate}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Visible maintenant
    </span>
  );
}

// ─── Sélecteur de source inline ───────────────────────────────────────────────
function SourcePicker({ type, items, selectedId, onSelect, onClose }: {
  type: SourceType;
  items: any[];
  selectedId: string | null;
  onSelect: (item: any) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(q.toLowerCase()) ||
    i.slug?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="border-2 border-primary/20 rounded-xl bg-white shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-secondary">
          {SOURCE_CONFIG[type].emoji} Sélectionner un {SOURCE_CONFIG[type].label.toLowerCase()}
        </p>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-secondary">✕ Fermer</button>
      </div>

      <Input
        autoFocus
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher par titre ou slug…"
        className="text-sm"
      />

      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun résultat</p>
        )}
        {filtered.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm flex items-center gap-3 ${
              selectedId === item.id
                ? 'border-primary bg-primary/5 font-semibold'
                : 'border-transparent hover:bg-muted/60'
            }`}
          >
            {/* Thumbnail */}
            {(item.imageUrl || item.coverUrl || item.thumbnailUrl) && (
              <img
                src={item.imageUrl || item.coverUrl || item.thumbnailUrl}
                alt=""
                className="w-8 h-8 rounded object-cover shrink-0 bg-muted"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              {item.slug && <div className="text-[10px] text-muted-foreground truncate">{item.slug}</div>}
            </div>
            {selectedId === item.id && <span className="ml-auto text-primary shrink-0">✓</span>}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-right">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function FeaturedForm({ mode, initialData, onSave }: FeaturedFormProps) {
  const [isSaving, setIsSaving]       = useState(false);
  const [events, setEvents]           = useState<any[]>([]);
  const [stories, setStories]         = useState<any[]>([]);
  const [modules, setModules]         = useState<any[]>([]);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [imgMode, setImgMode]         = useState<'url' | 'file'>('url');
  const [imgUploading, setImgUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today     = new Date().toISOString().split('T')[0];
  const in30Days  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Dériver les valeurs initiales depuis initialData
  const defaultValues: Partial<FeaturedFormData> = initialData ? {
    sourceType:       initialData.sourceType ?? 'event',
    eventId:          initialData.eventId   ?? null,
    storyId:          initialData.storyId   ?? null,
    moduleId:         initialData.moduleId  ?? null,
    titleOverride:    initialData.titleOverride    ?? '',
    subtitleOverride: initialData.subtitleOverride ?? '',
    imageUrlOverride: initialData.imageUrlOverride ?? '',
    ctaLabel:         initialData.ctaLabel  ?? 'Découvrir',
    ctaTo:            initialData.ctaTo     ?? '',
    active:           initialData.active    ?? true,
    startDate:        initialData.startDate ?? today,
    endDate:          initialData.endDate   ?? in30Days,
    order:            initialData.order     ?? 0,
  } : {
    sourceType: 'event',
    eventId: null, storyId: null, moduleId: null,
    titleOverride: '', subtitleOverride: '', imageUrlOverride: '',
    ctaLabel: 'Découvrir', ctaTo: '',
    active: true, startDate: today, endDate: in30Days, order: 0,
  };

  const form = useForm<FeaturedFormData>({ defaultValues: defaultValues as FeaturedFormData });

  const sourceType      = form.watch('sourceType') as SourceType;
  const eventId         = form.watch('eventId');
  const storyId         = form.watch('storyId');
  const moduleId        = form.watch('moduleId');
  const titleOverride   = form.watch('titleOverride');
  const subtitleOverride = form.watch('subtitleOverride');
  const imageUrlOverride = form.watch('imageUrlOverride');
  const watchedActive   = form.watch('active');
  const watchedStart    = form.watch('startDate');
  const watchedEnd      = form.watch('endDate');

  // Source active
  const selectedId = sourceType === 'event' ? eventId : sourceType === 'story' ? storyId : moduleId;
  const allItems   = sourceType === 'event' ? events : sourceType === 'story' ? stories : modules;
  const selected   = allItems.find((i: any) => i.id === selectedId) ?? null;

  // Valeurs fusionnées (override ?? source)
  const sourceTitle    = selected?.title ?? '';
  const sourceSubtitle = selected?.summary ?? selected?.shortDescription ?? '';
  const sourceImage    = selected?.imageUrl ?? selected?.coverUrl ?? selected?.thumbnailUrl ?? selected?.cover_url ?? selected?.thumbnail_url ?? '';

  const displayTitle    = titleOverride    || sourceTitle;
  const displaySubtitle = subtitleOverride || sourceSubtitle;
  const displayImage    = imageUrlOverride || sourceImage;

  // Charger les listes
  useEffect(() => {
    adminApi.listEvents().then(r => setEvents(
      r.items.map((e: any) => ({
        ...e,
        imageUrl: e.media?.[0]?.url ?? e.imageUrl ?? '',
      }))
    ));
    adminApi.listTimelines().then(r => setStories(
      r.items.map((s: any) => ({ ...s, imageUrl: s.coverUrl ?? s.cover_url ?? '' }))
    ));
    adminApi.listModules().then(r => setModules(
      r.items.map((m: any) => ({ ...m, imageUrl: m.thumbnailUrl ?? m.thumbnail_url ?? m.thumbnail ?? '' }))
    ));
  }, []);

  // Quand on change de type, réinitialiser la source
  const handleTypeChange = useCallback((t: SourceType) => {
    form.setValue('sourceType', t);
    form.setValue('eventId',  null);
    form.setValue('storyId',  null);
    form.setValue('moduleId', null);
    form.setValue('titleOverride',    '');
    form.setValue('subtitleOverride', '');
    form.setValue('imageUrlOverride', '');
    form.setValue('ctaLabel', SOURCE_CONFIG[t].ctaDefault);
    form.setValue('ctaTo', '');
    setPickerOpen(true);
  }, [form]);

  // Quand on sélectionne une source
  const handleSelect = useCallback((item: any) => {
    if (sourceType === 'event')  form.setValue('eventId',  item.id);
    if (sourceType === 'story')  form.setValue('storyId',  item.id);
    if (sourceType === 'module') form.setValue('moduleId', item.id);

    // Auto-remplir CTA
    const prefix = SOURCE_CONFIG[sourceType].ctaPrefix;
    form.setValue('ctaTo',    prefix + item.slug);
    form.setValue('ctaLabel', SOURCE_CONFIG[sourceType].ctaDefault);
    setPickerOpen(false);
  }, [form, sourceType]);

  // Upload image override
  const handleImgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImgUploading(true);
    try {
      const { url } = await uploadFile(file, 'misc');
      form.setValue('imageUrlOverride', url, { shouldValidate: true });
    } catch { alert('Erreur upload image'); }
    finally { setImgUploading(false); }
  };

  const onSubmit = async (rawData: FeaturedFormData) => {
    const result = await featuredFormSchema.safeParseAsync(rawData);
    if (!result.success) {
      const flat = result.error.flatten();
      Object.entries(flat.fieldErrors).forEach(([field, msgs]) => {
        form.setError(field as any, { message: (msgs as string[])[0] });
      });
      if (flat.formErrors?.length) {
        form.setError('sourceType', { message: flat.formErrors[0] });
      }
      return;
    }
    setIsSaving(true);
    try {
      if (mode === 'create') {
        await adminApi.createFeatured(result.data);
      } else {
        await adminApi.updateFeatured(initialData.id, result.data);
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (confirm('Supprimer cette mise en avant ?')) {
      await adminApi.deleteFeatured(initialData.id);
      onSave();
    }
  };

  return (
    <div className="container py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? '⭐ Nouvelle Mise en Avant' : '⭐ Modifier la Mise en Avant'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choisissez un événement, récit ou module à mettre en avant sur la page d'accueil.
          </p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── 1. Choisir le type de source ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">1. Type de contenu</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['event', 'story', 'module'] as SourceType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-bold ${
                  sourceType === t
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted text-muted-foreground hover:border-primary/40 hover:text-secondary'
                }`}
              >
                <span className="text-2xl">{SOURCE_CONFIG[t].emoji}</span>
                {SOURCE_CONFIG[t].label}
              </button>
            ))}
          </div>
          {form.formState.errors.sourceType && (
            <p className="text-xs text-red-500">{form.formState.errors.sourceType.message}</p>
          )}
        </div>

        {/* ── 2. Sélectionner la source ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">
              2. Sélectionner {sourceType === 'event' ? 'l\'événement' : sourceType === 'story' ? 'le récit' : 'le module'}
            </h2>
            {selected && (
              <button type="button" onClick={() => setPickerOpen(p => !p)}
                className="text-xs text-primary hover:underline font-medium">
                {pickerOpen ? '✕ Fermer' : '↕ Changer'}
              </button>
            )}
          </div>

          {/* Source sélectionnée */}
          {selected && !pickerOpen && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/[0.03] border border-primary/10">
              {displayImage && (
                <img src={displayImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-secondary truncate">{displayTitle || '—'}</p>
                {displaySubtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{displaySubtitle}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{selected.slug}</p>
              </div>
              <span className="text-2xl shrink-0">{SOURCE_CONFIG[sourceType].emoji}</span>
            </div>
          )}

          {/* Picker */}
          {(!selected || pickerOpen) && (
            <SourcePicker
              type={sourceType}
              items={allItems}
              selectedId={selectedId ?? null}
              onSelect={handleSelect}
              onClose={() => setPickerOpen(false)}
            />
          )}

          {!selected && !pickerOpen && (
            <div className="text-center py-4">
              <Button type="button" onClick={() => setPickerOpen(true)} variant="outline" className="gap-2">
                {SOURCE_CONFIG[sourceType].emoji} Choisir {SOURCE_CONFIG[sourceType].label === 'Événement' ? 'un événement' : SOURCE_CONFIG[sourceType].label === 'Récit' ? 'un récit' : 'un module'}
              </Button>
            </div>
          )}
        </div>

        {/* ── 3. Personnalisation (overrides) ─────────────────────────────── */}
        {selected && (
          <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">3. Personnalisation</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide pour hériter des valeurs de la source. Remplissez pour personnaliser l'affichage.
              </p>
            </div>

            {/* Titre override */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Titre affiché
                </Label>
                {!titleOverride && sourceTitle && (
                  <span className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                    Hérité de la source
                  </span>
                )}
              </div>
              <Input
                {...form.register('titleOverride')}
                placeholder={sourceTitle || 'Titre de la source…'}
              />
              {form.formState.errors.titleOverride && (
                <p className="text-xs text-red-500">{form.formState.errors.titleOverride.message}</p>
              )}
            </div>

            {/* Sous-titre override */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sous-titre / Description
                </Label>
                {!subtitleOverride && sourceSubtitle && (
                  <span className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                    Hérité de la source
                  </span>
                )}
              </div>
              <Textarea
                rows={2}
                {...form.register('subtitleOverride')}
                placeholder={sourceSubtitle || 'Description de la source…'}
              />
            </div>

            {/* Image override */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Image de couverture
                </Label>
                {!imageUrlOverride && sourceImage && (
                  <span className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                    Héritée de la source
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                {(['url', 'file'] as const).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setImgMode(m); if (m === 'file') fileRef.current?.click(); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      imgMode === m ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-muted hover:border-primary'
                    }`}>
                    {m === 'url' ? '🔗 URL' : imgUploading ? '⏳ Upload…' : '📁 Fichier'}
                  </button>
                ))}
                {imageUrlOverride && (
                  <button type="button" onClick={() => { form.setValue('imageUrlOverride', ''); setImgMode('url'); }}
                    className="ml-auto text-xs text-destructive hover:underline">
                    ✕ Supprimer l'override
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImgFile} />
              {imgMode === 'url' && (
                <Input {...form.register('imageUrlOverride')} placeholder={sourceImage || 'https://…'} />
              )}
              {form.formState.errors.imageUrlOverride && (
                <p className="text-xs text-red-500">{form.formState.errors.imageUrlOverride.message}</p>
              )}
              {/* Aperçu */}
              {displayImage && (
                <div className="relative rounded-xl overflow-hidden h-36 bg-black mt-2">
                  <img src={displayImage} alt="Aperçu" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  {imageUrlOverride && (
                    <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Personnalisée
                    </span>
                  )}
                  {!imageUrlOverride && sourceImage && (
                    <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Source
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. CTA & Planification ───────────────────────────────────────── */}
        {selected && (
          <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">4. Bouton & Planification</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texte du bouton *</Label>
                <Input {...form.register('ctaLabel')} placeholder="Découvrir…" />
                {form.formState.errors.ctaLabel && (
                  <p className="text-xs text-red-500">{form.formState.errors.ctaLabel.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destination (URL) *</Label>
                <Input {...form.register('ctaTo')} placeholder="/modules/slug…" />
                {form.formState.errors.ctaTo && (
                  <p className="text-xs text-red-500">{form.formState.errors.ctaTo.message}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-secondary">Visibilité</span>
                <VisibilityBadge active={watchedActive} startDate={watchedStart || today} endDate={watchedEnd || in30Days} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date de début *</Label>
                  <Input type="date" {...form.register('startDate')} />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date de fin *</Label>
                  <Input type="date" {...form.register('endDate')} />
                  {form.formState.errors.endDate && (
                    <p className="text-xs text-red-500">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="active" {...form.register('active')}
                    className="h-5 w-5 rounded border-muted text-primary focus:ring-primary" />
                  <Label htmlFor="active" className="cursor-pointer font-semibold">Actif / Visible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Ordre :</Label>
                  <Input type="number" min={0} {...form.register('order', { valueAsNumber: true })} className="w-20 text-center" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full h-12 text-base font-bold"
            disabled={isSaving || !selected}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Enregistrement…
              </span>
            ) : (
              mode === 'create' ? '✓ Créer la mise en avant' : '✓ Enregistrer les modifications'
            )}
          </Button>
          {!selected && (
            <p className="text-xs text-muted-foreground text-center">
              Sélectionnez d'abord une source pour continuer.
            </p>
          )}
          {mode === 'edit' && (
            <Button variant="destructive" type="button"
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
              onClick={handleDelete}>
              Supprimer cette mise en avant
            </Button>
          )}
        </div>

      </form>
    </div>
  );
}
