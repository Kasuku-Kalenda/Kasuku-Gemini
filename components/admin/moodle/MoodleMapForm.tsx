
"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { moodleMapSchema, MoodleMapFormData } from '../../../schemas/moodle';
import { adminApi } from '../../../services/adminApi';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectItem } from '../../ui/Select';
import type { TrainingModule, MoodleCourse, MoodleOfflinePackage } from '../../../types';

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

export function MoodleMapForm({ mode, id, initialData, onSave }: Props){
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [courses, setCourses] = useState<MoodleCourse[]>([]);
  const [packages, setPackages] = useState<MoodleOfflinePackage[]>([]);

  const form = useForm<MoodleMapFormData>({
    resolver: zodResolver(moodleMapSchema),
    defaultValues: initialData || { moduleId:"", mode:"OFFLINE" }
  });

  const modeWatcher = form.watch('mode');

  useEffect(() => {
    adminApi.listModules().then(res => setModules(res.items));
    adminApi.listMoodleCourses().then(res => setCourses(res.items));
    adminApi.listMoodlePackages().then(res => setPackages(res.items));
  }, []);

  async function onSubmit(values: MoodleMapFormData){
    try {
        if (mode === 'create') {
            await adminApi.createMoodleMap(values);
        } else {
            await adminApi.updateMoodleMap(id!, values);
        }
        onSave();
    } catch (e) {
        alert('Error saving map');
    }
  }
  
  async function onDelete(){
    if (!id || !confirm('Supprimer ce mapping ?')) return;
    await adminApi.deleteMoodleMap(id);
    onSave();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Module (Kasuku)</Label>
          <Select onValueChange={(v)=>form.setValue('moduleId', v)} defaultValue={form.getValues('moduleId')}>
            <option value="">Select Module</option>
            {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
          </Select>
          {form.formState.errors.moduleId && <p className="text-sm text-red-500">{form.formState.errors.moduleId.message}</p>}
        </div>
        <div>
          <Label>Mode</Label>
          <Select onValueChange={(v)=>form.setValue('mode', v as any)} defaultValue={form.getValues('mode')}>
              <SelectItem value="LTI">LTI</SelectItem>
              <SelectItem value="REST">REST</SelectItem>
              <SelectItem value="OFFLINE">OFFLINE</SelectItem>
          </Select>
        </div>
      </div>

      {modeWatcher !== 'OFFLINE' && (
        <div>
          <Label>Course (si LTI/REST)</Label>
          <Select onValueChange={(v)=>form.setValue('courseId', v)} defaultValue={form.getValues('courseId') ?? ''}>
            <option value="">Select Course</option>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.fullname}</SelectItem>)}
          </Select>
        </div>
      )}

      {modeWatcher === 'OFFLINE' && (
         <div>
          <Label>Package (si OFFLINE)</Label>
          <Select onValueChange={(v)=>form.setValue('packageId', v)} defaultValue={form.getValues('packageId') ?? ''}>
            <option value="">Select Package</option>
            {packages.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </Select>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="rounded-2xl">Enregistrer</Button>
        {mode==='edit' && <Button type="button" variant="destructive" className="rounded-2xl" onClick={onDelete}>Supprimer</Button>}
      </div>
    </form>
  );
}
