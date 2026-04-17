
"use client";
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { timelineFormSchema, TimelineFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { motion, AnimatePresence } from 'motion/react';

interface TimelineFormProps {
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

export function TimelineForm({ mode, initialData, onSave }: TimelineFormProps){
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<TimelineFormData>({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: initialData ? {
        title: initialData.title,
        subtitle: initialData.subtitle,
        slug: initialData.slug,
        type: initialData.type,
        shortDescription: initialData.shortDescription,
        longDescription: initialData.longDescription,
        thumbnail: initialData.thumbnail,
        periodLabel: initialData.periodLabel,
        status: initialData.status,
        moments: initialData.moments ?? []
    } : { 
        title: "", 
        slug: "", 
        type: "personnage", 
        shortDescription: "", 
        thumbnail: "", 
        periodLabel: "", 
        status: "draft", 
        moments: [] 
    }
  });

  const { fields: momentsFields, append: appendMoment, remove: removeMoment, move: moveMoment } = useFieldArray({ 
    control: form.control, 
    name: "moments" 
  });

  async function onSubmit(values: TimelineFormData){
    setIsSaving(true);
    try {
        if (mode === 'create') {
            await adminApi.createTimeline(values);
        } else {
            await adminApi.updateTimeline(initialData.id, values);
        }
        onSave();
    } catch (error) {
        console.error("Erreur lors de l’enregistrement", error);
        alert("Erreur lors de l’enregistrement");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? '✨ Nouveau Parcours' : '✏️ Éditer le Parcours'}
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onSave}>Annuler</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne Gauche : Infos de base */}
            <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Titre du parcours</Label>
                        <Input {...form.register('title')} placeholder="ex: Nelson Mandela" />
                        {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (URL)</Label>
                        <Input {...form.register('slug')} placeholder="ex: nelson-mandela" />
                        {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Sous-titre (optionnel)</Label>
                    <Input {...form.register('subtitle')} placeholder="ex: Un long chemin vers la liberté" />
                </div>

                <div className="space-y-2">
                    <Label>Description courte (max 200 car.)</Label>
                    <Textarea {...form.register('shortDescription')} rows={3} />
                    {form.formState.errors.shortDescription && <p className="text-xs text-red-500">{form.formState.errors.shortDescription.message}</p>}
                </div>
            </div>

            {/* Colonne Droite : Config & Image */}
            <div className="space-y-4 p-6 bg-muted/30 rounded-[2rem] border">
                <div className="space-y-2">
                    <Label>Image de couverture (URL)</Label>
                    <Input {...form.register('thumbnail')} />
                    {form.watch('thumbnail') && (
                        <img src={form.watch('thumbnail')} alt="" className="w-full aspect-video rounded-xl object-cover mt-2 border" />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <select className="input" {...form.register('type')}>
                            <option value="personnage">Personnage</option>
                            <option value="evenement">Événement</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Statut</Label>
                        <select className="input" {...form.register('status')}>
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Label de période</Label>
                    <Input {...form.register('periodLabel')} placeholder="ex: 1918 - 2013" />
                </div>
            </div>
        </div>

        {/* MOMENTS DYNAMIQUES */}
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                    🎬 Moments du récit
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {momentsFields.length}
                    </span>
                </h2>
                <Button type="button" size="sm" onClick={() => appendMoment({ 
                    title: "", 
                    narrative: "", 
                    timeType: "date", 
                    position: momentsFields.length,
                    media: []
                })}>
                    + Ajouter un moment
                </Button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {momentsFields.map((field, index) => (
                        <motion.div 
                            key={field.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 border rounded-[2rem] bg-card shadow-soft relative group"
                        >
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => index > 0 && moveMoment(index, index - 1)} className="w-6 h-6 bg-white border rounded-full shadow-sm flex items-center justify-center text-[10px]">▲</button>
                                <button type="button" onClick={() => index < momentsFields.length - 1 && moveMoment(index, index + 1)} className="w-6 h-6 bg-white border rounded-full shadow-sm flex items-center justify-center text-[10px]">▼</button>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <Input 
                                        {...form.register(`moments.${index}.title` as const)} 
                                        className="font-bold text-lg border-none bg-transparent p-0 focus:ring-0 h-auto w-auto min-w-[300px]" 
                                        placeholder="Titre du moment..."
                                    />
                                </div>
                                <Button type="button" variant="destructive" size="sm" className="rounded-full w-8 h-8 p-0" onClick={() => removeMoment(index)}>
                                    🗑️
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-3 space-y-4">
                                    <Textarea 
                                        {...form.register(`moments.${index}.narrative` as const)} 
                                        placeholder="Racontez ce moment du récit..."
                                        rows={4}
                                        className="rounded-2xl"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black">Type de temps</Label>
                                            <select className="input text-xs" {...form.register(`moments.${index}.timeType` as const)}>
                                                <option value="date">Date précise</option>
                                                <option value="period">Période / Année</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black">Valeur temporelle</Label>
                                            {form.watch(`moments.${index}.timeType`) === 'date' ? (
                                                <Input {...form.register(`moments.${index}.dateExact` as const)} placeholder="YYYY-MM-DD" />
                                            ) : (
                                                <Input {...form.register(`moments.${index}.periodText` as const)} placeholder="ex: Été 1944" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] uppercase font-black">Média principal (URL)</Label>
                                    <Input {...form.register(`moments.${index}.media.0.url` as const)} placeholder="Image URL" />
                                    {form.watch(`moments.${index}.media.0.url`) && (
                                        <img src={form.watch(`moments.${index}.media.0.url`)} alt="" className="w-full aspect-square rounded-2xl object-cover border" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {momentsFields.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed rounded-[2rem] bg-muted/10">
                        <p className="text-muted-foreground">Commencez par ajouter le premier moment de votre récit.</p>
                        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => appendMoment({ 
                            title: "", 
                            narrative: "", 
                            timeType: "date", 
                            position: 0,
                            media: []
                        })}>
                            + Ajouter un moment
                        </Button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-8">
            <Button variant="outline" type="button" onClick={onSave}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer le parcours'}
            </Button>
        </div>
      </form>
    </div>
  );
}
