
"use client";
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { moduleFormSchema, ModuleFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import { motion, AnimatePresence } from 'motion/react';

interface ModuleFormProps {
  mode: "create"|"edit";
  initialData?: any;
  onSave: () => void;
}

const zodResolver = (schema: any) => async (data: any) => {
  try {
    const values = await schema.parseAsync(data);
    return { values, errors: {} };
  } catch (error: any) {
    if (error.flatten) {
      const fieldErrors = error.flatten().fieldErrors;
      const formattedErrors = Object.keys(fieldErrors).reduce((acc: any, key) => {
        acc[key] = { message: fieldErrors[key][0] };
        return acc;
      }, {});
      return { values: {}, errors: formattedErrors };
    }
    return { values: {}, errors: { root: { message: error.message } } };
  }
};

export function ModuleForm({ mode, initialData, onSave }: ModuleFormProps){
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        level: initialData.level ?? null,
        language: initialData.language ?? null,
        objectives: initialData.objectives ?? [],
        tags: initialData.tags ?? [],
        eventIds: initialData.eventIds ?? [],
        creatorIds: initialData.creators?.map((c: any) => c.id) ?? [],
        sponsorIds: initialData.sponsors?.map((s: any) => s.id) ?? [],
        sections: initialData.sections ?? [],
        moduleType: initialData.moduleType ?? 'internal',
        moodleCourseUrl: initialData.moodleCourseUrl ?? null,
    } : {
        title: "", slug: "", summary: "", objectives: [""], level: 'Débutant',
        tags: [], eventIds: [], creatorIds: [], sponsorIds: [], sections: [],
        moduleType: 'internal',
        moodleCourseUrl: "",
    }
  });

  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: "sections"
  });
  
  const { fields: objectives, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "objectives" as any
  });

  const moduleType = form.watch('moduleType');

  async function onSubmit(values: ModuleFormData){
    setIsSaving(true);
    try {
        if (mode === 'create') {
            await adminApi.createModule(values);
        } else {
            await adminApi.updateModule(initialData.id, values);
        }
        onSave();
    } catch (error) {
        console.error("Erreur lors de l’enregistrement", error);
        alert("Erreur lors de l’enregistrement");
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (confirm('Supprimer ce module ?')) {
        await adminApi.deleteModule(initialData.id);
        onSave();
    }
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{mode === 'create' ? 'Nouveau Module' : 'Modifier le Module'}</h1>
          <p className="text-muted-foreground">Configurez les détails pédagogiques et les leçons.</p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE : INFOS GÉNÉRALES */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <h3 className="font-bold text-secondary flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
                Informations Générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du module</Label>
                  <Input id="title" {...form.register('title')} placeholder="ex: Introduction à l'Histoire du Mali" />
                  {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input id="slug" {...form.register('slug')} placeholder="introduction-histoire-mali" />
                  {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Résumé / Description</Label>
                <Textarea id="summary" rows={4} {...form.register('summary')} placeholder="Décrivez brièvement le contenu et les enjeux de ce module..." />
                {form.formState.errors.summary && <p className="text-xs text-red-500">{form.formState.errors.summary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Objectifs d'apprentissage</Label>
                <div className="space-y-2">
                  {objectives.map((field, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={field.id} 
                      className="flex gap-2"
                    >
                      <Input {...form.register(`objectives.${index}` as any)} placeholder={`Objectif ${index + 1}`} />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeObjective(index)}>
                        <XIcon className="h-4 w-4"/>
                      </Button>
                    </motion.div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendObjective("" as any)}>
                  + Ajouter un objectif
                </Button>
                {form.formState.errors.objectives && <p className="text-xs text-red-500">{form.formState.errors.objectives.message}</p>}
              </div>
            </div>

            {/* SECTIONS & LEÇONS (Si Interne) */}
            {moduleType === 'internal' && (
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-secondary flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">2</span>
                    Contenu du cours (Sections)
                  </h3>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendSection({ title: "", order: sections.length, lessons: [] })}>
                    + Ajouter une section
                  </Button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {sections.map((section, sectionIndex) => (
                      <motion.div 
                        key={section.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 border border-muted rounded-xl bg-muted/5 space-y-4"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="flex-1 space-y-2">
                            <Label>Titre de la section</Label>
                            <Input placeholder="ex: Les origines de l'Empire" {...form.register(`sections.${sectionIndex}.title` as const)} />
                          </div>
                          <div className="w-20 space-y-2">
                            <Label>Ordre</Label>
                            <Input type="number" {...form.register(`sections.${sectionIndex}.order` as const, { valueAsNumber: true })} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="mt-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeSection(sectionIndex)}>
                            <XIcon className="h-4 w-4"/>
                          </Button>
                        </div>
                        
                        <div className="pl-6 border-l-2 border-primary/20 space-y-4">
                          <LessonsArray sectionIndex={sectionIndex} control={form.control} register={form.register} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {sections.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl">
                      <p className="text-muted-foreground text-sm italic">Aucune section définie pour le moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : CONFIGURATION & MÉTA */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-6">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Type de Module</Label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('moduleType', 'internal')}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      moduleType === 'internal' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="font-bold text-sm">Interne</span>
                    <span className="text-[10px] text-muted-foreground">Leçons gérées directement dans Kasuku</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('moduleType', 'moodle')}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      moduleType === 'moodle' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="font-bold text-sm">Moodle LTI</span>
                    <span className="text-[10px] text-muted-foreground">Lien vers un cours externe sur Moodle</span>
                  </button>
                </div>
              </div>

              {moduleType === 'moodle' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-2 border-t border-muted"
                >
                  <Label htmlFor="moodleCourseUrl">URL du cours Moodle</Label>
                  <Input id="moodleCourseUrl" placeholder="https://moodle.example.com/course/view.php?id=..." {...form.register('moodleCourseUrl')} />
                  {form.formState.errors.moodleCourseUrl && <p className="text-xs text-red-500">{form.formState.errors.moodleCourseUrl.message}</p>}
                </motion.div>
              )}

              <div className="space-y-4 pt-4 border-t border-muted">
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <select className="input bg-white" {...form.register('level')}>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <select className="input bg-white" {...form.register('language')}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Durée estimée (min)</Label>
                  <Input type="number" {...form.register('durationMin', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Miniature (URL)</Label>
                  <Input placeholder="https://..." {...form.register('thumbnail')} />
                </div>
              </div>
            </div>

            <div className="bg-secondary p-6 rounded-2xl text-white space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider">Actions</h3>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white border-none"
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : mode === 'create' ? 'Créer le module' : 'Mettre à jour'}
              </Button>
              {mode === 'edit' && (
                <Button 
                  variant="destructive" 
                  type="button" 
                  className="w-full bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                  onClick={handleDelete}
                >
                  Supprimer le module
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const LessonsArray = ({ sectionIndex, control, register }: { sectionIndex: number; control: any; register: any; }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.lessons` as any
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Leçons</h4>
        <Button type="button" size="sm" variant="ghost" className="text-primary h-7 text-[10px]" onClick={() => append({ title: "", order: fields.length, type: "video" })}>
          + Ajouter une leçon
        </Button>
      </div>
      
      <AnimatePresence>
        {fields.map((lesson, lessonIndex) => (
          <motion.div 
            key={lesson.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-3 bg-white border border-muted rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-5 space-y-1">
              <Label className="text-[10px]">Titre de la leçon</Label>
              <Input placeholder="Titre" {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.title` as const)} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px]">Type</Label>
              <select className="input h-10 text-sm" {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.type` as const)}>
                <option value="video">Vidéo</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px]">Durée (min)</Label>
              <Input type="number" {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.durationMin` as const, { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px]">Ordre</Label>
              <Input type="number" {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.order` as const, { valueAsNumber: true })} />
            </div>
            <div className="md:col-span-1">
              <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => remove(lessonIndex)}>
                <XIcon className="h-4 w-4"/>
              </Button>
            </div>
            <div className="md:col-span-12 space-y-1">
              <Label className="text-[10px]">URL du média (optionnel)</Label>
              <Input placeholder="https://..." {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.url` as const)} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {fields.length === 0 && (
        <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucune leçon dans cette section.</p>
      )}
    </div>
  );
};

