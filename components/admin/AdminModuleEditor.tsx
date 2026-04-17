import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrainingModuleSchema, type TrainingModuleFormData, type TrainingModuleFormInput } from '../../lib/validations/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PlusIcon, Trash2Icon, GripVerticalIcon } from 'lucide-react';

interface AdminModuleEditorProps {
  initialData?: any;
  onSubmit: (data: TrainingModuleFormData) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  onCancel: () => void;
}

export const AdminModuleEditor: React.FC<AdminModuleEditorProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isSaving,
  onCancel
}) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<TrainingModuleFormInput>({
    resolver: zodResolver(TrainingModuleSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      objectives: initialData?.objectives || [],
      tags: initialData?.tags || [],
      sections: initialData?.sections || [],
      moduleType: initialData?.moduleType || 'internal',
      durationMin: initialData?.durationMin || null,
      level: initialData?.level || null,
      language: initialData?.language || '',
      thumbnail: initialData?.thumbnail || '',
      moodleCourseUrl: initialData?.moodleCourseUrl || '',
      eventIds: initialData?.eventIds || [],
    }
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "sections"
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse">Chargement du module...</div>;

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as TrainingModuleFormData))} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 border-b">
        <h2 className="text-2xl font-bold">Édition du Module de Formation</h2>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer le module"}
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
                  <Input {...register('title')} placeholder="Ex: Introduction à la culture..." />
                  {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input {...register('slug')} placeholder="intro-culture" />
                  {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Résumé</label>
                <Textarea {...register('summary')} rows={4} placeholder="Description du module..." />
                {errors.summary && <p className="text-xs text-red-500">{errors.summary.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Structure du Cours (Sections)</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => appendSection({ title: '', order: sectionFields.length, lessons: [] })}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Ajouter une section
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {sectionFields.map((section, sIndex) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <GripVerticalIcon className="w-5 h-5 text-muted-foreground cursor-move" />
                    <Input 
                      {...register(`sections.${sIndex}.title` as const)} 
                      placeholder="Titre de la section" 
                      className="bg-background"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(sIndex)}>
                      <Trash2Icon className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  {/* Note: Nested field arrays for lessons could be added here for more complexity */}
                </div>
              ))}
              {sectionFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Aucune section définie. Commencez par en ajouter une.
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
                <label className="text-sm font-medium">Niveau</label>
                <select 
                  {...register('level')} 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durée (minutes)</label>
                <Input type="number" {...register('durationMin', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de Module</label>
                <select 
                  {...register('moduleType')} 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="internal">Interne (Kasuku)</option>
                  <option value="moodle">Moodle Externe</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Moodle (si externe)</label>
                <Input {...register('moodleCourseUrl')} placeholder="https://moodle..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};
