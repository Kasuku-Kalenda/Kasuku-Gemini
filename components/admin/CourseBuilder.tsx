
"use client";
/**
 * CourseBuilder — full LMS course authoring form
 * Tabs: Informations | Contenu (sections+lessons+quizzes) | Ressources | Évaluation & Certificat
 */
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
import type { Quiz, QuizQuestion } from '../../types';

interface CourseBuilderProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const uid = () => crypto.randomUUID();

// ─── Tab pill ────────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children, badge }: { active: boolean; onClick: () => void; children: React.ReactNode; badge?: number }) => (
  <button
    type="button" onClick={onClick}
    className={`relative px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      active ? 'bg-primary text-white shadow-md' : 'text-secondary/70 hover:text-secondary hover:bg-muted/60'
    }`}
  >
    {children}
    {badge != null && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

// ─── Inline Quiz Builder ──────────────────────────────────────────────────────
interface QuizBuilderProps {
  quiz: Quiz | null | undefined;
  onChange: (quiz: Quiz | null) => void;
  label?: string;
}

function QuizBuilder({ quiz, onChange, label = 'Quiz de validation' }: QuizBuilderProps) {
  const [open, setOpen] = useState(!!quiz);

  const addQuestion = () => {
    const base = quiz ?? { id: uid(), title: label, passingScore: 70, questions: [] };
    onChange({
      ...base,
      questions: [...base.questions, {
        id: uid(), question: '', type: 'multiple_choice',
        options: ['', '', '', ''], correctIndex: 0, explanation: '',
      }],
    });
    setOpen(true);
  };

  const removeQuestion = (idx: number) => {
    if (!quiz) return;
    const updated = quiz.questions.filter((_, i) => i !== idx);
    onChange(updated.length === 0 ? null : { ...quiz, questions: updated });
    if (updated.length === 0) setOpen(false);
  };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) => i === idx ? { ...q, ...patch } : q);
    onChange({ ...quiz, questions });
  };

  return (
    <div className="border border-muted rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-base">🧠</span>
          <span className="font-bold text-sm text-secondary">{label}</span>
          {quiz && quiz.questions.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
              {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quiz && quiz.questions.length > 0 && (
            <button type="button" onClick={() => setOpen(o => !o)}
              className="text-xs text-primary font-bold hover:underline">
              {open ? 'Réduire' : 'Modifier'}
            </button>
          )}
          <Button type="button" size="sm" variant="outline"
            className="h-7 text-[10px] px-3"
            onClick={addQuestion}>
            + Question
          </Button>
          {quiz && <button type="button" onClick={() => { onChange(null); setOpen(false); }}
            className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>}
        </div>
      </div>

      {open && quiz && quiz.questions.length > 0 && (
        <div className="p-4 space-y-4 bg-white">
          {/* Passing score */}
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Score de passage</Label>
            <input type="range" min={50} max={100} step={5}
              value={quiz.passingScore}
              onChange={e => onChange({ ...quiz, passingScore: +e.target.value })}
              className="flex-1 accent-primary" />
            <span className="text-sm font-black text-primary w-10 text-right">{quiz.passingScore}%</span>
          </div>

          {/* Questions */}
          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="p-4 bg-muted/20 rounded-xl border border-muted space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-1">{qi + 1}</span>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={q.question}
                      onChange={e => updateQuestion(qi, { question: e.target.value })}
                      placeholder="Formulez votre question..."
                      className="flex-1"
                    />
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(qi, {
                        type: e.target.value as any,
                        options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : undefined,
                        correctIndex: e.target.value === 'multiple_choice' ? 0 : undefined,
                        correctBool: e.target.value === 'true_false' ? true : undefined,
                      })}
                      className="flex h-10 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="multiple_choice">QCM</option>
                      <option value="true_false">Vrai / Faux</option>
                    </select>
                  </div>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctIndex === oi}
                            onChange={() => updateQuestion(qi, { correctIndex: oi })}
                            className="shrink-0 accent-green-500"
                          />
                          <Input
                            value={opt}
                            onChange={e => {
                              const opts = [...(q.options ?? [])];
                              opts[oi] = e.target.value;
                              updateQuestion(qi, { options: opts });
                            }}
                            placeholder={`Option ${oi + 1}${oi === q.correctIndex ? ' ✓ (correcte)' : ''}`}
                            className={`flex-1 h-8 text-sm ${q.correctIndex === oi ? 'border-green-400 bg-green-50' : ''}`}
                          />
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground">Sélectionnez le bouton radio devant la bonne réponse.</p>
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex gap-3">
                      {[true, false].map(val => (
                        <label key={String(val)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                            q.correctBool === val ? 'border-green-400 bg-green-50 text-green-700 font-bold' : 'border-muted hover:border-primary/30'
                          }`}>
                          <input type="radio" checked={q.correctBool === val}
                            onChange={() => updateQuestion(qi, { correctBool: val })}
                            className="accent-green-500" />
                          <span className="text-sm">{val ? '✓ Vrai' : '✗ Faux'}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <Input
                    value={q.explanation ?? ''}
                    onChange={e => updateQuestion(qi, { explanation: e.target.value })}
                    placeholder="Explication (affichée après la réponse)..."
                    className="text-sm bg-amber-50 border-amber-200 placeholder:text-amber-400"
                  />
                </div>
                <button type="button" onClick={() => removeQuestion(qi)}
                  className="text-red-400 hover:text-red-600 mt-1 shrink-0">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Resource row ────────────────────────────────────────────────────────────
const RESOURCE_ICONS: Record<string, string> = {
  audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄', link: '🔗', event: '📅', timeline: '🎭',
};

// ─── Main CourseBuilder ──────────────────────────────────────────────────────
export function CourseBuilder({ mode, initialData, onSave }: CourseBuilderProps) {
  const [tab, setTab] = useState<'info' | 'content' | 'resources' | 'assessment'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [slugAuto, setSlugAuto] = useState(mode === 'create');
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [thumbPreview, setThumbPreview] = useState<string>(initialData?.thumbnail || '');
  const thumbRef = useRef<HTMLInputElement>(null);

  // ── Form setup ────────────────────────────────────────────────────────────
  const makeDefaults = () => ({
    title: '', slug: '', summary: '',
    objectives: [''],
    level: 'Débutant' as const, language: 'fr' as const, durationMin: null,
    thumbnail: '', tags: [], eventIds: [],
    creatorIds: [], sponsorIds: [],
    sections: [],
    moduleType: 'internal' as const,
    moodleMode: null, moodleCourseUrl: '', moodleInstanceId: '',
    moodleCourseId: '', moodlePackageId: '', timelineSlug: '',
    resources: [], finalQuiz: null, hasCertificate: false, certificateName: '',
  });

  const form = useForm<ModuleFormData>({
    defaultValues: initialData ? {
      ...makeDefaults(), ...initialData,
      objectives: initialData.objectives?.length ? initialData.objectives : [''],
      resources: initialData.resources ?? [],
      finalQuiz: initialData.finalQuiz ?? null,
      hasCertificate: initialData.hasCertificate ?? false,
      certificateName: initialData.certificateName ?? '',
    } : makeDefaults(),
  });

  const { fields: sectionsFields, append: appendSection, remove: removeSection } =
    useFieldArray({ control: form.control, name: 'sections' });
  const { fields: objectivesFields, append: appendObjective, remove: removeObjective } =
    useFieldArray({ control: form.control, name: 'objectives' as any });
  const { fields: resourcesFields, append: appendResource, remove: removeResource } =
    useFieldArray({ control: form.control, name: 'resources' });

  const watchedTitle = form.watch('title');
  const watchedSections = form.watch('sections') ?? [];
  const watchedResources = form.watch('resources') ?? [];
  const watchedHasCert = form.watch('hasCertificate');
  const watchedThumb = form.watch('thumbnail');
  const watchedFinalQuiz = form.watch('finalQuiz') as Quiz | null;

  useEffect(() => {
    Promise.all([
      adminApi.listEvents().then(r => setAllEvents(r.items)),
      adminApi.listTimelines().then(r => setTimelines(r.items)),
    ]);
  }, []);

  useEffect(() => {
    if (slugAuto && watchedTitle) form.setValue('slug', toSlug(watchedTitle));
  }, [watchedTitle, slugAuto]);

  useEffect(() => {
    setThumbPreview(watchedThumb || '');
  }, [watchedThumb]);

  // ── Lesson helpers ────────────────────────────────────────────────────────
  const addLesson = (sectionIdx: number) => {
    const sections = form.getValues('sections') as any[];
    const updated = sections.map((s: any, i: number) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        lessons: [...(s.lessons ?? []), {
          id: uid(), title: '', type: 'video', durationMin: null,
          url: '', content: '', order: (s.lessons?.length ?? 0), quiz: null,
        }],
      };
    });
    form.setValue('sections', updated as any);
  };

  const removeLesson = (sectionIdx: number, lessonIdx: number) => {
    const sections = form.getValues('sections') as any[];
    const updated = sections.map((s: any, i: number) => {
      if (i !== sectionIdx) return s;
      return { ...s, lessons: s.lessons.filter((_: any, li: number) => li !== lessonIdx) };
    });
    form.setValue('sections', updated as any);
  };

  const updateLessonQuiz = (sectionIdx: number, lessonIdx: number, quiz: Quiz | null) => {
    const sections = form.getValues('sections') as any[];
    const updated = sections.map((s: any, si: number) => {
      if (si !== sectionIdx) return s;
      return {
        ...s,
        lessons: s.lessons.map((l: any, li: number) =>
          li === lessonIdx ? { ...l, quiz } : l,
        ),
      };
    });
    form.setValue('sections', updated as any);
  };

  const updateSectionQuiz = (sectionIdx: number, quiz: Quiz | null) => {
    const sections = form.getValues('sections') as any[];
    const updated = sections.map((s: any, i: number) =>
      i === sectionIdx ? { ...s, quiz } : s,
    );
    form.setValue('sections', updated as any);
  };

  // Total lesson count for badge
  const totalLessons = watchedSections.reduce((acc: number, s: any) => acc + (s.lessons?.length ?? 0), 0);
  const totalResources = watchedResources.length;
  const hasAssessment = !!watchedFinalQuiz || watchedHasCert;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (rawData: ModuleFormData) => {
    const result = await moduleFormSchema.safeParseAsync(rawData);
    if (!result.success) {
      const flat = result.error.flatten();
      Object.entries(flat.fieldErrors).forEach(([f, msgs]) =>
        form.setError(f as any, { message: (msgs as string[])[0] }),
      );
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...result.data, creators: [], sponsors: [] };
      if (mode === 'create') await adminApi.createModule(payload);
      else await adminApi.updateModule(initialData.id, payload);
      onSave();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Supprimer ce module ?')) return;
    await adminApi.deleteModule(initialData.id);
    onSave();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? 'Nouveau cours' : 'Modifier le cours'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Construisez un parcours d'apprentissage complet.</p>
        </div>
        <Button variant="outline" onClick={onSave}>Annuler</Button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        <Tab active={tab === 'info'} onClick={() => setTab('info')}>📋 Informations</Tab>
        <Tab active={tab === 'content'} onClick={() => setTab('content')} badge={totalLessons}>
          📚 Contenu
        </Tab>
        <Tab active={tab === 'resources'} onClick={() => setTab('resources')} badge={totalResources}>
          🔗 Ressources
        </Tab>
        <Tab active={tab === 'assessment'} onClick={() => setTab('assessment')} badge={hasAssessment ? 1 : 0}>
          🏆 Évaluation
        </Tab>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>

        {/* ══════ TAB: INFORMATIONS ══════════════════════════════════════════ */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre du cours *</Label>
                    <Input {...form.register('title')} placeholder="Ex : Histoire du Franc CFA" />
                    {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Slug
                      {slugAuto && <span className="ml-2 text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded-full">AUTO</span>}
                    </Label>
                    <Input {...form.register('slug')} placeholder="histoire-franc-cfa"
                      onChange={e => { setSlugAuto(false); form.setValue('slug', e.target.value); }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description / Accroche *</Label>
                  <Textarea rows={4} {...form.register('summary')}
                    placeholder="Pourquoi ce cours ? Que va apprendre l'apprenant ?" />
                  {form.formState.errors.summary && <p className="text-xs text-red-500">{form.formState.errors.summary.message}</p>}
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                  <Label>Objectifs d'apprentissage</Label>
                  {objectivesFields.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                      <span className="w-6 h-10 flex items-center justify-center text-xs text-muted-foreground font-bold shrink-0">{i + 1}.</span>
                      <Input {...form.register(`objectives.${i}` as any)} placeholder={`Objectif ${i + 1}`} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeObjective(i)}>
                        <XIcon className="h-4 w-4 text-red-400" />
                      </Button>
                    </motion.div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendObjective('' as any)}>
                    + Ajouter un objectif
                  </Button>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Image de couverture</Label>
                  <div className="flex gap-2">
                    <Input {...form.register('thumbnail')} placeholder="https://..." className="flex-1" />
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => thumbRef.current?.click()}>📁</Button>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const r = new FileReader();
                        r.onload = ev => { const d = ev.target?.result as string; form.setValue('thumbnail', d); setThumbPreview(d); };
                        r.readAsDataURL(f);
                      }} />
                  </div>
                  {thumbPreview && (
                    <div className="relative h-32 rounded-xl overflow-hidden bg-black mt-2">
                      <img src={thumbPreview} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => { form.setValue('thumbnail', ''); setThumbPreview(''); }}
                        className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 hover:bg-red-500 transition-colors">✕</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wide text-secondary">Métadonnées</h3>
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
                  <Label>Durée estimée (minutes)</Label>
                  <Input type="number" min={1} placeholder="90" {...form.register('durationMin', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Parcours (Timeline) lié</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register('timelineSlug')}>
                    <option value="">— Aucun —</option>
                    {timelines.map((t: any) => <option key={t.id} value={t.slug}>{t.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-secondary p-6 rounded-2xl text-white space-y-3">
                <Button type="submit" disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold border-none">
                  {isSaving ? '⏳ Enregistrement...' : mode === 'create' ? '✓ Créer le cours' : '✓ Mettre à jour'}
                </Button>
                {mode === 'edit' && (
                  <Button type="button" variant="destructive"
                    className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                    onClick={handleDelete}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: CONTENU ════════════════════════════════════════════════ */}
        {tab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-secondary">Structure du cours</p>
                <p className="text-xs text-muted-foreground mt-0.5">Organisez votre cours en chapitres (sections) et leçons. Ajoutez un quiz après chaque leçon ou chapitre.</p>
              </div>
              <Button type="button" variant="outline"
                onClick={() => appendSection({ id: uid(), title: '', description: '', order: sectionsFields.length, lessons: [], quiz: null } as any)}>
                + Nouveau chapitre
              </Button>
            </div>

            <AnimatePresence>
              {sectionsFields.map((section, si) => {
                const sectionLessons = (form.watch(`sections.${si}.lessons` as any) ?? []) as any[];
                const sectionQuiz = form.watch(`sections.${si}.quiz` as any) as Quiz | null;

                return (
                  <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    className="bg-white rounded-2xl border border-muted shadow-sm overflow-hidden">
                    {/* Chapter header */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-secondary/5 border-b border-muted">
                      <span className="w-8 h-8 rounded-lg bg-secondary text-white text-sm font-black flex items-center justify-center shrink-0">
                        {si + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input {...form.register(`sections.${si}.title` as any)}
                          placeholder="Titre du chapitre"
                          className="font-bold h-9" />
                        <Input {...form.register(`sections.${si}.description` as any)}
                          placeholder="Description du chapitre (optionnel)"
                          className="h-9 text-sm" />
                      </div>
                      <button type="button" onClick={() => removeSection(si)}
                        className="text-red-400 hover:text-red-600 shrink-0">
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Lessons */}
                    <div className="p-5 space-y-3">
                      <AnimatePresence>
                        {sectionLessons.map((lesson: any, li: number) => {
                          const lessonQuiz = lesson.quiz as Quiz | null;
                          return (
                            <motion.div key={lesson.id ?? li}
                              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                              className="border border-muted rounded-xl overflow-hidden">
                              {/* Lesson header */}
                              <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
                                <span className="text-base shrink-0">
                                  {lesson.type === 'video' ? '🎬' : lesson.type === 'audio' ? '🎵' : lesson.type === 'pdf' ? '📄' : lesson.type === 'text' ? '📝' : '🧠'}
                                </span>
                                <Input
                                  value={lesson.title}
                                  onChange={e => {
                                    const s = form.getValues('sections') as any[];
                                    s[si].lessons[li].title = e.target.value;
                                    form.setValue('sections', s as any);
                                  }}
                                  placeholder="Titre de la leçon"
                                  className="flex-1 h-8 text-sm font-medium"
                                />
                                <select
                                  value={lesson.type}
                                  onChange={e => {
                                    const s = form.getValues('sections') as any[];
                                    s[si].lessons[li].type = e.target.value;
                                    form.setValue('sections', s as any);
                                  }}
                                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                >
                                  <option value="video">🎬 Vidéo</option>
                                  <option value="audio">🎵 Audio</option>
                                  <option value="pdf">📄 PDF</option>
                                  <option value="text">📝 Texte</option>
                                </select>
                                <Input
                                  type="number" min={1} placeholder="min"
                                  value={lesson.durationMin ?? ''}
                                  onChange={e => {
                                    const s = form.getValues('sections') as any[];
                                    s[si].lessons[li].durationMin = e.target.value ? +e.target.value : null;
                                    form.setValue('sections', s as any);
                                  }}
                                  className="w-16 h-8 text-xs"
                                />
                                <button type="button" onClick={() => removeLesson(si, li)}
                                  className="text-red-400 hover:text-red-600 shrink-0">
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Lesson content inputs */}
                              <div className="px-4 py-3 space-y-2 bg-white">
                                {(lesson.type === 'video' || lesson.type === 'audio' || lesson.type === 'pdf') && (
                                  <Input
                                    value={lesson.url ?? ''}
                                    onChange={e => {
                                      const s = form.getValues('sections') as any[];
                                      s[si].lessons[li].url = e.target.value;
                                      form.setValue('sections', s as any);
                                    }}
                                    placeholder={
                                      lesson.type === 'video' ? 'URL de la vidéo (YouTube, Vimeo, MP4...)' :
                                      lesson.type === 'audio' ? 'URL du fichier audio (MP3, OGG...)' :
                                      'URL du PDF'
                                    }
                                    className="h-8 text-sm"
                                  />
                                )}
                                {lesson.type === 'text' && (
                                  <Textarea
                                    value={lesson.content ?? ''}
                                    onChange={e => {
                                      const s = form.getValues('sections') as any[];
                                      s[si].lessons[li].content = e.target.value;
                                      form.setValue('sections', s as any);
                                    }}
                                    placeholder="Contenu de la leçon (texte, markdown...)..."
                                    rows={4}
                                    className="text-sm"
                                  />
                                )}
                                {(lesson.type === 'video' || lesson.type === 'audio') && (
                                  <Input
                                    value={lesson.transcript ?? ''}
                                    onChange={e => {
                                      const s = form.getValues('sections') as any[];
                                      s[si].lessons[li].transcript = e.target.value;
                                      form.setValue('sections', s as any);
                                    }}
                                    placeholder="Transcription / sous-titres (optionnel)"
                                    className="h-8 text-xs text-muted-foreground"
                                  />
                                )}

                                {/* Per-lesson quiz */}
                                <div className="pt-1">
                                  <QuizBuilder
                                    quiz={lessonQuiz}
                                    onChange={q => updateLessonQuiz(si, li, q)}
                                    label="Quiz après cette leçon"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {sectionLessons.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-muted rounded-xl text-sm text-muted-foreground italic">
                          Aucune leçon dans ce chapitre
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => addLesson(si)}>
                          + Ajouter une leçon
                        </Button>
                        {/* Chapter quiz */}
                        <div className="flex-1">
                          <QuizBuilder
                            quiz={sectionQuiz}
                            onChange={q => updateSectionQuiz(si, q)}
                            label="Quiz de fin de chapitre"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {sectionsFields.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
                <p className="text-4xl mb-3">📚</p>
                <p className="font-bold text-secondary">Aucun chapitre créé</p>
                <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter un chapitre à votre cours.</p>
                <Button type="button" onClick={() => appendSection({ id: uid(), title: '', order: 0, lessons: [], quiz: null } as any)}>
                  + Créer le premier chapitre
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement...' : '✓ Enregistrer le cours'}
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TAB: RESSOURCES ═════════════════════════════════════════════ */}
        {tab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-secondary">Ressources complémentaires</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enrichissez le cours avec des médias, événements et récits.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {([
                  ['audio', '🎵 Audio'], ['video', '🎬 Vidéo'], ['image', '🖼️ Image'],
                  ['pdf', '📄 PDF'], ['link', '🔗 Lien'],
                  ['event', '📅 Événement'], ['timeline', '🎭 Récit'],
                ] as [string, string][]).map(([type, label]) => (
                  <Button key={type} type="button" size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => appendResource({ id: uid(), type: type as any, title: '', url: '', eventId: '', timelineSlug: '', description: '' } as any)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {resourcesFields.map((resource, ri) => {
                const type = form.watch(`resources.${ri}.type` as any) as string;
                return (
                  <motion.div key={resource.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                    className="bg-white p-4 rounded-2xl border border-muted shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-1">{RESOURCE_ICONS[type] ?? '🔗'}</span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input {...form.register(`resources.${ri}.title` as any)} placeholder="Titre de la ressource" />
                        {['audio', 'video', 'image', 'pdf', 'link'].includes(type) && (
                          <Input {...form.register(`resources.${ri}.url` as any)}
                            placeholder={type === 'audio' ? 'URL audio (MP3...)' : type === 'video' ? 'URL vidéo...' : type === 'image' ? 'URL image...' : 'URL du lien'} />
                        )}
                        {type === 'event' && (
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...form.register(`resources.${ri}.eventId` as any)}>
                            <option value="">— Sélectionner un événement —</option>
                            {allEvents.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                          </select>
                        )}
                        {type === 'timeline' && (
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...form.register(`resources.${ri}.timelineSlug` as any)}>
                            <option value="">— Sélectionner un récit —</option>
                            {timelines.map((t: any) => <option key={t.id} value={t.slug}>{t.title}</option>)}
                          </select>
                        )}
                        <Input {...form.register(`resources.${ri}.description` as any)}
                          placeholder="Description (optionnel)"
                          className="md:col-span-2 text-sm" />
                      </div>
                      <button type="button" onClick={() => removeResource(ri)}
                        className="text-red-400 hover:text-red-600 mt-1 shrink-0">
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {resourcesFields.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
                <p className="text-4xl mb-3">🔗</p>
                <p className="font-bold text-secondary">Aucune ressource ajoutée</p>
                <p className="text-sm text-muted-foreground">Ajoutez des audios, vidéos, images, PDFs, liens, événements ou récits.</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement...' : '✓ Enregistrer'}
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TAB: ÉVALUATION & CERTIFICAT ════════════════════════════════ */}
        {tab === 'assessment' && (
          <div className="space-y-6">
            {/* Final quiz */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏅</span>
                <div>
                  <h3 className="font-bold text-secondary">Quiz final</h3>
                  <p className="text-xs text-muted-foreground">Évaluation globale à la fin du cours.</p>
                </div>
              </div>
              <QuizBuilder
                quiz={watchedFinalQuiz}
                onChange={q => form.setValue('finalQuiz', q as any)}
                label="Quiz final du cours"
              />
            </div>

            {/* Certificate */}
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-bold text-secondary">Certificat Kasuku</h3>
                  <p className="text-xs text-muted-foreground">Remis à l'apprenant à la fin du parcours.</p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => form.setValue('hasCertificate', !watchedHasCert)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${watchedHasCert ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${watchedHasCert ? 'translate-x-5' : ''}`} />
                </div>
                <span className="font-bold text-sm">Activer le certificat de complétion</span>
              </label>

              <AnimatePresence>
                {watchedHasCert && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden">
                    <div className="space-y-2">
                      <Label>Intitulé du certificat</Label>
                      <Input {...form.register('certificateName')}
                        placeholder="Certificat de maîtrise — Histoire du Franc CFA" />
                    </div>

                    {/* Certificate preview */}
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 text-center">Aperçu du certificat</p>
                      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto text-center border border-primary/10">
                        <div className="flex justify-center mb-3">
                          <img src="https://i.postimg.cc/8cYFbspt/Kasuku-logo.png" alt="Kasuku" className="h-12 w-12 rounded-full" />
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Kasuku Academy</p>
                        <p className="font-black text-secondary text-lg leading-tight mb-2">
                          {form.watch('certificateName') || 'Certificat de complétion'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">Décerné à</p>
                        <p className="font-bold text-primary text-base border-b border-dashed border-primary/30 pb-2 mb-2">Prénom Nom</p>
                        <p className="text-xs text-muted-foreground">Pour avoir complété avec succès</p>
                        <p className="font-bold text-sm text-secondary mt-0.5">{form.watch('title') || 'Nom du cours'}</p>
                        <p className="text-[10px] text-muted-foreground mt-3">{new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement...' : '✓ Enregistrer le cours'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
