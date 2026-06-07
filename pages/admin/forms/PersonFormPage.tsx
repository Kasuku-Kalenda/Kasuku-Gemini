import React, { useState, useEffect, useRef } from 'react';
import {
  adminApi,
  type PersonItem,
  type PersonFormData,
  type PersonSourceLink,
  type PersonResource,
  type PersonResourceType,
} from '../../../services/adminApi';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ArrowLeftIcon } from '../../../components/icons/ArrowLeftIcon';
import { ImageUploadInput } from '../../../components/admin/ImageUploadInput';
import { uploadFile } from '../../../services/apiClient';

// ─── Sub-types ───────────────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: PersonResourceType; label: string; accept: string }[] = [
  { value: 'audio', label: '🎵 Audio', accept: 'audio/*' },
  { value: 'video', label: '🎬 Vidéo', accept: 'video/*' },
  { value: 'pdf',   label: '📄 PDF',   accept: 'application/pdf' },
  { value: 'other', label: '📎 Autre', accept: '*/*' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  id?: string | null;
  onSave: () => void;
}

// ─── Empty state ─────────────────────────────────────────────────────────────

const EMPTY: PersonFormData = {
  name: '',
  nationality: '',
  bio: '',
  photoUrl: '',
  birthDate: '',
  deathDate: '',
  sources: [],
  resources: [],
};

// ─── Component ───────────────────────────────────────────────────────────────

