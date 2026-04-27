
"use client";
/**
 * ThemeForm — create / edit a theme with name, slug, color and emoji.
 * Belongs to: modules/calendar (themes are event categories)
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { themeFormSchema, type ThemeFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface ThemeFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Preset colors — cultural / editorial palette
const PRESET_COLORS = [
  '#E57C3C', '#D4A843', '#4CAF7D', '#2196C4', '#7C4DFF',
  '#E91E8C', '#F44336', '#009688', '#795548', '#607D8B',
  '#FF7043', '#66BB6A', '#42A5F5', '#AB47BC', '#26C6DA',
  '#8D6E63', '#546E7A', '#EC407A', '#FFA726', '#26A69A',
];

// Common theme emojis
const PRESET_EMOJIS = [
  '🎵', '🎨', '📚', '⚽', '🌍', '🏛️', '💃', '🎭', '🌿', '✊',
  '🔬', '💡', '🎬', '🏆', '🌱', '🎤', '📖', '🕌', '🎺', '🪘',
];

export function ThemeForm({ mode, initialData, onSave }: ThemeFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [slugAuto, setSlugAuto] = useState(mode === 'create');

  const form = useForm<ThemeFormData>({
    resolver: zodResolver(themeFormSchema) as any,
    defaultValues: {
      name: initialData?.name ?? '',
      slug: initialData?.slug ?? '',
      color: initialData?.color ?? '#6B7280',
      emoji: initialData?.emoji ?? '',
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedName = watch('name');
  const watchedColor = watch('color');
  const watchedEmoji = watch('emoji');

  // Auto-slug from name
  useEffect(() => {
    if (slugAuto && watchedName) {
      setValue('slug', toSlug(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugAuto, setValue]);

  const onSubmit = async (values: ThemeFormData) => {
    setIsSaving(true);
    try {
      if (mode === 'create') {
        await adminApi.createTheme(values);
      } else {
        await adminApi.updateTheme(initialData.id, values);
      }
      onSave();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Header with live preview badge */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md transition-all duration-200"
            style={{ backgroundColor: watchedColor || '#6B7280' }}
          >
            {watchedEmoji || (watchedName?.[0]?.toUpperCase() ?? '?')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary">
              {mode === 'create' ? 'Nouveau thème' : 'Modifier le thème'}
            </h1>
            <p className="text-xs text-muted-foreground">Catégorie d'événements</p>
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-3xl border border-muted shadow-sm">

        {/* Name */}
        <div className="space-y-2">
          <Label>Nom du thème *</Label>
          <Input {...register('name')} placeholder="ex : Musique africaine" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label>
            Slug (URL)
            {slugAuto && (
              <span className="ml-2 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">AUTO</span>
            )}
          </Label>
          <Input
            {...register('slug')}
            placeholder="musique-africaine"
            onChange={e => { setSlugAuto(false); setValue('slug', e.target.value, { shouldValidate: true }); }}
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        {/* Color */}
        <div className="space-y-3">
          <Label>Couleur du thème</Label>
          {/* Preset swatches */}
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setValue('color', c, { shouldValidate: true })}
                className="w-7 h-7 rounded-lg transition-all hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: c,
                  outline: watchedColor === c ? `3px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  boxShadow: watchedColor === c ? '0 0 0 1px white inset' : undefined,
                }}
              />
            ))}
          </div>
          {/* Custom picker + hex input */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={watchedColor || '#6B7280'}
              onChange={e => setValue('color', e.target.value, { shouldValidate: true })}
              className="w-10 h-10 rounded-xl border border-muted cursor-pointer p-0.5 bg-white"
            />
            <Input
              value={watchedColor || ''}
              onChange={e => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                  setValue('color', v, { shouldValidate: v.length === 7 });
                }
              }}
              placeholder="#E57C3C"
              className="font-mono w-32 h-10"
            />
            <div
              className="flex-1 h-10 rounded-xl border border-muted transition-colors duration-200"
              style={{ backgroundColor: watchedColor || '#6B7280' }}
            />
          </div>
          {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
        </div>

        {/* Emoji */}
        <div className="space-y-3">
          <Label>Emoji (optionnel)</Label>
          <div className="grid grid-cols-10 gap-1.5">
            {PRESET_EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setValue('emoji', watchedEmoji === em ? '' : em, { shouldValidate: false })}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all hover:scale-110 ${
                  watchedEmoji === em
                    ? 'border-primary bg-primary/10 shadow-sm scale-110'
                    : 'border-transparent hover:border-muted bg-muted/30'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              {...register('emoji')}
              placeholder="Ou tapez votre emoji…"
              className="w-48"
              maxLength={4}
            />
            {watchedEmoji && (
              <button type="button" onClick={() => setValue('emoji', '')}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
                ✕ Effacer
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <Button type="submit" className="w-full h-12 font-bold" disabled={isSaving}>
            {isSaving ? '⏳ Enregistrement…' : mode === 'create' ? '✓ Créer le thème' : '✓ Mettre à jour'}
          </Button>
          {mode === 'edit' && (
            <Button
              type="button" variant="destructive"
              className="w-full h-11 bg-red-500/10 text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
              onClick={async () => {
                if (!confirm(`Supprimer le thème "${initialData?.name}" ?`)) return;
                await adminApi.deleteTheme(initialData.id);
                onSave();
              }}>
              Supprimer ce thème
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
