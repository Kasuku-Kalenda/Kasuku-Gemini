import React, { useState, useEffect } from 'react';
import { adminApi, type PersonItem, type PersonFormData } from '../../../services/adminApi';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ArrowLeftIcon } from '../../../components/icons/ArrowLeftIcon';
import { ImageUploadInput } from '../../../components/admin/ImageUploadInput';

interface Props {
  mode: 'create' | 'edit';
  id?: string | null;
  onSave: () => void;
}

const EMPTY: PersonFormData = {
  name: '',
  nationality: '',
  bio: '',
  photoUrl: '',
  wikipediaUrl: '',
  birthDate: '',
  deathDate: '',
};

export const PersonFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
  const [form, setForm]       = useState<PersonFormData>(EMPTY);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      adminApi.getPerson(id).then(data => {
        if (data) {
          setForm({
            name: data.name,
            nationality: data.nationality ?? '',
            bio: data.bio ?? '',
            photoUrl: data.photoUrl ?? '',
            wikipediaUrl: data.wikipediaUrl ?? '',
            birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
            deathDate: data.deathDate ? data.deathDate.split('T')[0] : '',
          });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
    }
  }, [id, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: PersonFormData = {
        name: form.name.trim(),
        nationality: form.nationality?.trim() || null,
        bio: form.bio?.trim() || null,
        photoUrl: form.photoUrl?.trim() || null,
        wikipediaUrl: form.wikipediaUrl?.trim() || null,
        birthDate: form.birthDate?.trim() || null,
        deathDate: form.deathDate?.trim() || null,
      };
      if (mode === 'create') {
        await adminApi.createPerson(payload);
      } else if (id) {
        await adminApi.updatePerson(id, payload);
      }
      onSave();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof PersonFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const navigateTo = () => {}; // stub — layout requires it

  if (loading) {
    return (
      <AdminLayout currentView="adminPeople" navigateTo={navigateTo as any}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout currentView="adminPeople" navigateTo={navigateTo as any}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-lg font-semibold text-destructive">Personnage introuvable.</p>
          <button onClick={onSave} className="text-primary underline text-sm">← Retour à la liste</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentView="adminPeople" navigateTo={navigateTo as any}>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={onSave}
            className="flex items-center gap-2 text-sm text-primary hover:underline font-bold uppercase tracking-wider"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour à la liste
          </button>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight">
            {mode === 'create' ? 'Nouveau personnage' : 'Édition du personnage'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border rounded-2xl p-6">

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Nom complet <span className="text-destructive">*</span></label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Nationalité (code ISO)</label>
            <input
              value={form.nationality ?? ''}
              onChange={set('nationality')}
              maxLength={2}
              placeholder="ex: CM, SN, CD"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
            />
          </div>

          <ImageUploadInput
            label="Photo"
            folder="avatars"
            value={form.photoUrl ?? ''}
            onChange={url => setForm(prev => ({ ...prev, photoUrl: url }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Date de naissance</label>
              <input
                value={form.birthDate ?? ''}
                onChange={set('birthDate')}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date de décès</label>
              <input
                value={form.deathDate ?? ''}
                onChange={set('deathDate')}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">URL Wikipédia</label>
            <input
              value={form.wikipediaUrl ?? ''}
              onChange={set('wikipediaUrl')}
              type="url"
              placeholder="https://fr.wikipedia.org/wiki/…"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Biographie</label>
            <textarea
              value={form.bio ?? ''}
              onChange={set('bio')}
              rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onSave}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le personnage' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
