import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemeSchema, type ThemeFormData } from '../../lib/validations/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface AdminThemeEditorProps {
  initialData?: any;
  onSubmit: (data: ThemeFormData) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  onCancel: () => void;
}

export const AdminThemeEditor: React.FC<AdminThemeEditorProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isSaving,
  onCancel
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ThemeFormData>({
    resolver: zodResolver(ThemeSchema),
    defaultValues: initialData || { name: '', slug: '' }
  });

  if (isLoading) return <div className="p-12 text-center animate-pulse">Chargement du thème...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Édition du Thème</h2>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer le thème"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Détails du Thème</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom du Thème</label>
            <Input {...register('name')} placeholder="Ex: Musique, Histoire, Art..." />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input {...register('slug')} placeholder="musique" />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
