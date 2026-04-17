import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { EventSchema, type EventFormData, type EventFormInput } from '../../lib/validations/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface AdminEventEditorProps {
  initialData?: Partial<EventFormData> | null;
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
  onCancel?: () => void;
}

/**
 * Composant de formulaire pour l'édition d'événements.
 * Logic-Free : Reçoit les données et les callbacks via props.
 */
export const AdminEventEditor: React.FC<AdminEventEditorProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  error = null,
  onCancel,
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInput>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      themes: initialData?.themes || [],
      media: initialData?.media || [],
      sources: initialData?.sources || [],
      dateISO: initialData?.dateISO || '',
      year: initialData?.year || undefined,
      countryCode: initialData?.countryCode || '',
      timelineId: initialData?.timelineId || '',
      timelineMomentId: initialData?.timelineMomentId || '',
      timelineSlug: initialData?.timelineSlug || '',
    },
  });

  // Gestion des tableaux dynamiques (Media et Sources)
  const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({
    control,
    name: 'media',
  });

  const { fields: sourceFields, append: appendSource, remove: removeSource } = useFieldArray({
    control,
    name: 'sources',
  });

  const onFormSubmit = async (data: EventFormInput) => {
    try {
      await onSubmit(data as EventFormData);
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-muted-foreground">Chargement de l'événement...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 max-w-4xl mx-auto pb-12">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
          <p className="font-bold">Erreur</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-dark">
            {initialData?.id ? 'Modifier l\'Événement' : 'Nouvel Événement'}
          </h1>
          <p className="text-muted-foreground">Remplissez les informations détaillées de l'événement culturel.</p>
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-full px-6">
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="rounded-full px-8">
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations Générales */}
        <Card className="md:col-span-2 rounded-[2rem] shadow-soft border-none bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
                <Input {...register('title')} placeholder="Ex: L'Indépendance du Congo" className="rounded-xl" />
                {errors.title && <p className="text-xs text-destructive font-medium">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Slug (URL)</label>
                <Input {...register('slug')} placeholder="ex: independance-congo" className="rounded-xl" />
                {errors.slug && <p className="text-xs text-destructive font-medium">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Résumé</label>
              <Textarea
                {...register('summary')}
                className="min-h-[100px] rounded-xl"
                placeholder="Décrivez brièvement l'événement..."
              />
              {errors.summary && <p className="text-xs text-destructive font-medium">{errors.summary.message}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date (YYYY-MM-DD)</label>
                <Input {...register('dateISO')} placeholder="1960-06-30" className="rounded-xl" />
                {errors.dateISO && <p className="text-xs text-destructive font-medium">{errors.dateISO.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Année</label>
                <Input {...register('year', { valueAsNumber: true })} type="number" placeholder="1960" className="rounded-xl" />
                {errors.year && <p className="text-xs text-destructive font-medium">{errors.year.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pays (Code ISO)</label>
                <Input {...register('countryCode')} placeholder="CD" maxLength={2} className="rounded-xl" />
                {errors.countryCode && <p className="text-xs text-destructive font-medium">{errors.countryCode.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Médias */}
        <Card className="rounded-[2rem] shadow-soft border-none bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Médias</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendMedia({ type: 'image', url: '' })}
              className="rounded-full h-8 w-8 p-0"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mediaFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 border rounded-2xl relative bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      {...register(`media.${index}.type`)}
                      className="p-2 rounded-lg border bg-background text-xs font-bold"
                    >
                      <option value="image">Image</option>
                      <option value="video">Vidéo</option>
                    </select>
                    <Input
                      {...register(`media.${index}.url`)}
                      placeholder="URL du média"
                      className="flex-1 rounded-lg h-9 text-xs"
                    />
                  </div>
                  <Input
                    {...register(`media.${index}.caption`)}
                    placeholder="Légende"
                    className="rounded-lg h-9 text-xs"
                  />
                  {errors.media?.[index]?.url && (
                    <p className="text-[10px] text-destructive font-medium">{errors.media[index].url.message}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {mediaFields.length === 0 && (
              <p className="text-center py-6 text-muted-foreground text-sm italic">Aucun média ajouté.</p>
            )}
          </CardContent>
        </Card>

        {/* Sources */}
        <Card className="rounded-[2rem] shadow-soft border-none bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Sources</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSource({ label: '', url: '' })}
              className="rounded-full h-8 w-8 p-0"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 border rounded-2xl relative bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <div className="space-y-3">
                  <Input
                    {...register(`sources.${index}.label`)}
                    placeholder="Nom de la source (ex: Wikipedia)"
                    className="rounded-lg h-9 text-xs"
                  />
                  <Input
                    {...register(`sources.${index}.url`)}
                    placeholder="URL de la source"
                    className="rounded-lg h-9 text-xs"
                  />
                  {errors.sources?.[index]?.url && (
                    <p className="text-[10px] text-destructive font-medium">{errors.sources[index].url.message}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {sourceFields.length === 0 && (
              <p className="text-center py-6 text-muted-foreground text-sm italic">Aucune source ajoutée.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
