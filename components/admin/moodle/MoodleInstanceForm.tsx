
"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { moodleInstanceSchema, MoodleInstanceFormData } from '../../../schemas/moodle';
import { adminApi } from '../../../services/adminApi';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';

interface Props {
  mode: "create"|"edit";
  id?: string;
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

export function MoodleInstanceForm({ mode, id, initialData, onSave }: Props){
  const form = useForm<MoodleInstanceFormData>({ 
    resolver: zodResolver(moodleInstanceSchema), 
    defaultValues: initialData || { name: "", baseUrl: "" } 
  });

  async function onSubmit(values: MoodleInstanceFormData){
    try {
        if (mode === 'create') {
            await adminApi.createMoodleInstance(values);
        } else {
            await adminApi.updateMoodleInstance(id!, values);
        }
        onSave();
    } catch (e) {
        alert('Error saving instance');
    }
  }

  async function onDelete(){
    if (!id || !confirm('Supprimer cette instance ?')) return;
    await adminApi.deleteMoodleInstance(id);
    onSave();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Nom</Label>
          <Input {...form.register('name')} />
          {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <Label>Base URL</Label>
          <Input placeholder="https://moodle.exemple.org" {...form.register('baseUrl')} />
           {form.formState.errors.baseUrl && <p className="text-sm text-red-500">{form.formState.errors.baseUrl.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="rounded-2xl">Enregistrer</Button>
        {mode==='edit' && <Button type="button" variant="destructive" className="rounded-2xl" onClick={onDelete}>Supprimer</Button>}
      </div>
    </form>
  );
}
