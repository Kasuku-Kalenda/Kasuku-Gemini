
"use client";
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventFormSchema, EventFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import type { TimelineNarrative } from '../../types';

interface EventFormProps {
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

export function EventForm({ mode, initialData, onSave }: EventFormProps){
  const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
  
  const [themes, setThemes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData ? {
        title: initialData.title,
        slug: initialData.slug,
        summary: initialData.summary,
        dateISO: initialData.dateISO,
        year: initialData.year,
        period: initialData.period,
        countryCode: initialData.countryCode,
        themeIds: initialData.themes?.map((t:any)=>t.id) ?? [],
        media: initialData.media ?? [],
        sources: initialData.sources ?? [],
        timelineId: initialData.timelineId ?? null,
        timelineMomentId: initialData.timelineMomentId ?? null
    } : { title: "", slug: "", summary: "", themeIds: [], media: [], sources: [] }
  });

  const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({ control: form.control, name: "media" });
  const { fields: sourcesFields, append: appendSource, remove: removeSource } = useFieldArray({ control: form.control, name: "sources" });

  useEffect(() => {
    adminApi.listTimelines().then(res => setTimelines(res.items));
    adminApi.listThemes().then(res => setThemes(res.items));
  }, []);

  const selectedTimelineId = form.watch('timelineId');
  const selectedTimeline = timelines.find(t => t.id === selectedTimelineId);
  const selectedThemeIds = form.watch('themeIds') || [];

  const toggleTheme = (id: string) => {
    const current = form.getValues('themeIds');
    if (current.includes(id)) {
      form.setValue('themeIds', current.filter(t => t !== id));
    } else {
      form.setValue('themeIds', [...current, id]);
    }
  };

  async function onSubmit(values: EventFormData){
    setIsSaving(true);
    try {
        if (mode === 'create') {
            await adminApi.createEvent(values);
        } else {
            await adminApi.updateEvent(initialData.id, values);
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
    if (confirm('Supprimer cet événement ?')) {
        await adminApi.deleteEvent(initialData.id);
        onSave();
    }
  };

  return (
    <div className="container py-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">{mode === 'create' ? 'Créer un événement' : 'Éditer un événement'}</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* LIEN TIMELINE */}
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
            <h3 className="font-bold text-secondary text-sm uppercase tracking-wider flex items-center gap-2">
                🧭 Lien vers un Parcours (Timeline)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Timeline associée</Label>
                    <select className="input bg-white" {...form.register('timelineId')}>
                        <option value="">Aucune timeline</option>
                        {timelines.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Moment spécifique (optionnel)</Label>
                    <select className="input bg-white" {...form.register('timelineMomentId')} disabled={!selectedTimelineId}>
                        <option value="">Début du parcours</option>
                        {selectedTimeline?.moments?.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                </div>
            </div>
            {!selectedTimelineId && <p className="text-[10px] text-muted-foreground italic">Cet événement ne proposera pas l'option "Découvrir le parcours associé".</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register('slug')} />
            {form.formState.errors.slug && <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Résumé</Label>
          <Textarea id="summary" rows={6} {...form.register('summary')} />
          {form.formState.errors.summary && <p className="text-sm text-red-500">{form.formState.errors.summary.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="dateISO">Date ISO</Label>
            <Input id="dateISO" placeholder="YYYY-MM-DD" {...form.register('dateISO')} />
             {form.formState.errors.dateISO && <p className="text-sm text-red-500">{form.formState.errors.dateISO.message}</p>}
          </div>
          <div>
            <Label htmlFor="year">Année</Label>
            <Input id="year" type="number" {...form.register('year', { setValueAs: (v) => v ? parseInt(v, 10) : null })} />
          </div>
          <div>
            <Label htmlFor="period">Période</Label>
            <Input id="period" {...form.register('period')} />
          </div>
        </div>
          <div>
            <Label htmlFor="countryCode">Pays (ISO-2)</Label>
            <Input id="countryCode" maxLength={2} {...form.register('countryCode')} placeholder="ex: SN" />
            {form.formState.errors.countryCode && <p className="text-sm text-red-500">{form.formState.errors.countryCode.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Thèmes</Label>
            <div className="flex flex-wrap gap-2">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    selectedThemeIds.includes(theme.id)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-muted-foreground border-muted hover:border-primary/50'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
            {form.formState.errors.themeIds && <p className="text-sm text-red-500">{form.formState.errors.themeIds.message}</p>}
          </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Médias</h3>
            <Button type="button" size="sm" onClick={() => appendMedia({ type:'image', url:'', caption:'', credit:'' })}>+ Ajouter</Button>
          </div>
          <div className="space-y-2 mt-2">
            {mediaFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded-xl p-3">
                 <select className="input" {...form.register(`media.${index}.type` as const)}>
                  <option value="image">image</option>
                  <option value="video">video</option>
                </select>
                <Input className="md:col-span-2" placeholder="URL" {...form.register(`media.${index}.url` as const)} />
                <Input placeholder="Légende" {...form.register(`media.${index}.caption` as const)} />
                <Input placeholder="Crédit" {...form.register(`media.${index}.credit` as const)} />
                <Button type="button" variant="outline" onClick={() => removeMedia(index)}>Retirer</Button>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Sources</h3>
            <Button type="button" size="sm" onClick={() => appendSource({ label:'', url:'' })}>+ Ajouter</Button>
          </div>
          <div className="space-y-2 mt-2">
            {sourcesFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded-xl p-3">
                <Input className="md:col-span-1" placeholder="Label" {...form.register(`sources.${index}.label` as const)} />
                <Input className="md:col-span-2" placeholder="URL" {...form.register(`sources.${index}.url` as const)} />
                <Button type="button" variant="outline" onClick={() => removeSource(index)}>Retirer</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit">Enregistrer</Button>
          {mode === 'edit' && (
            <Button variant="destructive" type="button" onClick={handleDelete}>Supprimer</Button>
          )}
        </div>
      </form>
    </div>
  );
}
