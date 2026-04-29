import React, { useState } from 'react';
import type { Kalenda, Event, TimelineNarrative, TrainingModule, Theme } from '../../../types';
import { adminApi } from '../../../services/adminApi';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { MultiPicker, sourceBadge } from './MultiPicker';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentPool {
  events: Event[];
  timelines: TimelineNarrative[];
  modules: TrainingModule[];
  themes: Theme[];
}

type FormMode = 'create' | 'edit';

interface KalendaFormData {
  name: string;
  slug: string;
  description: string;
  region: string;
  themeLabel: string;
  coverUrl: string;
  version: string;
  notes: string;
  status: 'draft' | 'published';
  eventIds: string[];
  timelineIds: string[];
  moduleIds: string[];
  themeIds: string[];
}

const emptyForm = (): KalendaFormData => ({
  name: '', slug: '', description: '', region: '', themeLabel: '',
  coverUrl: '', version: '1.0.0', notes: '', status: 'draft',
  eventIds: [], timelineIds: [], moduleIds: [], themeIds: [],
});

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface KalendaFormProps {
  mode: FormMode;
  initial?: Kalenda;
  pool: ContentPool;
  onSave: (k: Kalenda) => void;
  onCancel: () => void;
}

// ─── Icône inline ─────────────────────────────────────────────────────────────
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

// ─── Composant ────────────────────────────────────────────────────────────────

export const KalendaForm: React.FC<KalendaFormProps> = ({ mode, initial, pool, onSave, onCancel }) => {
  const [form, setForm] = useState<KalendaFormData>(() =>
    initial
      ? { name: initial.name, slug: initial.slug, description: initial.description,
          region: initial.region ?? '', themeLabel: initial.themeLabel ?? '',
          coverUrl: initial.coverUrl ?? '', version: initial.version,
          notes: initial.notes ?? '', status: initial.status,
          eventIds: initial.eventIds, timelineIds: initial.timelineIds,
          moduleIds: initial.moduleIds, themeIds: initial.themeIds }
      : emptyForm(),
  );
  const [slugAuto, setSlugAuto] = useState(mode === 'create');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof KalendaFormData, string>>>({});

  const set = (key: keyof KalendaFormData, value: unknown) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (key === 'name' && slugAuto) next.slug = toSlug(value as string);
      return next;
    });
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const toggleId = (key: 'eventIds' | 'timelineIds' | 'moduleIds' | 'themeIds', id: string) => {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const validate = () => {
    const errs: Partial<Record<keyof KalendaFormData, string>> = {};
    if (!form.name.trim())        errs.name        = 'Nom requis';
    if (!form.slug.trim())        errs.slug        = 'Slug requis';
    if (!form.description.trim()) errs.description = 'Description requise';
    if (!form.version.match(/^\d+\.\d+\.\d+$/)) errs.version = 'Format : 1.0.0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const payload = () => ({
    name: form.name, slug: form.slug, description: form.description,
    region: form.region || undefined, themeLabel: form.themeLabel || undefined,
    coverUrl: form.coverUrl || undefined, version: form.version,
    notes: form.notes || undefined, status: form.status,
    eventIds: form.eventIds, timelineIds: form.timelineIds,
    moduleIds: form.moduleIds, themeIds: form.themeIds,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = mode === 'create'
        ? await adminApi.createKalenda(payload())
        : await adminApi.updateKalenda(initial!.id, payload());
      onSave(saved);
    } finally {
      setSaving(false);
    }
  };

  const totalItems = form.eventIds.length + form.timelineIds.length + form.moduleIds.length + form.themeIds.length;

  // ─── Champ texte générique ────────────────────────────────────────────────
  const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary ${err ? 'border-destructive' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Résumé */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
        <PackageIcon />
        <span className="text-muted-foreground">
          Ce Kalenda embarque <strong className="text-foreground">{totalItems} contenu{totalItems !== 1 ? 's' : ''}</strong> :{' '}
          {form.eventIds.length} évén. · {form.timelineIds.length} récits · {form.moduleIds.length} modules · {form.themeIds.length} thèmes
        </span>
      </div>

      {/* Infos générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nom" required error={errors.name}>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Kalenda Éducation Sénégal" className={inputCls(errors.name)} />
        </Field>

        <Field label={`Slug${slugAuto ? ' 🔵 AUTO' : ''}`} required error={errors.slug}>
          <input value={form.slug}
            onChange={e => { setSlugAuto(false); set('slug', e.target.value); }}
            placeholder="kalenda-education-senegal"
            className={`${inputCls(errors.slug)} font-mono`} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Décrivez l'objectif et le public cible…"
              className={`${inputCls(errors.description)} resize-none`} />
          </Field>
        </div>

        <Field label="Région / Pays">
          <input value={form.region} onChange={e => set('region', e.target.value)}
            placeholder="Sénégal, RDC, Burundi…" className={inputCls()} />
        </Field>

        <Field label="Thématique principale">
          <input value={form.themeLabel} onChange={e => set('themeLabel', e.target.value)}
            placeholder="Éducation, Culture, Formation…" className={inputCls()} />
        </Field>

        <Field label="URL couverture">
          <input value={form.coverUrl} onChange={e => set('coverUrl', e.target.value)}
            placeholder="https://…" className={inputCls()} />
        </Field>

        <Field label="Version" required error={errors.version}>
          <input value={form.version} onChange={e => set('version', e.target.value)}
            placeholder="1.0.0" className={`${inputCls(errors.version)} font-mono`} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Notes de version">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Changements apportés par rapport à la version précédente…"
              className={`${inputCls()} resize-none`} />
          </Field>
        </div>
      </div>

      {/* Sélection de contenus */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contenus embarqués</h3>

        <MultiPicker label="Événements" items={pool.events as any} selected={form.eventIds}
          onToggle={id => toggleId('eventIds', id)} searchPlaceholder="Rechercher un événement…"
          renderItem={(ev: any) => (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{ev.title}</span>
                {sourceBadge(ev.source)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {ev.dateISO ?? ev.year ?? ev.period ?? ''}{ev.countryCode && ` · ${ev.countryCode}`}
              </div>
            </div>
          )}
        />

        <MultiPicker label="Récits (Timelines)" items={pool.timelines as any} selected={form.timelineIds}
          onToggle={id => toggleId('timelineIds', id)} searchPlaceholder="Rechercher un récit…"
          renderItem={(tl: any) => (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{tl.title}</span>
              {sourceBadge(tl.source)}
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {tl.status === 'published' ? 'Publié' : 'Brouillon'}
              </Badge>
            </div>
          )}
        />

        <MultiPicker label="Modules de formation" items={pool.modules as any} selected={form.moduleIds}
          onToggle={id => toggleId('moduleIds', id)} searchPlaceholder="Rechercher un module…"
          renderItem={(m: any) => (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{m.title}</span>
              {sourceBadge(m.source)}
            </div>
          )}
        />

        <MultiPicker label="Thèmes" items={pool.themes as any} selected={form.themeIds}
          onToggle={id => toggleId('themeIds', id)} searchPlaceholder="Rechercher un thème…"
          renderItem={(th: any) => (
            <div className="flex items-center gap-2">
              {th.emoji && <span>{th.emoji}</span>}
              <span className="text-sm font-medium">{th.name}</span>
              {th.color && <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: th.color }} />}
              {sourceBadge(th.source)}
            </div>
          )}
        />
      </div>

      {/* Statut + actions */}
      <div className="flex items-center justify-between pt-4 border-t gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Statut</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le Kalenda' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </form>
  );
};
