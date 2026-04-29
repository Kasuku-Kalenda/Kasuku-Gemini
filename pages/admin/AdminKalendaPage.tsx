import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Kalenda, Event, TimelineNarrative, TrainingModule, Theme } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// ─── Icônes inline ────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
);
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentPool {
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
  name: '',
  slug: '',
  description: '',
  region: '',
  themeLabel: '',
  coverUrl: '',
  version: '1.0.0',
  notes: '',
  status: 'draft',
  eventIds: [],
  timelineIds: [],
  moduleIds: [],
  themeIds: [],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sourceBadge = (source?: { type: string }) => {
  if (!source) return null;
  if (source.type === 'central') return <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">🏛️ Central</span>;
  if (source.type === 'imported_csv') return <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5">⬆️ Importé</span>;
  return <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">📍 Local</span>;
};

// ─── Sélecteur multi-items ────────────────────────────────────────────────────

interface MultiPickerProps<T extends { id: string; title?: string; name?: string; slug?: string; source?: { type: string } }> {
  label: string;
  items: T[];
  selected: string[];
  onToggle: (id: string) => void;
  renderItem?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
}

function MultiPicker<T extends { id: string; title?: string; name?: string; slug?: string; source?: { type: string } }>({
  label, items, selected, onToggle, renderItem, searchPlaceholder,
}: MultiPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(it => {
      const text = (it.title ?? it.name ?? '').toLowerCase();
      return !q || text.includes(q);
    });
  }, [items, search]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
      >
        <span>{label} <span className="text-primary font-bold">({selected.length} sélectionné{selected.length !== 1 ? 's' : ''})</span></span>
        {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>

      {open && (
        <div className="p-3 space-y-2">
          <input
            type="text"
            placeholder={searchPlaceholder ?? 'Rechercher…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat</p>
            )}
            {filtered.map(item => {
              const isSelected = selected.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-primary/8 border border-primary/30' : 'hover:bg-muted/60'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(item.id)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    {renderItem ? renderItem(item) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{item.title ?? item.name}</span>
                        {sourceBadge(item.source)}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire Kalenda ───────────────────────────────────────────────────────

interface KalendaFormProps {
  mode: FormMode;
  initial?: Kalenda;
  pool: ContentPool;
  onSave: (k: Kalenda) => void;
  onCancel: () => void;
}

const KalendaForm: React.FC<KalendaFormProps> = ({ mode, initial, pool, onSave, onCancel }) => {
  const [form, setForm] = useState<KalendaFormData>(() => {
    if (initial) {
      return {
        name: initial.name,
        slug: initial.slug,
        description: initial.description,
        region: initial.region ?? '',
        themeLabel: initial.themeLabel ?? '',
        coverUrl: initial.coverUrl ?? '',
        version: initial.version,
        notes: initial.notes ?? '',
        status: initial.status,
        eventIds: initial.eventIds,
        timelineIds: initial.timelineIds,
        moduleIds: initial.moduleIds,
        themeIds: initial.themeIds,
      };
    }
    return emptyForm();
  });

  const [slugAuto, setSlugAuto] = useState(mode === 'create');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof KalendaFormData, string>>>({});

  const set = (key: keyof KalendaFormData, value: any) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (key === 'name' && slugAuto) {
        next.slug = toSlug(value as string);
      }
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
    if (!form.name.trim()) errs.name = 'Nom requis';
    if (!form.slug.trim()) errs.slug = 'Slug requis';
    if (!form.description.trim()) errs.description = 'Description requise';
    if (!form.version.match(/^\d+\.\d+\.\d+$/)) errs.version = 'Format : 1.0.0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let saved: Kalenda;
      if (mode === 'create') {
        saved = await adminApi.createKalenda({
          name: form.name,
          slug: form.slug,
          description: form.description,
          region: form.region || undefined,
          themeLabel: form.themeLabel || undefined,
          coverUrl: form.coverUrl || undefined,
          version: form.version,
          notes: form.notes || undefined,
          status: form.status,
          eventIds: form.eventIds,
          timelineIds: form.timelineIds,
          moduleIds: form.moduleIds,
          themeIds: form.themeIds,
        });
      } else {
        saved = await adminApi.updateKalenda(initial!.id, {
          name: form.name,
          slug: form.slug,
          description: form.description,
          region: form.region || undefined,
          themeLabel: form.themeLabel || undefined,
          coverUrl: form.coverUrl || undefined,
          version: form.version,
          notes: form.notes || undefined,
          status: form.status,
          eventIds: form.eventIds,
          timelineIds: form.timelineIds,
          moduleIds: form.moduleIds,
          themeIds: form.themeIds,
        });
      }
      onSave(saved);
    } finally {
      setSaving(false);
    }
  };

  const totalItems = form.eventIds.length + form.timelineIds.length + form.moduleIds.length + form.themeIds.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* En-tête résumé */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
        <PackageIcon />
        <span className="text-muted-foreground">
          Ce Kalenda embarque <strong className="text-foreground">{totalItems} contenu{totalItems !== 1 ? 's' : ''}</strong> :
          {' '}{form.eventIds.length} évén. · {form.timelineIds.length} récits · {form.moduleIds.length} modules · {form.themeIds.length} thèmes
        </span>
      </div>

      {/* Infos générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom <span className="text-destructive">*</span></label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Kalenda Éducation Sénégal"
            className={`w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Slug <span className="text-destructive">*</span>
            {slugAuto && <span className="ml-2 text-[10px] text-primary font-bold bg-primary/10 rounded px-1.5 py-0.5">AUTO</span>}
          </label>
          <input
            value={form.slug}
            onChange={e => { setSlugAuto(false); set('slug', e.target.value); }}
            placeholder="kalenda-education-senegal"
            className={`w-full border rounded px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary ${errors.slug ? 'border-destructive' : ''}`}
          />
          {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description <span className="text-destructive">*</span></label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Décrivez l'objectif et le public cible de ce Kalenda…"
            className={`w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none ${errors.description ? 'border-destructive' : ''}`}
          />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Région / Pays</label>
          <input
            value={form.region}
            onChange={e => set('region', e.target.value)}
            placeholder="Sénégal, RDC, Burundi…"
            className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Thématique principale</label>
          <input
            value={form.themeLabel}
            onChange={e => set('themeLabel', e.target.value)}
            placeholder="Éducation, Culture, Formation…"
            className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL couverture</label>
          <input
            value={form.coverUrl}
            onChange={e => set('coverUrl', e.target.value)}
            placeholder="https://…"
            className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Version <span className="text-destructive">*</span></label>
          <input
            value={form.version}
            onChange={e => set('version', e.target.value)}
            placeholder="1.0.0"
            className={`w-full border rounded px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary ${errors.version ? 'border-destructive' : ''}`}
          />
          {errors.version && <p className="text-xs text-destructive mt-1">{errors.version}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes de version</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="Changements apportés par rapport à la version précédente…"
            className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Sélection de contenus */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contenus embarqués</h3>

        <MultiPicker
          label="Événements"
          items={pool.events as any}
          selected={form.eventIds}
          onToggle={id => toggleId('eventIds', id)}
          searchPlaceholder="Rechercher un événement…"
          renderItem={(ev: any) => (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{ev.title}</span>
                {sourceBadge(ev.source)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {ev.dateISO ?? ev.year ?? ev.period ?? ''}
                {ev.countryCode && ` · ${ev.countryCode}`}
              </div>
            </div>
          )}
        />

        <MultiPicker
          label="Récits (Timelines)"
          items={pool.timelines as any}
          selected={form.timelineIds}
          onToggle={id => toggleId('timelineIds', id)}
          searchPlaceholder="Rechercher un récit…"
          renderItem={(tl: any) => (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{tl.title}</span>
              {sourceBadge(tl.source)}
              <Badge variant="outline" className="text-[9px] px-1 py-0">{tl.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
            </div>
          )}
        />

        <MultiPicker
          label="Modules de formation"
          items={pool.modules as any}
          selected={form.moduleIds}
          onToggle={id => toggleId('moduleIds', id)}
          searchPlaceholder="Rechercher un module…"
          renderItem={(m: any) => (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{m.title}</span>
              {sourceBadge(m.source)}
            </div>
          )}
        />

        <MultiPicker
          label="Thèmes"
          items={pool.themes as any}
          selected={form.themeIds}
          onToggle={id => toggleId('themeIds', id)}
          searchPlaceholder="Rechercher un thème…"
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
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
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

// ─── Page principale ──────────────────────────────────────────────────────────

interface AdminKalendaPageProps {
  navigateTo: (view: string, id?: string) => void;
}

export const AdminKalendaPage: React.FC<AdminKalendaPageProps> = ({ navigateTo }) => {
  const [kalendas, setKalendas] = useState<Kalenda[]>([]);
  const [pool, setPool] = useState<ContentPool>({ events: [], timelines: [], modules: [], themes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState<{ open: boolean; mode: FormMode; item?: Kalenda }>({ open: false, mode: 'create' });
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const [kRes, evRes, tlRes, modRes, thRes] = await Promise.all([
      adminApi.listKalendas(),
      adminApi.listEvents(),
      adminApi.listTimelines(),
      adminApi.listModules(),
      adminApi.listThemes(),
    ]);
    setKalendas(kRes.items);
    setPool({
      events: evRes.items,
      timelines: tlRes.items,
      modules: modRes.items,
      themes: thRes.items,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? kalendas.filter(k => k.name.toLowerCase().includes(q) || k.region?.toLowerCase().includes(q) || k.slug.includes(q)) : kalendas;
  }, [kalendas, search]);

  const handleDelete = async (k: Kalenda) => {
    if (!window.confirm(`Supprimer le Kalenda "${k.name}" ? Cette action est irréversible.`)) return;
    await adminApi.deleteKalenda(k.id);
    load();
  };

  const handleToggleStatus = async (k: Kalenda) => {
    const next = k.status === 'published' ? 'draft' : 'published';
    await adminApi.publishKalenda(k.id, next);
    load();
  };

  const handleSave = (_saved: Kalenda) => {
    setFormMode({ open: false, mode: 'create' });
    load();
  };

  if (formMode.open) {
    return (
      <AdminLayout currentView="adminKalenda" navigateTo={navigateTo as any}>
        <div className="container py-6 max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormMode({ open: false, mode: 'create' })}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Retour aux Kalenda
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              {formMode.mode === 'create' ? 'Nouveau Kalenda' : `Modifier "${formMode.item?.name}"`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Composez un paquet de contenus ciblés pour un déploiement spécifique.
            </p>
          </div>
          <div className="bg-card border rounded-xl p-6">
            <KalendaForm
              mode={formMode.mode}
              initial={formMode.item}
              pool={pool}
              onSave={handleSave}
              onCancel={() => setFormMode({ open: false, mode: 'create' })}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentView="adminKalenda" navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <PackageIcon /> Kasuku Kalenda
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Paquets de contenus ciblés pour déploiements locaux et hors-ligne.
            </p>
          </div>
          <Button onClick={() => setFormMode({ open: true, mode: 'create' })} className="rounded-full px-5 flex items-center gap-2">
            <PlusIcon /> Nouveau Kalenda
          </Button>
        </div>

        {/* Explication gouvernance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Gouvernance :</strong> Un Kalenda sélectionne des contenus existants (événements, récits, modules, thèmes) pour former un paquet
          exportable et déployable sur des instances locales hors-ligne. Les contenus locaux ne sont jamais écrasés lors d'une synchronisation centrale.
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un Kalenda…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-xs border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-sm text-muted-foreground">{filtered.length} Kalenda{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-4 border-2 border-dashed rounded-xl">
            <PackageIcon />
            <p className="text-muted-foreground text-sm">
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucun Kalenda créé. Commencez par en créer un.'}
            </p>
            {!search && (
              <Button variant="outline" onClick={() => setFormMode({ open: true, mode: 'create' })}>
                Créer le premier Kalenda
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(k => (
              <div key={k.id} className="bg-card border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* Cover */}
                {k.coverUrl ? (
                  <img src={k.coverUrl} alt={k.name} className="w-full h-28 object-cover bg-muted" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <PackageIcon />
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1 gap-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-secondary truncate">{k.name}</h3>
                      <p className="text-[10px] font-mono text-muted-foreground">{k.slug} · v{k.version}</p>
                    </div>
                    <Badge
                      variant={k.status === 'published' ? 'secondary' : 'outline'}
                      className="text-[9px] font-black tracking-widest uppercase shrink-0"
                    >
                      {k.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>

                  {/* Méta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {k.region && <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">📍 {k.region}</span>}
                    {k.themeLabel && <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">🏷️ {k.themeLabel}</span>}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{k.description}</p>

                  {/* Compteurs de contenus */}
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                    {[
                      { label: 'Évén.', count: k.eventIds.length },
                      { label: 'Récits', count: k.timelineIds.length },
                      { label: 'Modules', count: k.moduleIds.length },
                      { label: 'Thèmes', count: k.themeIds.length },
                    ].map(({ label, count }) => (
                      <div key={label} className="bg-muted/50 rounded py-1">
                        <div className="font-bold text-foreground">{count}</div>
                        <div className="text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs flex items-center gap-1 justify-center"
                      onClick={() => setFormMode({ open: true, mode: 'edit', item: k })}
                    >
                      <EditIcon /> Modifier
                    </Button>
                    <Button
                      variant={k.status === 'published' ? 'outline' : 'default'}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleToggleStatus(k)}
                    >
                      {k.status === 'published' ? 'Dépublier' : 'Publier'}
                    </Button>
                    <button
                      onClick={() => handleDelete(k)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
