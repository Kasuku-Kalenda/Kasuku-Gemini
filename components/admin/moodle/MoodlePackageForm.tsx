
"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { moodlePackageSchema, MoodlePackageFormData } from '../../../schemas/moodle';
import { adminApi } from '../../../services/adminApi';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectItem } from '../../ui/Select';
import { Switch } from '../../ui/Switch';
import type { MoodleCourse } from '../../../types';

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

export function MoodlePackageForm({ mode, id, initialData, onSave }: Props){
  const [courses, setCourses] = useState<MoodleCourse[]>([]);
  const form = useForm<MoodlePackageFormData>({
    resolver: zodResolver(moodlePackageSchema),
    defaultValues: initialData || { courseId: "", type: "SCORM", title: "", storagePath: "", isAvailable: false }
  });

  useEffect(() => {
    adminApi.listMoodleCourses().then(res => setCourses(res.items));
  }, []);

  async function onSubmit(values: MoodlePackageFormData){
    try {
        const payload = { ...values, sizeBytes: Number(values.sizeBytes || 0) };
        if (mode === 'create') {
            await adminApi.createMoodlePackage(payload);
        } else {
            await adminApi.updateMoodlePackage(id!, payload);
        }
        onSave();
    } catch (e) {
        alert('Error saving package');
    }
  }

  async function onDelete(){
    if (!id || !confirm('Supprimer ce package ?')) return;
    await adminApi.deleteMoodlePackage(id);
    onSave();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
       <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Course</Label>
          <Select onValueChange={(v)=>form.setValue('courseId', v)} defaultValue={form.getValues('courseId')}>
              <option value="">Select Course</option>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.fullname}</SelectItem>)}
          </Select>
           {form.formState.errors.courseId && <p className="text-sm text-red-500">{form.formState.errors.courseId.message}</p>}
        </div>
        <div>
          <Label>Type</Label>
          <Select onValueChange={(v)=>form.setValue('type', v as any)} defaultValue={form.getValues('type')}>
              <SelectItem value="SCORM">SCORM</SelectItem>
              <SelectItem value="H5P">H5P</SelectItem>
              <SelectItem value="IMSCC">IMSCC</SelectItem>
          </Select>
        </div>
      </div>
      <div>
        <Label>Titre</Label>
        <Input placeholder="Titre" {...form.register('title')} />
        {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
      </div>
      <div>
        <Label>Storage Path</Label>
        <Input placeholder="Storage Path (/uploads/...)" {...form.register('storagePath')} />
        {form.formState.errors.storagePath && <p className="text-sm text-red-500">{form.formState.errors.storagePath.message}</p>}
      </div>
      <div className="flex items-center gap-2">
          <Label>Disponible offline</Label>
          <Switch checked={form.watch('isAvailable')} onCheckedChange={(v)=>form.setValue('isAvailable', v)} />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="rounded-2xl">Enregistrer</Button>
        {mode==='edit' && <Button type="button" variant="destructive" className="rounded-2xl" onClick={onDelete}>Supprimer</Button>}
      </div>
    </form>
  );
}
