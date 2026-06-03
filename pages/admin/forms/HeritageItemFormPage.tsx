import React, { useState, useEffect, useRef } from 'react';
import { adminApi, type HeritageFormData, type HeritageResourceInput } from '../../../services/adminApi';
import { uploadFile } from '../../../services/apiClient';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ArrowLeftIcon } from '../../../components/icons/ArrowLeftIcon';
import { ImageUploadInput } from '../../../components/admin/ImageUploadInput';
import type { HeritageCategory, HeritageResourceType } from '../../../types';

interface Props {
  mode: 'create' | 'edit';
  id?: string | null;
  onSave: () => void;
}

const CATEGORIES: { value: HeritageCategory; label: string }[] = [
  { value: 'mask',    label: 'Masque' },
  { value: 'proverb', label: 'Proverbe' },
  { value: 'symbol',  label: 'Symbole' },
  { value: 'recipe',  label: 'Recette' },
  { value: 'craft',   label: 'Artisanat' },
  { value: 'music',   label: 'Musique' },
  { value: 'other',   label: 'Autre' },
];

const RESOURCE_TYPES: HeritageResourceType[] = ['audio', 'image', 'video', 'pdf', 'link'];

const EMPTY: HeritageFormData = {
  title: '',
  lang: 'fr',
  category: 'other',
  summary: '',
  period: '',
  countryCode: '',
  coverUrl: '',
  status: 'draft',
  themeIds: [],
  personIds: [],
  resources: [],
};

