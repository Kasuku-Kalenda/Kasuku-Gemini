
"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { themeFormSchema, ThemeFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface ThemeFormProps {
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

export function ThemeForm({ mode, initialData, onSave }: ThemeFormProps){
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ThemeFormData>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: initialData || { name: "", slug: "" }
  });

  async function onSubmit(values: ThemeFormData){
    setIsSaving(true);
    try {
        if (mode === 'create') {
            await adminApi.createTheme(values);
        } else {
            await adminApi.updateTheme(initialData.id, values);
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
    <div className="container py-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-secondary">{mode === 'create' ? 'Nouveau Thème' : 'Modifier le Thème'}</h1>
        <Button variant="outline" size="sm" onClick={onSave}>Annuler</Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-3xl border border-muted shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du thème</Label>
          <Input id="name" {...register('name')} placeholder="ex: Musique" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" {...register('slug')} placeholder="musique" />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}

