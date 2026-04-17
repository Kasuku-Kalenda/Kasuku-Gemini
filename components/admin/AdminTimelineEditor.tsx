import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TimelineNarrativeSchema, type TimelineFormData, type TimelineFormInput } from '../../lib/validations/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PlusIcon, Trash2Icon, GripVerticalIcon } from 'lucide-react';

interface AdminTimelineEditorProps {
  initialData?: any;
  onSubmit: (data: TimelineFormData) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  onCancel: () => void;
}

export const AdminTimelineEditor: React.FC<AdminTimelineEditorProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isSaving,
  onCancel
}) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<TimelineFormInput>({
    resolver: zodResolver(TimelineNarrativeSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      title: initialData?.title || '',
      subtitle: initialData?.subtitle || '',
      type: initialData?.type || 'evenement',
      shortDescription: initialData?.shortDescription || '',
      longDescription: initialData?.longDescription || '',
      thumbnail: initialData?.thumbnail || '',
      periodLabel: initialData?.periodLabel || '',
      status: initialData?.status || 'draft',
      moments: initialData?.moments || []
    }
  });

  const { fields: momentFields, append: appendMoment, remove: removeMoment } = useFieldArray({
    control,
    name: "moments"
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse">Chargement de la timeline...</div>;

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as TimelineFormData))} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 border-b">
        <h2 className="text-2xl font-bold">Édition du Parcours (Timeline)</h2>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer le parcours"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <Input {...register('title')} placeholder="Titre du parcours" />
                  {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input {...register('slug')} placeholder="slug-du-parcours" />
                  {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sous-titre (Optionnel)</label>
                <Input {...register('subtitle')} placeholder="Un court sous-titre" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description Courte</label>
                <Textarea {...register('shortDescription')} rows={3} placeholder="Résumé pour les cartes..." />
                {errors.shortDescription && <p className="text-xs text-red-500">{errors.shortDescription.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Moments Clés</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => appendMoment({ title: '', narrative: '', timeType: 'date', position: momentFields.length, media: [] })}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Ajouter un moment
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {momentFields.map((moment, mIndex) => (
                <div key={moment.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <GripVerticalIcon className="w-5 h-5 text-muted-foreground cursor-move" />
                    <Input 
                      {...register(`moments.${mIndex}.title` as const)} 
                      placeholder="Titre du moment" 
                      className="bg-background"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMoment(mIndex)}>
                      <Trash2Icon className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Textarea 
                    {...register(`moments.${mIndex}.narrative` as const)} 
                    placeholder="Récit de ce moment..." 
                    className="bg-background"
                  />
                </div>
              ))}
              {momentFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Aucun moment défini. Ajoutez les étapes clés de ce parcours.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de Parcours</label>
                <select 
                  {...register('type')} 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="evenement">Événement Historique</option>
                  <option value="personnage">Personnage Illustre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label de Période</label>
                <Input {...register('periodLabel')} placeholder="Ex: 1950 - 1960" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <select 
                  {...register('status')} 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL de la Miniature</label>
                <Input {...register('thumbnail')} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};
