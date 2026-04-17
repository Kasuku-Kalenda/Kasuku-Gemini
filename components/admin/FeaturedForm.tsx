
"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { featuredFormSchema, FeaturedFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

interface FeaturedFormProps {
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

export function FeaturedForm({ mode, initialData, onSave }: FeaturedFormProps){
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  const form = useForm<FeaturedFormData>({
    resolver: zodResolver(featuredFormSchema),
    defaultValues: initialData ? {
        ...initialData
    } : { 
        title: "",
        subtitle: "",
        imageUrl: "",
        eventId: "",
        ctaLabel: "Découvrir",
        ctaTo: "",
        active: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        order: 0,
    }
  });

  useEffect(() => {
    adminApi.listEvents().then(res => setEvents(res.items));
    adminApi.listModules().then(res => setModules(res.items));
  }, []);

  async function onSubmit(values: FeaturedFormData){
    setIsSaving(true);
    try {
        if (mode === 'create') {
            await adminApi.createFeatured(values);
        } else {
            await adminApi.updateFeatured(initialData.id, values);
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
    if (confirm('Supprimer cet élément ?')) {
        await adminApi.deleteFeatured(initialData.id);
        onSave();
    }
  };

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{mode === 'create' ? 'Nouvelle Mise en Avant' : 'Modifier la Mise en Avant'}</h1>
          <p className="text-muted-foreground">Configurez l'élément qui apparaîtra en haut de la page d'accueil.</p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-3xl border border-muted shadow-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre principal</Label>
            <Input id="title" {...form.register('title')} placeholder="ex: Le Festival de Tombouctou" />
            {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtitle">Sous-titre / Description courte</Label>
            <Textarea id="subtitle" rows={3} {...form.register('subtitle')} placeholder="Un voyage au cœur de la culture malienne..." />
            {form.formState.errors.subtitle && <p className="text-xs text-red-500">{form.formState.errors.subtitle.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de l'image de fond</Label>
            <Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://..." />
            {form.formState.errors.imageUrl && <p className="text-xs text-red-500">{form.formState.errors.imageUrl.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-muted">
            <div className="space-y-2">
                <Label>Événement lié</Label>
                <select className="input bg-white" {...form.register('eventId')}>
                    <option value="">Sélectionner un événement</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                {form.formState.errors.eventId && <p className="text-xs text-red-500">{form.formState.errors.eventId.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>Module de destination (CTA)</Label>
                <select className="input bg-white" {...form.register('ctaTo')}>
                    <option value="">Sélectionner un module</option>
                    {modules.map(m => <option key={m.id} value={m.slug}>{m.title}</option>)}
                </select>
                {form.formState.errors.ctaTo && <p className="text-xs text-red-500">{form.formState.errors.ctaTo.message}</p>}
            </div>
        </div>
        
        <div className="space-y-2">
            <Label>Texte du bouton (CTA)</Label>
            <Input {...form.register('ctaLabel')} placeholder="ex: Découvrir le module" />
            {form.formState.errors.ctaLabel && <p className="text-xs text-red-500">{form.formState.errors.ctaLabel.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-muted">
             <div className="space-y-2">
                <Label>Date de début d'affichage</Label>
                <Input type="date" {...form.register('startDate')} />
                {form.formState.errors.startDate && <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>Date de fin d'affichage</Label>
                <Input type="date" {...form.register('endDate')} />
                {form.formState.errors.endDate && <p className="text-xs text-red-500">{form.formState.errors.endDate.message}</p>}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" {...form.register('order', { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="active" {...form.register('active')} className="h-5 w-5 rounded border-muted text-primary focus:ring-primary" />
                <Label htmlFor="active" className="cursor-pointer font-bold">Actif / Visible</Label>
            </div>
        </div>
        
        <div className="flex flex-col gap-3 pt-6 border-t border-muted">
          <Button type="submit" className="w-full h-12 text-lg" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          {mode === 'edit' && (
            <Button 
              variant="destructive" 
              type="button" 
              className="w-full bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
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

