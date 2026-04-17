
"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { moodleCourseSchema, MoodleCourseFormData } from '../../../schemas/moodle';
import { adminApi } from '../../../services/adminApi';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import type { MoodleInstance } from '../../../types';

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

export function MoodleCourseForm({ mode, id, initialData, onSave }: Props){
  const [instances, setInstances] = useState<MoodleInstance[]>([]);
  const form = useForm<MoodleCourseFormData>({
    resolver: zodResolver(moodleCourseSchema),
    defaultValues: initialData || { instanceId: "", remoteCourseId: 0, shortname: "", fullname: "" }
  });

  useEffect(() => {
    adminApi.listMoodleInstances().then(res => setInstances(res.items));
  }, []);

  async function onSubmit(values: MoodleCourseFormData){
    try {
        const payload = { ...values, remoteCourseId: Number(values.remoteCourseId) };
        if (mode === 'create') {
            await adminApi.createMoodleCourse(payload);
        } else {
            await adminApi.updateMoodleCourse(id!, payload);
        }
        onSave();
    } catch (e) {
        alert('Error saving course');
    }
  }

  async function onDelete(){
    if (!id || !confirm('Supprimer ce cours ?')) return;
    await adminApi.deleteMoodleCourse(id);
    onSave();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Instance</Label>
          <Select onValueChange={(v)=>form.setValue('instanceId', v)} defaultValue={form.getValues('instanceId')}>
              <option value="">Select Instance</option>
              {instances.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
          </Select>
          {form.formState.errors.instanceId && <p className="text-sm text-red-500">{form.formState.errors.instanceId.message}</p>}
        </div>
        <div>
          <Label>ID du cours (Moodle)</Label>
          <Input type="number" {...form.register('remoteCourseId')} />
          {form.formState.errors.remoteCourseId && <p className="text-sm text-red-500">{form.formState.errors.remoteCourseId.message}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Shortname</Label>
          <Input {...form.register('shortname')} />
           {form.formState.errors.shortname && <p className="text-sm text-red-500">{form.formState.errors.shortname.message}</p>}
        </div>
        <div>
          <Label>Fullname</Label>
          <Input {...form.register('fullname')} />
          {form.formState.errors.fullname && <p className="text-sm text-red-500">{form.formState.errors.fullname.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="rounded-2xl">Enregistrer</Button>
        {mode==='edit' && <Button type="button" variant="destructive" className="rounded-2xl" onClick={onDelete}>Supprimer</Button>}
      </div>
    </form>
  );
}
