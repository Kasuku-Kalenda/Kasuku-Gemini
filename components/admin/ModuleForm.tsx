
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { moduleFormSchema, ModuleFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import { motion, AnimatePresence } from 'motion/react';
import type { MoodleInstance, MoodleCourse, MoodleOfflinePackage } from '../../types';

interface ModuleFormProps {
  mode: "create" | "edit";
  initialData?: any;
  onSave: () => void;
}

// ─── Slug helper ────────────────────────────────────────────────────────────
const toSlug = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Section icon ────────────────────────────────────────────────────────────
const SectionHeader = ({ n, label }: { n: number; label: string }) => (
  <h3 className="font-bold text-secondary flex items-center gap-2 mb-4">
    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">{n}</span>
    {label}
  </h3>
);

// ─── Moodle mode pill button ─────────────────────────────────────────────────
const ModePill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
      active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-secondary border-muted hover:border-primary/50'
    }`}
  >
    {children}
  </button>
);

export function ModuleForm({ mode, initialData, onSave }: ModuleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [slugAuto, setSlugAuto] = useState(mode === 'create');

  // Moodle data
  const [instances, setInstances] = useState<MoodleInstance[]>([]);
  const [allCourses, setAllCourses] = useState<MoodleCourse[]>([]);
  const [packages, setPackages] = useState<MoodleOfflinePackage[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [showNewCourse, setShowNewCourse] = useState(false);

  // Thumbnail
  const [thumbPreview, setThumbPreview] = useState<string>(initialData?.thumbnail || '');
  const [thumbMode, setThumbMode] = useState<'url' | 'file'>('url');
  const thumbFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ModuleFormData>({
    defaultValues: initialData
      ? {
          ...initialData,
          level: initialData.level ?? 'Débutant',
          language: initialData.language ?? 'fr',
          objectives: initialData.objectives?.length ? initialData.objectives : [''],
          tags: initialData.tags ?? [],
          eventIds: initialData.eventIds ?? [],
          sections: initialData.sections ?? [],
          moduleType: initialData.moduleType ?? 'internal',
          moodleMode: initialData.moodleMode ?? 'url',
          moodleCourseUrl: initialData.moodleCourseUrl ?? '',
          moodleInstanceId: initialData.moodleInstanceId ?? '',
          moodleCourseId: initialData.moodleCourseId ?? '',
          moodlePackageId: initialData.moodlePackageId ?? '',
          timelineSlug: initialData.timelineSlug ?? '',
        }
      : {
          title: '', slug: '', summary: '',
          objectives: [''],
          level: 'Débutant', language: 'fr', durationMin: null,
          thumbnail: '', tags: [], eventIds: [],
          creatorIds: [], sponsorIds: [], sections: [],
          moduleType: 'internal',
          moodleMode: 'url',
          moodleCourseUrl: '', moodleInstanceId: '', moodleCourseId: '',
          moodlePackageId: '', timelineSlug: '',
          newCourseName: '', newCourseRemoteId: null,
        },
  });

  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({ control: form.control, name: 'sections' });
  const { fields: objectives, append: appendObjective, remove: removeObjective } = useFieldArray({ control: form.control, name: 'objectives' as any });

  const moduleType = form.watch('moduleType');
  const moodleMode = form.watch('moodleMode');
  const watchedInstanceId = form.watch('moodleInstanceId');
  const watchedCourseId = form.watch('moodleCourseId');
  const watchedTitle = form.watch('title');
  const watchedEventIds = form.watch('eventIds') ?? [];
  const watchedThumb = form.watch('thumbnail');

  // Load reference data
  useEffect(() => {
    Promise.all([
      adminApi.listMoodleInstances().then(r => setInstances(r.items)),
      adminApi.listMoodleCourses().then(r => setAllCourses(r.items)),
      adminApi.listMoodlePackages().then(r => setPackages(r.items)),
      adminApi.listEvents().then(r => setAllEvents(r.items)),
      adminApi.listTimelines().then(r => setTimelines(r.items)),
    ]);
  }, []);

  // Auto-slug
  useEffect(() => {
    if (slugAuto && watchedTitle) {
      form.setValue('slug', toSlug(watchedTitle), { shouldValidate: false });
    }
  }, [watchedTitle, slugAuto]);

  // Thumb preview sync (URL mode)
  useEffect(() => {
    if (thumbMode === 'url') setThumbPreview(watchedThumb || '');
  }, [watchedThumb, thumbMode]);

  const handleThumbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = ev => res(ev.target?.result as string);
      reader.readAsDataURL(file);
    }).then(dataUrl => {
      form.setValue('thumbnail', dataUrl, { shouldValidate: true });
      setThumbPreview(dataUrl);
    });
  };

  const toggleEvent = useCallback((id: string) => {
    const current = form.getValues('eventIds') ?? [];
    form.setValue('eventIds', current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]);
  }, [form]);

  // Filtered courses by selected instance
  const filteredCourses = watchedInstanceId
    ? allCourses.filter(c => c.instanceId === watchedInstanceId)
    : allCourses;

  // Filtered packages by selected course
  const filteredPackages = watchedCourseId
    ? packages.filter(p => p.courseId === watchedCourseId)
    : packages;

  // Filtered events for search
  const filteredEvents = eventSearch
    ? allEvents.filter(e => e.title?.toLowerCase().includes(eventSearch.toLowerCase()))
    : allEvents.slice(0, 30);

  // ─── Submit ─────────────────────────────────────────────────────────────
  const onSubmit = async (rawData: ModuleFormData) => {
    const result = await moduleFormSchema.safeParseAsync(rawData);
    if (!result.success) {
      const flat = result.error.flatten();
      Object.entries(flat.fieldErrors).forEach(([field, msgs]) => {
        form.setError(field as any, { message: (msgs as string[])[0] });
      });
      if (flat.formErrors?.length) {
        form.setError('moodleInstanceId', { message: flat.formErrors[0] });
      }
      return;
    }

    setIsSaving(true);
    try {
      const data = result.data;

      // 1. If Moodle + LTI or OFFLINE + new course, create the course first
      let resolvedCourseId = data.moodleCourseId || null;
      if (
        data.moduleType === 'moodle' &&
        (data.moodleMode === 'lti' || data.moodleMode === 'offline') &&
        !data.moodleCourseId &&
        data.newCourseName &&
        data.moodleInstanceId
      ) {
        const newCourse = await adminApi.createMoodleCourse({
          instanceId: data.moodleInstanceId,
          remoteCourseId: data.newCourseRemoteId ?? 0,
          shortname: toSlug(data.newCourseName),
          fullname: data.newCourseName,
          summary: data.summary,
          language: data.language ?? 'fr',
        });
        resolvedCourseId = newCourse.id;
      }

      // 2. Create or update the module
      const modulePayload = {
        ...data,
        moodleCourseId: resolvedCourseId,
        creators: [],
        sponsors: [],
      };

      let savedModuleId: string;
      if (mode === 'create') {
        const saved = await adminApi.createModule(modulePayload);
        savedModuleId = saved.id;
      } else {
        await adminApi.updateModule(initialData.id, modulePayload);
        savedModuleId = initialData.id;
      }

      // 3. Create/update MoodleMap if LTI or OFFLINE
      if (
        data.moduleType === 'moodle' &&
        (data.moodleMode === 'lti' || data.moodleMode === 'offline')
      ) {
        const existingMaps = await adminApi.listMoodleMaps();
        const existingMap = existingMaps.items.find((m: any) => m.moduleId === savedModuleId);
        const mapPayload = {
          moduleId: savedModuleId,
          courseId: data.moodleMode === 'lti' ? (resolvedCourseId ?? '') : '',
          packageId: data.moodleMode === 'offline' ? (data.moodlePackageId ?? '') : '',
          mode: data.moodleMode === 'lti' ? 'LTI' : 'OFFLINE',
          note: '',
        };
        if (existingMap) {
          await adminApi.updateMoodleMap(existingMap.id, mapPayload as any);
        } else {
          await adminApi.createMoodleMap(mapPayload as any);
        }
      }

      onSave();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (confirm('Supprimer ce module ?')) {
      await adminApi.deleteModule(initialData.id);
      onSave();
    }
  };

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? 'Nouveau Module' : 'Modifier le Module'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configurez le contenu pédagogique et ses associations.
          </p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ COLONNE PRINCIPALE ══════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Informations générales */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <SectionHeader n={1} label="Informations générales" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du module *</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="Introduction à l'Histoire du Mali"
                  />
                  {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug (URL)
                    {slugAuto && <span className="ml-2 text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">AUTO</span>}
                  </Label>
                  <Input
                    id="slug"
                    {...form.register('slug')}
                    placeholder="introduction-histoire-mali"
                    onChange={e => { setSlugAuto(false); form.setValue('slug', e.target.value); }}
                  />
                  {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Résumé / Description *</Label>
                <Textarea
                  id="summary" rows={4}
                  {...form.register('summary')}
                  placeholder="Décrivez le contenu et les enjeux de ce module..."
                />
                {form.formState.errors.summary && <p className="text-xs text-red-500">{form.formState.errors.summary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Objectifs d'apprentissage *</Label>
                <div className="space-y-2">
                  {objectives.map((field, index) => (
                    <motion.div key={field.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                      <Input {...form.register(`objectives.${index}` as any)} placeholder={`Objectif ${index + 1}`} />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeObjective(index)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => appendObjective('' as any)}>
                  + Ajouter un objectif
                </Button>
                {form.formState.errors.objectives && <p className="text-xs text-red-500">{(form.formState.errors.objectives as any)?.message}</p>}
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Miniature</Label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setThumbMode('url')}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${thumbMode === 'url' ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-muted hover:border-primary'}`}>
                    🔗 URL
                  </button>
                  <button type="button" onClick={() => { setThumbMode('file'); thumbFileRef.current?.click(); }}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${thumbMode === 'file' ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-muted hover:border-primary'}`}>
                    📁 Fichier
                  </button>
                </div>
                <input ref={thumbFileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
                {thumbMode === 'url'
                  ? <Input {...form.register('thumbnail')} placeholder="https://..." />
                  : <div onClick={() => thumbFileRef.current?.click()}
                      className="border-2 border-dashed border-muted rounded-xl p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary transition-colors">
                      Cliquer pour choisir une image
                    </div>
                }
                {form.formState.errors.thumbnail && <p className="text-xs text-red-500">{form.formState.errors.thumbnail.message}</p>}
                {thumbPreview && (
                  <div className="relative rounded-xl overflow-hidden h-32 mt-2 bg-black">
                    <img src={thumbPreview} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                    <button type="button" onClick={() => { form.setValue('thumbnail', ''); setThumbPreview(''); setThumbMode('url'); }}
                      className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-1 hover:bg-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Type de module + Config Moodle */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <SectionHeader n={2} label="Type de module" />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'internal', label: '🏫 Interne', desc: 'Sections & leçons dans Kasuku' },
                  { v: 'moodle', label: '🎓 Moodle', desc: 'Cours hébergé sur Moodle' },
                ].map(opt => (
                  <button
                    key={opt.v} type="button"
                    onClick={() => form.setValue('moduleType', opt.v as any)}
                    className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                      moduleType === opt.v ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-muted hover:border-primary/40'
                    }`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* ── Moodle configuration ─────────────────────────────── */}
              <AnimatePresence>
                {moduleType === 'moodle' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="pt-4 border-t border-muted space-y-5">
                      <div>
                        <Label className="block mb-2">Mode d'accès</Label>
                        <div className="flex gap-2">
                          <ModePill active={moodleMode === 'url'} onClick={() => form.setValue('moodleMode', 'url')}>🔗 Lien direct</ModePill>
                          <ModePill active={moodleMode === 'lti'} onClick={() => form.setValue('moodleMode', 'lti')}>⚙️ LTI (via instance)</ModePill>
                          <ModePill active={moodleMode === 'offline'} onClick={() => form.setValue('moodleMode', 'offline')}>📦 Hors-ligne</ModePill>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {moodleMode === 'url' && 'Lien direct vers le cours Moodle (ouverture dans un nouvel onglet).'}
                          {moodleMode === 'lti' && 'Intégration via LTI — le cours s\'ouvre dans Kasuku avec authentification automatique.'}
                          {moodleMode === 'offline' && 'Package SCORM ou H5P téléchargé pour lecture hors connexion.'}
                        </p>
                      </div>

                      {/* URL directe */}
                      {moodleMode === 'url' && (
                        <div className="space-y-2">
                          <Label>URL du cours Moodle *</Label>
                          <Input {...form.register('moodleCourseUrl')} placeholder="https://moodle.exemple.com/course/view.php?id=42" />
                          {form.formState.errors.moodleCourseUrl && <p className="text-xs text-red-500">{form.formState.errors.moodleCourseUrl.message}</p>}
                        </div>
                      )}

                      {/* LTI / OFFLINE — Instance + Cours */}
                      {(moodleMode === 'lti' || moodleMode === 'offline') && (
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
                          <div className="space-y-2">
                            <Label>Instance Moodle *</Label>
                            {instances.length === 0 ? (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                ⚠️ Aucune instance Moodle configurée.{' '}
                                <span className="font-bold">Allez dans Admin → Moodle Instances pour en créer une.</span>
                              </div>
                            ) : (
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                {...form.register('moodleInstanceId')}
                              >
                                <option value="">— Sélectionner une instance —</option>
                                {instances.map(inst => (
                                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.baseUrl})</option>
                                ))}
                              </select>
                            )}
                            {form.formState.errors.moodleInstanceId && <p className="text-xs text-red-500">{form.formState.errors.moodleInstanceId.message}</p>}
                          </div>

                          {watchedInstanceId && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Cours Moodle</Label>
                                <button
                                  type="button"
                                  onClick={() => { setShowNewCourse(s => !s); form.setValue('moodleCourseId', ''); }}
                                  className="text-xs text-primary font-bold hover:underline"
                                >
                                  {showNewCourse ? '← Choisir existant' : '+ Nouveau cours'}
                                </button>
                              </div>

                              {showNewCourse ? (
                                <div className="space-y-3 p-3 bg-white rounded-lg border border-primary/20">
                                  <p className="text-xs text-muted-foreground font-medium">Créer un nouveau cours dans cette instance</p>
                                  <Input {...form.register('newCourseName')} placeholder="Nom complet du cours" />
                                  <Input type="number" {...form.register('newCourseRemoteId', { valueAsNumber: true })} placeholder="ID du cours Moodle (remoteCourseId)" />
                                </div>
                              ) : (
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  {...form.register('moodleCourseId')}
                                >
                                  <option value="">— Sélectionner un cours —</option>
                                  {filteredCourses.map(c => (
                                    <option key={c.id} value={c.id}>{c.fullname} ({c.shortname})</option>
                                  ))}
                                  {filteredCourses.length === 0 && (
                                    <option disabled>Aucun cours pour cette instance</option>
                                  )}
                                </select>
                              )}
                            </div>
                          )}

                          {/* OFFLINE — Package */}
                          {moodleMode === 'offline' && (watchedCourseId || showNewCourse) && (
                            <div className="space-y-2">
                              <Label>Package offline (SCORM / H5P)</Label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                {...form.register('moodlePackageId')}
                              >
                                <option value="">— Sélectionner un package —</option>
                                {filteredPackages.map(p => (
                                  <option key={p.id} value={p.id}>{p.title} ({p.type})</option>
                                ))}
                                {filteredPackages.length === 0 && (
                                  <option disabled>Aucun package — uploadez-en un via Admin → Moodle Packages</option>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Interne — Sections & Leçons ─────────────────────────── */}
              {moduleType === 'internal' && (
                <div className="pt-4 border-t border-muted space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-sm">Sections & Leçons</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendSection({ title: '', order: sections.length, lessons: [] })}>
                      + Section
                    </Button>
                  </div>
                  <AnimatePresence>
                    {sections.map((section, si) => (
                      <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 border border-muted rounded-xl bg-muted/5 space-y-3">
                        <div className="flex gap-3 items-center">
                          <Input className="flex-1" placeholder="Titre de la section" {...form.register(`sections.${si}.title`)} />
                          <Input type="number" className="w-20" {...form.register(`sections.${si}.order`, { valueAsNumber: true })} />
                          <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => removeSection(si)}>
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="pl-4 border-l-2 border-primary/20">
                          <LessonsArray sectionIndex={si} control={form.control} register={form.register} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {sections.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-muted rounded-xl">
                      <p className="text-muted-foreground text-sm italic">Aucune section — ajoutez-en une pour commencer.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Associations */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-5">
              <SectionHeader n={3} label="Associations" />

              {/* Events */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-sm">Événements liés au calendrier</Label>
                  {watchedEventIds.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      {watchedEventIds.length} sélectionné{watchedEventIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Ce module apparaîtra dans la fiche des événements sélectionnés.</p>
                <Input
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  placeholder="🔍 Rechercher un événement..."
                  className="h-9"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 border border-muted rounded-xl p-2">
                  {filteredEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun événement trouvé</p>
                  )}
                  {filteredEvents.map((ev: any) => {
                    const checked = watchedEventIds.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          checked ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvent(ev.id)}
                          className="h-4 w-4 rounded text-primary"
                        />
                        <span className="text-sm font-medium flex-1 line-clamp-1">{ev.title}</span>
                        {ev.dateISO && <span className="text-xs text-muted-foreground shrink-0">{ev.dateISO}</span>}
                        {ev.year && !ev.dateISO && <span className="text-xs text-muted-foreground shrink-0">{ev.year}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <Label className="font-bold text-sm">Parcours (Timeline) associé</Label>
                <p className="text-xs text-muted-foreground">Un lien vers ce parcours sera affiché dans la page du module.</p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...form.register('timelineSlug')}
                >
                  <option value="">— Aucun parcours associé —</option>
                  {timelines.map((t: any) => (
                    <option key={t.id} value={t.slug}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ══ COLONNE DROITE ══════════════════════════════════════════════ */}
          <div className="space-y-6">

            {/* Métadonnées */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <h3 className="font-bold text-secondary text-sm uppercase tracking-wide mb-4">Métadonnées</h3>

              <div className="space-y-2">
                <Label>Niveau</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register('level')}>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Langue</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register('language')}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Durée estimée (min)</Label>
                <Input type="number" min={1} placeholder="60" {...form.register('durationMin', { valueAsNumber: true })} />
              </div>
            </div>

            {/* Actions */}
            <div className="bg-secondary p-6 rounded-2xl text-white space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider">Enregistrer</h3>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white border-none h-12 font-bold"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Enregistrement...
                  </span>
                ) : mode === 'create' ? '✓ Créer le module' : '✓ Mettre à jour'}
              </Button>
              {mode === 'edit' && (
                <Button
                  variant="destructive" type="button"
                  className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                  onClick={handleDelete}
                >
                  Supprimer
                </Button>
              )}
              <p className="text-white/40 text-[10px] text-center">
                {moduleType === 'moodle' && (moodleMode === 'lti' || moodleMode === 'offline')
                  ? 'Le module Moodle et la cartographie seront créés en une seule opération.'
                  : 'Les associations événements sont mises à jour automatiquement.'}
              </p>
            </div>

            {/* Résumé des associations */}
            {(watchedEventIds.length > 0 || form.watch('timelineSlug')) && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Associations actives</p>
                {watchedEventIds.length > 0 && (
                  <p className="text-xs text-secondary">📅 {watchedEventIds.length} événement{watchedEventIds.length > 1 ? 's' : ''} lié{watchedEventIds.length > 1 ? 's' : ''}</p>
                )}
                {form.watch('timelineSlug') && (
                  <p className="text-xs text-secondary">🎬 Parcours : <span className="font-bold">{form.watch('timelineSlug')}</span></p>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Lessons sub-array ───────────────────────────────────────────────────────
const LessonsArray = ({ sectionIndex, control, register }: { sectionIndex: number; control: any; register: any }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `sections.${sectionIndex}.lessons` as any });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Leçons</span>
        <Button type="button" size="sm" variant="ghost" className="text-primary h-6 text-[10px] px-2"
          onClick={() => append({ title: '', order: fields.length, type: 'video' })}>
          + Leçon
        </Button>
      </div>
      <AnimatePresence>
        {fields.map((lesson, li) => (
          <motion.div key={lesson.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="p-3 bg-white border border-muted rounded-lg shadow-sm space-y-2">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-6 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Titre</span>
                <Input className="h-8 text-xs" placeholder="Titre" {...register(`sections.${sectionIndex}.lessons.${li}.title`)} />
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Type</span>
                <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" {...register(`sections.${sectionIndex}.lessons.${li}.type`)}>
                  <option value="video">Vidéo</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Min</span>
                <Input className="h-8 text-xs" type="number" {...register(`sections.${sectionIndex}.lessons.${li}.durationMin`, { valueAsNumber: true })} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => remove(li)}>
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Input className="h-8 text-xs" placeholder="URL du média (optionnel)" {...register(`sections.${sectionIndex}.lessons.${li}.url`)} />
          </motion.div>
        ))}
      </AnimatePresence>
      {fields.length === 0 && (
        <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucune leçon dans cette section.</p>
      )}
    </div>
  );
};