export const HeritageItemFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
  const [form, setForm]             = useState<HeritageFormData>(EMPTY);
  const [loading, setLoading]       = useState(mode === 'edit');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [notFound, setNotFound]     = useState(false);
  const [uploadingRes, setUploadingRes] = useState<Record<number, boolean>>({});
  const fileRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (mode === 'edit' && id) {
      adminApi.getHeritage(id).then(data => {
        if (data) {
          setForm({
            title:       data.title,
            lang:        data.lang ?? 'fr',
            category:    data.category ?? 'other',
            summary:     data.summary ?? '',
            period:      data.period ?? '',
            countryCode: data.countryCode ?? '',
            coverUrl:    data.coverUrl ?? '',
            status:      data.status ?? 'draft',
            themeIds:    (data.themes ?? []).map(t => t.id),
            personIds:   (data.people ?? []).map(p => p.id),
            resources:   (data.resources ?? []).map(r => ({
              type:   r.type,
              url:    r.url,
              title:  r.title ?? '',
              credit: r.credit ?? '',
            })),
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
      const payload: HeritageFormData = {
        title:       form.title.trim(),
        lang:        form.lang || 'fr',
        category:    form.category || 'other',
        summary:     (form.summary as string)?.trim() || null,
        period:      (form.period as string)?.trim() || null,
        countryCode: (form.countryCode as string)?.trim().toUpperCase() || null,
        coverUrl:    (form.coverUrl as string)?.trim() || null,
        status:      form.status || 'draft',
        themeIds:    form.themeIds ?? [],
        personIds:   form.personIds ?? [],
        resources:   (form.resources ?? [])
          .filter(r => r.url?.trim())
          .map(r => ({
            type:   r.type,
            url:    r.url.trim(),
            title:  r.title?.trim() || null,
            credit: r.credit?.trim() || null,
          })),
      };
      if (mode === 'create') {
        await adminApi.createHeritage(payload);
      } else if (id) {
        await adminApi.updateHeritage(id, payload);
      }
      onSave();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof HeritageFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addResource = () => setForm(prev => ({
    ...prev,
    resources: [...(prev.resources ?? []), { type: 'link', url: '', title: '', credit: '' }],
  }));

  const updateResource = (index: number, field: keyof HeritageResourceInput, value: string) =>
    setForm(prev => {
      const resources = [...(prev.resources ?? [])];
      resources[index] = { ...resources[index], [field]: value };
      return { ...prev, resources };
    });

  const removeResource = (index: number) =>
    setForm(prev => ({
      ...prev,
      resources: (prev.resources ?? []).filter((_, i) => i !== index),
    }));

  const navigateTo = () => {};

  if (loading) {
    return (
      <AdminLayout currentView="adminHeritage" navigateTo={navigateTo as any}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout currentView="adminHeritage" navigateTo={navigateTo as any}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-lg font-semibold text-destructive">Élément introuvable.</p>
          <button onClick={onSave} className="text-primary underline text-sm">← Retour à la liste</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentView="adminHeritage" navigateTo={navigateTo as any}>
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
            {mode === 'create' ? 'Nouvel élément' : 'Édition du patrimoine'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border rounded-2xl p-6">

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Titre <span className="text-destructive">*</span></label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Catégorie</label>
              <select
                value={form.category}
                onChange={set('category')}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Statut</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Langue</label>
              <input
                value={form.lang ?? 'fr'}
                onChange={set('lang')}
                maxLength={5}
                placeholder="fr"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Code pays (ISO 2)</label>
              <input
                value={form.countryCode ?? ''}
                onChange={set('countryCode')}
                maxLength={2}
                placeholder="CM, SN, CD…"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Période / Époque</label>
            <input
              value={form.period ?? ''}
              onChange={set('period')}
              placeholder="ex: XVe siècle, Époque précoloniale"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <ImageUploadInput
            label="Image de couverture"
            folder="misc"
            value={form.coverUrl ?? ''}
            onChange={url => setForm(prev => ({ ...prev, coverUrl: url }))}
          />

          <div>
            <label className="block text-sm font-semibold mb-1">Résumé</label>
            <textarea
              value={form.summary ?? ''}
              onChange={set('summary')}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Ressources complémentaires</label>
              <button
                type="button"
                onClick={addResource}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Ajouter
              </button>
            </div>
            {(form.resources ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucune ressource.</p>
            )}
            {(form.resources ?? []).map((r, i) => {
              const accept = r.type === 'audio' ? 'audio/*' : r.type === 'video' ? 'video/*' : r.type === 'image' ? 'image/*' : r.type === 'pdf' ? '.pdf,application/pdf' : undefined;
              const isUploading = uploadingRes[i] ?? false;
              return (
                <div key={i} className="border rounded-lg p-3 space-y-2 mb-2 bg-muted/20">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-0.5">Type</label>
                      <select
                        value={r.type}
                        onChange={e => updateResource(i, 'type', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-0.5">URL <span className="text-destructive">*</span></label>
                      <div className="flex gap-1">
                        <input
                          value={r.url}
                          onChange={e => updateResource(i, 'url', e.target.value)}
                          placeholder="https://…"
                          className="flex-1 border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        {r.type !== 'link' && accept && (
                          <>
                            <button
                              type="button"
                              title="Téléverser un fichier"
                              disabled={isUploading}
                              onClick={() => fileRefs.current.get(i)?.click()}
                              className="border rounded px-2 py-1 text-xs bg-background hover:border-primary/40 shrink-0 disabled:opacity-50"
                            >
                              {isUploading ? '⏳' : '📁'}
                            </button>
                            <input
                              type="file"
                              accept={accept}
                              className="hidden"
                              ref={el => { if (el) fileRefs.current.set(i, el); else fileRefs.current.delete(i); }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]; if (!file) return;
                                setUploadingRes(prev => ({ ...prev, [i]: true }));
                                try {
                                  const { url } = await uploadFile(file, 'misc');
                                  updateResource(i, 'url', url);
                                  if (!r.title) updateResource(i, 'title', file.name.replace(/\.[^/.]+$/, ''));
                                } catch { alert('Erreur lors de l\'upload. Réessayez.'); }
                                finally { setUploadingRes(prev => ({ ...prev, [i]: false })); }
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-0.5">Titre</label>
                      <input
                        value={r.title ?? ''}
                        onChange={e => updateResource(i, 'title', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-0.5">Crédit</label>
                      <input
                        value={r.credit ?? ''}
                        onChange={e => updateResource(i, 'credit', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeResource(i)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer cette ressource
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onSave}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