export const PersonFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
  const [form, setForm]         = useState<PersonFormData>(EMPTY);
  const [loading, setLoading]   = useState(mode === 'edit');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Uploading state per resource (by index)
  const [uploadingResource, setUploadingResource] = useState<Record<number, boolean>>({});
  const resourceFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (mode === 'edit' && id) {
      adminApi.getPerson(id).then(data => {
        if (data) {
          setForm({
            name:        data.name,
            nationality: data.nationality ?? '',
            bio:         data.bio ?? '',
            photoUrl:    data.photoUrl ?? '',
            birthDate:   data.birthDate ? data.birthDate.split('T')[0] : '',
            deathDate:   data.deathDate ? data.deathDate.split('T')[0] : '',
            sources:     data.sources   ?? [],
            resources:   data.resources ?? [],
          });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
    }
  }, [id, mode]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setField = <K extends keyof PersonFormData>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  // ── Sources ──────────────────────────────────────────────────────────────

  const addSource = () =>
    setForm(prev => ({ ...prev, sources: [...(prev.sources ?? []), { label: '', url: '' }] }));

  const removeSource = (i: number) =>
    setForm(prev => ({ ...prev, sources: (prev.sources ?? []).filter((_, idx) => idx !== i) }));

  const updateSource = (i: number, field: keyof PersonSourceLink, value: string) =>
    setForm(prev => {
      const sources = [...(prev.sources ?? [])];
      sources[i] = { ...sources[i], [field]: value };
      return { ...prev, sources };
    });

  // ── Resources ────────────────────────────────────────────────────────────

  const addResource = (type: PersonResourceType) =>
    setForm(prev => ({ ...prev, resources: [...(prev.resources ?? []), { type, title: '', url: '' }] }));

  const removeResource = (i: number) =>
    setForm(prev => ({ ...prev, resources: (prev.resources ?? []).filter((_, idx) => idx !== i) }));

  const updateResource = (i: number, field: keyof PersonResource, value: string) =>
    setForm(prev => {
      const resources = [...(prev.resources ?? [])];
      resources[i] = { ...resources[i], [field]: value };
      return { ...prev, resources };
    });

  const handleResourceFile = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingResource(prev => ({ ...prev, [i]: true }));
    try {
      const { url } = await uploadFile(file, 'misc');
      updateResource(i, 'url', url);
    } catch {
      setError('Erreur lors de l\'upload de la ressource. Réessayez.');
    } finally {
      setUploadingResource(prev => ({ ...prev, [i]: false }));
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: PersonFormData = {
        name:        form.name.trim(),
        nationality: form.nationality?.trim().toUpperCase() || null,
        bio:         form.bio?.trim() || null,
        photoUrl:    form.photoUrl?.trim() || null,
        birthDate:   form.birthDate?.trim() || null,
        deathDate:   form.deathDate?.trim() || null,
        sources:     (form.sources ?? []).filter(s => s.url.trim()),
        resources:   (form.resources ?? []).filter(r => r.url.trim()),
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

  const navigateTo = () => {};

  // ── Loading / Not found ──────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

  const sources   = form.sources   ?? [];
  const resources = form.resources ?? [];

  return (
    <AdminLayout currentView="adminPeople" navigateTo={navigateTo as any}>
      <div className="max-w-2xl mx-auto py-8">

        {/* Header */}
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

        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* ── Section 1 : Identité ─────────────────────────────────────── */}
          <section className="bg-card border rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Identité</h2>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Nom complet <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={setField('name')}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Nationalité (code ISO)</label>
              <input
                value={form.nationality ?? ''}
                onChange={setField('nationality')}
                maxLength={2}
                placeholder="ex: CM, SN, CD"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Date de naissance</label>
                <input
                  value={form.birthDate ?? ''}
                  onChange={setField('birthDate')}
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date de décès</label>
                <input
                  value={form.deathDate ?? ''}
                  onChange={setField('deathDate')}
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Biographie</label>
              <textarea
                value={form.bio ?? ''}
                onChange={setField('bio')}
                rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            </div>
          </section>

          {/* ── Section 2 : Photo ────────────────────────────────────────── */}
          <section className="bg-card border rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Photo</h2>
            <ImageUploadInput
              label="Photo du personnage"
              folder="avatars"
              value={form.photoUrl ?? ''}
              onChange={url => setForm(prev => ({ ...prev, photoUrl: url }))}
            />
          </section>

          {/* ── Section 3 : Sources ──────────────────────────────────────── */}
          <section className="bg-card border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sources & Références</h2>
              <button
                type="button"
                onClick={addSource}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Ajouter une source
              </button>
            </div>

            {sources.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Aucune source — Wikipedia, Larousse, BBC Afrique…
              </p>
            )}

            {sources.map((source, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3 bg-background">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Source {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSource(i)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
                <input
                  value={source.label}
                  onChange={e => updateSource(i, 'label', e.target.value)}
                  placeholder="Ex : Wikipedia, BBC Afrique, Larousse…"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="url"
                  value={source.url}
                  onChange={e => updateSource(i, 'url', e.target.value)}
                  placeholder="https://…"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </section>

          {/* ── Section 4 : Ressources complémentaires ───────────────────── */}
          <section className="bg-card border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Ressources complémentaires
              </h2>
              <div className="flex gap-2">
                {RESOURCE_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => addResource(rt.value)}
                    className="text-xs text-primary font-semibold hover:underline"
                    title={`Ajouter ${rt.label}`}
                  >
                    + {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {resources.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Aucune ressource — audio, vidéo, PDF, document…
              </p>
            )}

            {resources.map((res, i) => {
              const rt = RESOURCE_TYPES.find(t => t.value === res.type) ?? RESOURCE_TYPES[3];
              return (
                <div key={i} className="border rounded-xl p-4 space-y-3 bg-background">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {rt.label} {i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <select
                        value={res.type}
                        onChange={e => updateResource(i, 'type', e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-card focus:outline-none"
                      >
                        {RESOURCE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeResource(i)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <input
                    value={res.title}
                    onChange={e => updateResource(i, 'title', e.target.value)}
                    placeholder="Titre / description de la ressource"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  {/* URL + Upload button */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={res.url}
                      onChange={e => updateResource(i, 'url', e.target.value)}
                      placeholder="https://… ou téléverser ci-contre →"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      disabled={uploadingResource[i]}
                      onClick={() => resourceFileRefs.current[i]?.click()}
                      className="shrink-0 px-3 py-2 text-xs bg-muted rounded-lg border hover:bg-muted/70 transition-colors disabled:opacity-50"
                    >
                      {uploadingResource[i] ? '⏳ Upload…' : '📁 Fichier'}
                    </button>
                    <input
                      ref={el => { resourceFileRefs.current[i] = el; }}
                      type="file"
                      accept={rt.accept}
                      className="hidden"
                      onChange={e => handleResourceFile(i, e)}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-8">
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
