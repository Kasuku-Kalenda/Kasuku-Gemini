
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { featuredFormSchema, FeaturedFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

interface FeaturedFormProps {
  mode: "create" | "edit";
  initialData?: any;
  onSave: () => void;
}

// ─── Visibility status badge ───────────────────────────────────────────────────
function VisibilityBadge({ active, startDate, endDate }: { active: boolean; startDate: string; endDate: string }) {
  const today = new Date().toISOString().split('T')[0];
  if (!active) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="h-2 w-2 rounded-full bg-gray-400" /> Inactif
    </span>
  );
  if (today < startDate) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
      <span className="h-2 w-2 rounded-full bg-blue-500" /> Pas encore visible (à partir du {startDate})
    </span>
  );
  if (today > endDate) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
      <span className="h-2 w-2 rounded-full bg-amber-500" /> Expiré (depuis le {endDate})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Visible maintenant
    </span>
  );
}

export function FeaturedForm({ mode, initialData, onSave }: FeaturedFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const form = useForm<FeaturedFormData>({
    defaultValues: initialData
      ? { ...initialData }
      : {
          title: '',
          subtitle: '',
          imageUrl: '',
          eventId: '',
          ctaLabel: 'Découvrir',
          ctaTo: '',
          active: true,
          startDate: today,
          endDate: in30Days,
          order: 0,
        },
  });

  const watchedValues = form.watch();
  const watchedActive = form.watch('active');
  const watchedStartDate = form.watch('startDate');
  const watchedEndDate = form.watch('endDate');
  const watchedImageUrl = form.watch('imageUrl');

  useEffect(() => {
    Promise.all([
      adminApi.listEvents().then(r => setEvents(r.items)),
      adminApi.listModules().then(r => setModules(r.items)),
      adminApi.listTimelines().then(r => setTimelines(r.items)),
    ]);
  }, []);

  // Sync imagePreview when imageUrl changes (URL mode)
  useEffect(() => {
    if (imageMode === 'url') setImagePreview(watchedImageUrl || '');
  }, [watchedImageUrl, imageMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      form.setValue('imageUrl', dataUrl, { shouldValidate: true });
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (rawData: FeaturedFormData) => {
    // Manual Zod validation (avoids zodResolver Zod v4 incompatibility)
    const result = await featuredFormSchema.safeParseAsync(rawData);
    if (!result.success) {
      const flat = result.error.flatten();
      Object.entries(flat.fieldErrors).forEach(([field, msgs]) => {
        form.setError(field as any, { message: (msgs as string[])[0] });
      });
      // Cross-field errors go on endDate
      if (flat.formErrors?.length) {
        form.setError('endDate', { message: flat.formErrors[0] });
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
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? 'Nouvelle Mise en Avant' : 'Modifier la Mise en Avant'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configurez l'élément qui apparaîtra en haut de la page d'accueil.
          </p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Statut de visibilité ── */}
        <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">Visibilité</h2>
            <VisibilityBadge
              active={watchedActive}
              startDate={watchedStartDate || today}
              endDate={watchedEndDate || in30Days}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début d'affichage</Label>
              <Input type="date" {...form.register('startDate')} />
              {form.formState.errors.startDate && (
                <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date de fin d'affichage</Label>
              <Input type="date" {...form.register('endDate')} />
              {form.formState.errors.endDate && (
                <p className="text-xs text-red-500">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="active"
              {...form.register('active')}
              className="h-5 w-5 rounded border-muted text-primary focus:ring-primary"
            />
            <Label htmlFor="active" className="cursor-pointer font-bold">
              Actif / Visible
            </Label>
          </div>
        </div>

        {/* ── Contenu principal ── */}
        <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-secondary text-sm uppercase tracking-wide mb-4">Contenu</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Titre principal *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="ex : Le Festival de Tombouctou"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Sous-titre / Description courte *</Label>
            <Textarea
              id="subtitle"
              rows={3}
              {...form.register('subtitle')}
              placeholder="Un voyage au cœur de la culture malienne..."
            />
            {form.formState.errors.subtitle && (
              <p className="text-xs text-red-500">{form.formState.errors.subtitle.message}</p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Image de fond *</Label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  imageMode === 'url'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-secondary border-muted hover:border-primary'
                }`}
              >
                🔗 URL
              </button>
              <button
                type="button"
                onClick={() => { setImageMode('file'); fileInputRef.current?.click(); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  imageMode === 'file'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-secondary border-muted hover:border-primary'
                }`}
              >
                📁 Fichier
              </button>
            </div>

            {imageMode === 'url' ? (
              <Input
                {...form.register('imageUrl')}
                placeholder="https://..."
              />
            ) : (
              <div
                className="border-2 border-dashed border-muted rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-muted-foreground font-medium">Cliquer pour choisir un fichier image</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — max 5 Mo</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {form.formState.errors.imageUrl && (
              <p className="text-xs text-red-500">{form.formState.errors.imageUrl.message}</p>
            )}

            {imagePreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden h-36 bg-black">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('imageUrl', '');
                    setImagePreview('');
                    setImageMode('url');
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 text-xs font-bold hover:bg-red-500 transition-colors"
                >
                  ✕ Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Liens ── */}
        <div className="bg-white rounded-2xl border border-muted p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-secondary text-sm uppercase tracking-wide mb-4">Liens & Destination</h2>

          <div className="space-y-2">
            <Label>Événement lié <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register('eventId')}
            >
              <option value="">— Aucun événement —</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Si renseigné, un bouton "Voir l'événement" s'affichera dans la story.
            </p>
            {form.formState.errors.eventId && (
              <p className="text-xs text-red-500">{form.formState.errors.eventId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Destination du bouton CTA *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register('ctaTo')}
            >
              <option value="">— Sélectionner une destination —</option>
              {modules.length > 0 && (
                <optgroup label="📚 Modules de formation">
                  {modules.map(m => (
                    <option key={m.id} value={m.slug}>{m.title}</option>
                  ))}
                </optgroup>
              )}
              {timelines.length > 0 && (
                <optgroup label="🎬 Parcours (Timelines)">
                  {timelines.map(t => (
                    <option key={t.id} value={t.slug}>{t.title}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {form.formState.errors.ctaTo && (
              <p className="text-xs text-red-500">{form.formState.errors.ctaTo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Texte du bouton (CTA) *</Label>
            <Input
              {...form.register('ctaLabel')}
              placeholder="ex : Découvrir le module"
            />
            {form.formState.errors.ctaLabel && (
              <p className="text-xs text-red-500">{form.formState.errors.ctaLabel.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input
              type="number"
              min={0}
              {...form.register('order', { valueAsNumber: true })}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Les stories sont triées par ordre croissant (0 = en premier).</p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Enregistrement...
              </span>
            ) : (
              mode === 'create' ? '✓ Créer la mise en avant' : '✓ Enregistrer les modifications'
            )}
          </Button>
          {mode === 'edit' && (
            <Button
              variant="destructive"
              type="button"
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
              onClick={handleDelete}
            >
              Supprimer cette mise en avant
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
