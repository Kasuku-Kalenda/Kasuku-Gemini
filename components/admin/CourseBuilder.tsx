
"use client";
/**
 * CourseBuilder — LMS course authoring form
 * Tabs: Informations | Contenu | Ressources | Évaluation & Certificat
 *
 * Fixes vs v1:
 *  - zodResolver → proper inline validation, save button works
 *  - SectionCard + LessonCard memoized with nested useFieldArray → no per-keystroke full re-render
 *  - objectives managed as local state (not useFieldArray on primitives)
 *  - eventIds picker in info tab
 *  - file upload buttons for lesson media + course resources
 */
import React, {
  useState, useEffect, useRef, useCallback, memo,
} from 'react';
import {
  useForm, useFieldArray, useWatch, Controller,
  type Control, type UseFormRegister, type UseFormGetValues, type UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moduleFormSchema, type ModuleFormData } from '../../schemas/admin';
import { adminApi } from '../../services/adminApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { XIcon } from '../icons/XIcon';
import { motion, AnimatePresence } from 'motion/react';
import type { Quiz, QuizQuestion } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────────────
const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const uid = () => crypto.randomUUID();

const LESSON_EMOJI: Record<string, string> = {
  video: '🎬', audio: '🎵', pdf: '📄', text: '📝', quiz: '🧠',
};
const RESOURCE_ICONS: Record<string, string> = {
  audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄', link: '🔗', event: '📅', timeline: '🎭',
};

// ─── Tab pill ────────────────────────────────────────────────────────────────
const Tab = ({
  active, onClick, children, badge,
}: { active: boolean; onClick: () => void; children: React.ReactNode; badge?: number }) => (
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

// ─── Quiz Builder ─────────────────────────────────────────────────────────────
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
      questions: [
        ...base.questions,
        { id: uid(), question: '', type: 'multiple_choice', options: ['', '', '', ''], correctIndex: 0, explanation: '' },
      ],
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
    onChange({ ...quiz, questions: quiz.questions.map((q, i) => i === idx ? { ...q, ...patch } : q) });
  };

  return (
    <div className="border border-muted rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-base">🧠</span>
          <span className="font-bold text-sm text-secondary">{label}</span>
          {quiz && quiz.questions.length > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
              {quiz.questions.length} q
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
          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] px-3" onClick={addQuestion}>
            + Question
          </Button>
          {quiz && (
            <button type="button" onClick={() => { onChange(null); setOpen(false); }}
              className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
          )}
        </div>
      </div>

      {open && quiz && quiz.questions.length > 0 && (
        <div className="p-4 space-y-4 bg-white">
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Score de passage</Label>
            <input type="range" min={50} max={100} step={5}
              value={quiz.passingScore}
              onChange={e => onChange({ ...quiz, passingScore: +e.target.value })}
              className="flex-1 accent-primary" />
            <span className="text-sm font-black text-primary w-10 text-right">{quiz.passingScore}%</span>
          </div>

          {quiz.questions.map((q, qi) => (
            <div key={q.id ?? qi} className="p-4 bg-muted/20 rounded-xl border border-muted space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-1">
                  {qi + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Input value={q.question} onChange={e => updateQuestion(qi, { question: e.target.value })}
                      placeholder="Formulez votre question..." className="flex-1" />
                    <select value={q.type}
                      onChange={e => updateQuestion(qi, {
                        type: e.target.value as any,
                        options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : undefined,
                        correctIndex: e.target.value === 'multiple_choice' ? 0 : undefined,
                        correctBool: e.target.value === 'true_false' ? true : undefined,
                      })}
                      className="flex h-10 rounded-md border border-input bg-background px-2 text-xs">
                      <option value="multiple_choice">QCM</option>
                      <option value="true_false">Vrai / Faux</option>
                    </select>
                  </div>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${q.id}-${qi}`} checked={q.correctIndex === oi}
                            onChange={() => updateQuestion(qi, { correctIndex: oi })}
                            className="shrink-0 accent-green-500" />
                          <Input value={opt}
                            onChange={e => {
                              const opts = [...(q.options ?? [])];
                              opts[oi] = e.target.value;
                              updateQuestion(qi, { options: opts });
                            }}
                            placeholder={`Option ${oi + 1}${oi === q.correctIndex ? ' ✓' : ''}`}
                            className={`flex-1 h-8 text-sm ${q.correctIndex === oi ? 'border-green-400 bg-green-50' : ''}`} />
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground">Radio = bonne réponse</p>
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex gap-3">
                      {([true, false] as const).map(val => (
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

                  <Input value={q.explanation ?? ''}
                    onChange={e => updateQuestion(qi, { explanation: e.target.value })}
                    placeholder="Explication (affichée après la réponse)..."
                    className="text-sm bg-amber-50 border-amber-200 placeholder:text-amber-400" />
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

// ─── Lesson Card (fully memoized — owns its own field subscriptions) ──────────
interface LessonCardProps {
  si: number; li: number;
  control: Control<ModuleFormData>;
  register: UseFormRegister<ModuleFormData>;
  setValue: UseFormSetValue<ModuleFormData>;
  onRemove: () => void;
}

const LessonCard = memo(({ si, li, control, register, setValue, onRemove }: LessonCardProps) => {
  const lessonType = useWatch({ control, name: `sections.${si}.lessons.${li}.type` as any }) as string;
  const lessonQuiz = useWatch({ control, name: `sections.${si}.lessons.${li}.quiz` as any }) as Quiz | null;
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = lessonType === 'audio' ? 'audio/*' : lessonType === 'video' ? 'video/*,audio/*' : '.pdf,application/pdf';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setValue(`sections.${si}.lessons.${li}.url` as any, ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="border border-muted rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
        <span className="text-base shrink-0">{LESSON_EMOJI[lessonType] ?? '📝'}</span>
        <Input
          {...register(`sections.${si}.lessons.${li}.title` as any)}
          placeholder="Titre de la leçon"
          className="flex-1 h-8 text-sm font-medium"
        />
        <Controller
          control={control}
          name={`sections.${si}.lessons.${li}.type` as any}
          render={({ field }) => (
            <select {...field} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
              <option value="video">🎬 Vidéo</option>
              <option value="audio">🎵 Audio</option>
              <option value="pdf">📄 PDF</option>
              <option value="text">📝 Texte</option>
            </select>
          )}
        />
        <Input
          type="number" min={1} placeholder="min"
          {...register(`sections.${si}.lessons.${li}.durationMin` as any, { valueAsNumber: true })}
          className="w-16 h-8 text-xs"
        />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 shrink-0">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {(lessonType === 'video' || lessonType === 'audio' || lessonType === 'pdf') && (
          <div className="flex gap-2">
            <Input
              {...register(`sections.${si}.lessons.${li}.url` as any)}
              placeholder={
                lessonType === 'video' ? 'URL YouTube, Vimeo, MP4…' :
                lessonType === 'audio' ? 'URL MP3, OGG…' : 'URL PDF'
              }
              className="flex-1 h-8 text-sm"
            />
            <Button type="button" variant="outline" size="sm" className="h-8 px-3 shrink-0"
              onClick={() => fileRef.current?.click()}>
              📁
            </Button>
            <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
          </div>
        )}

        {lessonType === 'text' && (
          <Textarea
            {...register(`sections.${si}.lessons.${li}.content` as any)}
            placeholder="Contenu de la leçon (texte, markdown…)"
            rows={4} className="text-sm"
          />
        )}

        {(lessonType === 'video' || lessonType === 'audio') && (
          <Input
            {...register(`sections.${si}.lessons.${li}.transcript` as any)}
            placeholder="Transcription / sous-titres (optionnel)"
            className="h-8 text-xs text-muted-foreground"
          />
        )}

        <div className="pt-1">
          <QuizBuilder
            quiz={lessonQuiz}
            onChange={q => setValue(`sections.${si}.lessons.${li}.quiz` as any, q)}
            label="Quiz après cette leçon"
          />
        </div>
      </div>
    </div>
  );
});

// ─── Section Card (memoized — owns nested lesson useFieldArray) ───────────────
interface SectionCardProps {
  si: number;
  control: Control<ModuleFormData>;
  register: UseFormRegister<ModuleFormData>;
  setValue: UseFormSetValue<ModuleFormData>;
  onRemove: () => void;
}

const SectionCard = memo(({ si, control, register, setValue, onRemove }: SectionCardProps) => {
  const { fields: lessonFields, append: appendLesson, remove: removeLesson } =
    useFieldArray({ control, name: `sections.${si}.lessons` as any });

  const sectionQuiz = useWatch({ control, name: `sections.${si}.quiz` as any }) as Quiz | null;

  return (
    <div className="bg-white rounded-2xl border border-muted shadow-sm overflow-hidden">
      {/* Chapter header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-secondary/5 border-b border-muted">
        <span className="w-8 h-8 rounded-lg bg-secondary text-white text-sm font-black flex items-center justify-center shrink-0">
          {si + 1}
        </span>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            {...register(`sections.${si}.title` as any)}
            placeholder="Titre du chapitre *"
            className="font-bold h-9"
          />
          <Input
            {...register(`sections.${si}.description` as any)}
            placeholder="Description (optionnel)"
            className="h-9 text-sm"
          />
        </div>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 shrink-0">
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Lessons */}
      <div className="p-5 space-y-3">
        {lessonFields.length === 0 && (
          <div className="text-center py-5 border-2 border-dashed border-muted rounded-xl text-sm text-muted-foreground italic">
            Aucune leçon — cliquez « + Ajouter une leçon »
          </div>
        )}

        {lessonFields.map((lf, li) => (
          <LessonCard
            key={lf.id}
            si={si} li={li}
            control={control} register={register} setValue={setValue}
            onRemove={() => removeLesson(li)}
          />
        ))}

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <Button
            type="button" size="sm" variant="outline"
            onClick={() => appendLesson({
              id: uid(), title: '', type: 'video',
              durationMin: null, url: '', content: '', transcript: '', order: lessonFields.length, quiz: null,
            } as any)}
          >
            + Ajouter une leçon
          </Button>
          <div className="flex-1 min-w-0">
            <QuizBuilder
              quiz={sectionQuiz}
              onChange={q => setValue(`sections.${si}.quiz` as any, q)}
              label="Quiz de fin de chapitre"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Resource Row ─────────────────────────────────────────────────────────────
interface ResourceRowProps {
  ri: number;
  control: Control<ModuleFormData>;
  register: UseFormRegister<ModuleFormData>;
  setValue: UseFormSetValue<ModuleFormData>;
  allEvents: any[];
  timelines: any[];
  onRemove: () => void;
}

const ResourceRow = memo(({ ri, control, register, setValue, allEvents, timelines, onRemove }: ResourceRowProps) => {
  const type = useWatch({ control, name: `resources.${ri}.type` as any }) as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const fileAccept = type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : type === 'image' ? 'image/*' : '.pdf,application/pdf';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setValue(`resources.${ri}.url` as any, ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-muted shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-1">{RESOURCE_ICONS[type] ?? '🔗'}</span>
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              {...register(`resources.${ri}.title` as any)}
              placeholder="Titre de la ressource *"
            />
            {['audio', 'video', 'image', 'pdf', 'link'].includes(type) && (
              <div className="flex gap-2">
                <Input
                  {...register(`resources.${ri}.url` as any)}
                  placeholder={
                    type === 'audio' ? 'URL audio ou choisir un fichier' :
                    type === 'video' ? 'URL vidéo ou fichier' :
                    type === 'image' ? 'URL image ou fichier' :
                    type === 'pdf' ? 'URL PDF ou fichier' : 'https://…'
                  }
                  className="flex-1"
                />
                {type !== 'link' && (
                  <>
                    <Button type="button" variant="outline" size="sm" className="h-10 px-3 shrink-0"
                      onClick={() => fileRef.current?.click()}>
                      📁
                    </Button>
                    <input ref={fileRef} type="file" accept={fileAccept} className="hidden" onChange={handleFile} />
                  </>
                )}
              </div>
            )}
            {type === 'event' && (
              <Controller control={control} name={`resources.${ri}.eventId` as any}
                render={({ field }) => (
                  <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— Sélectionner un événement —</option>
                    {allEvents.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                )} />
            )}
            {type === 'timeline' && (
              <Controller control={control} name={`resources.${ri}.timelineSlug` as any}
                render={({ field }) => (
                  <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— Sélectionner un récit —</option>
                    {timelines.map((t: any) => <option key={t.id} value={t.slug}>{t.title}</option>)}
                  </select>
                )} />
            )}
          </div>
          <Input
            {...register(`resources.${ri}.description` as any)}
            placeholder="Description (optionnel)"
            className="text-sm"
          />
        </div>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 mt-1 shrink-0">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
});

// ─── Main CourseBuilder ───────────────────────────────────────────────────────
interface CourseBuilderProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSave: () => void;
}

export function CourseBuilder({ mode, initialData, onSave }: CourseBuilderProps) {
  const [tab, setTab] = useState<'info' | 'content' | 'resources' | 'assessment'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [slugAuto, setSlugAuto] = useState(mode === 'create');
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [thumbPreview, setThumbPreview] = useState<string>(initialData?.thumbnail || '');
  const thumbRef = useRef<HTMLInputElement>(null);

  // ── Objectives: local state (avoid useFieldArray primitive bug) ────────────
  const [objectives, setObjectives] = useState<string[]>(
    initialData?.objectives?.length ? initialData.objectives : [''],
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<ModuleFormData>({
    // zodResolver cast needed — zod v4 coerce types are `unknown` input, incompatible with RHF's Resolver generic
    resolver: zodResolver(moduleFormSchema) as any,
    defaultValues: {
      title: '', slug: '', summary: '',
      objectives: objectives,
      level: 'Débutant', language: 'fr', durationMin: null,
      thumbnail: '', tags: [], eventIds: [],
      creatorIds: [], sponsorIds: [],
      sections: [],
      moduleType: 'internal',
      moodleMode: null, moodleCourseUrl: '', moodleInstanceId: '',
      moodleCourseId: '', moodlePackageId: '', timelineSlug: '',
      resources: [], finalQuiz: null, hasCertificate: false, certificateName: '',
      ...(initialData ? {
        ...initialData,
        objectives: initialData.objectives?.length ? initialData.objectives : [''],
        resources: initialData.resources ?? [],
        finalQuiz: initialData.finalQuiz ?? null,
        hasCertificate: initialData.hasCertificate ?? false,
        certificateName: initialData.certificateName ?? '',
      } : {}),
    },
  });

  const { control, register, setValue, getValues, watch, formState: { errors } } = form;

  const { fields: sectionsFields, append: appendSection, remove: removeSection } =
    useFieldArray({ control, name: 'sections' });
  const { fields: resourcesFields, append: appendResource, remove: removeResource } =
    useFieldArray({ control, name: 'resources' });

  // Targeted watches (won't cascade full re-render — each useWatch is scoped)
  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedHasCert = useWatch({ control, name: 'hasCertificate' });
  const watchedFinalQuiz = useWatch({ control, name: 'finalQuiz' }) as Quiz | null;
  const watchedThumb = useWatch({ control, name: 'thumbnail' });
  const watchedEventIds = useWatch({ control, name: 'eventIds' }) as string[];

  // ── Side effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      adminApi.listEvents().then(r => setAllEvents(r.items)),
      adminApi.listTimelines().then(r => setTimelines(r.items)),
    ]).catch(console.error);
  }, []);

  // Sync objectives local state → form value
  useEffect(() => {
    setValue('objectives', objectives, { shouldValidate: false });
  }, [objectives, setValue]);

  // Auto-slug from title
  useEffect(() => {
    if (slugAuto && watchedTitle) setValue('slug', toSlug(watchedTitle), { shouldValidate: false });
  }, [watchedTitle, slugAuto, setValue]);

  // Thumbnail preview
  useEffect(() => {
    setThumbPreview(watchedThumb || '');
  }, [watchedThumb]);

  // ── Badge counts (computed, no subscription) ──────────────────────────────
  const totalLessons = sectionsFields.length; // sections count used for badge (re-renders only when sections array changes)
  const totalResources = resourcesFields.length;
  const hasAssessment = !!watchedFinalQuiz || watchedHasCert;

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = useCallback(async (data: ModuleFormData) => {
    setIsSaving(true);
    try {
      if (mode === 'create') await adminApi.createModule(data);
      else await adminApi.updateModule(initialData.id, data);
      onSave();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  }, [mode, initialData, onSave]);

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Supprimer ce module ?')) return;
    await adminApi.deleteModule(initialData.id);
    onSave();
  };

  // Toggle event association
  const toggleEvent = (id: string) => {
    const current = getValues('eventIds') ?? [];
    setValue(
      'eventIds',
      current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id],
      { shouldValidate: false },
    );
  };

  // ── Submit Error summary ──────────────────────────────────────────────────
  const errorKeys = Object.keys(errors);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            {mode === 'create' ? 'Nouveau cours' : 'Modifier le cours'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Parcours d'apprentissage complet.</p>
        </div>
        <Button variant="outline" type="button" onClick={onSave}>Annuler</Button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl mb-6 overflow-x-auto">
        <Tab active={tab === 'info'} onClick={() => setTab('info')}>📋 Informations</Tab>
        <Tab active={tab === 'content'} onClick={() => setTab('content')} badge={totalLessons}>📚 Contenu</Tab>
        <Tab active={tab === 'resources'} onClick={() => setTab('resources')} badge={totalResources}>🔗 Ressources</Tab>
        <Tab active={tab === 'assessment'} onClick={() => setTab('assessment')} badge={hasAssessment ? 1 : 0}>🏆 Évaluation</Tab>
      </div>

      {/* Error summary (global) */}
      {errorKeys.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 space-y-1">
          <p className="font-bold">⚠️ Veuillez corriger les erreurs suivantes :</p>
          {errors.title && <p>• Titre : {errors.title.message}</p>}
          {errors.slug && <p>• Slug : {errors.slug.message}</p>}
          {errors.summary && <p>• Description : {errors.summary.message}</p>}
          {errors.objectives && <p>• Objectifs : {(errors.objectives as any)?.message ?? 'Au moins un objectif requis (min 3 caractères)'}</p>}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

        {/* ══════ TAB: INFORMATIONS ══════════════════════════════════════════ */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic info */}
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre du cours *</Label>
                    <Input {...register('title')} placeholder="Ex : Histoire du Franc CFA" />
                    {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Slug
                      {slugAuto && <span className="ml-2 text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded-full">AUTO</span>}
                    </Label>
                    <Input {...register('slug')} placeholder="histoire-franc-cfa"
                      onChange={e => { setSlugAuto(false); setValue('slug', e.target.value, { shouldValidate: true }); }} />
                    {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description / Accroche * <span className="text-[10px] text-muted-foreground">(min 40 caractères)</span></Label>
                  <Textarea rows={4} {...register('summary')}
                    placeholder="Pourquoi ce cours ? Que va apprendre l'apprenant ?" />
                  {errors.summary && <p className="text-xs text-red-500">{errors.summary.message}</p>}
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Image de couverture</Label>
                  <div className="flex gap-2">
                    <Input {...register('thumbnail')} placeholder="https://…" className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()}>📁</Button>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const r = new FileReader();
                        r.onload = ev => { const d = ev.target?.result as string; setValue('thumbnail', d); };
                        r.readAsDataURL(f);
                      }} />
                  </div>
                  {thumbPreview && (
                    <div className="relative h-32 rounded-xl overflow-hidden bg-black mt-2">
                      <img src={thumbPreview} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => { setValue('thumbnail', ''); setThumbPreview(''); }}
                        className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 hover:bg-red-500 transition-colors">
                        ✕ Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Objectives */}
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-3">
                <Label>Objectifs d'apprentissage * <span className="text-[10px] text-muted-foreground">(min 3 caractères par objectif)</span></Label>
                {objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-5 text-xs text-muted-foreground font-bold shrink-0">{i + 1}.</span>
                    <Input
                      value={obj}
                      onChange={e => setObjectives(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                      placeholder={`Objectif ${i + 1}`}
                      className="flex-1"
                    />
                    {objectives.length > 1 && (
                      <Button type="button" variant="ghost" size="icon"
                        onClick={() => setObjectives(prev => prev.filter((_, idx) => idx !== i))}>
                        <XIcon className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setObjectives(prev => [...prev, ''])}>
                  + Ajouter un objectif
                </Button>
                {errors.objectives && (
                  <p className="text-xs text-red-500">{(errors.objectives as any)?.message ?? 'Objectifs invalides'}</p>
                )}
              </div>

              {/* Events association */}
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-3">
                <div>
                  <Label>Événements associés</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Reliez ce cours aux événements du calendrier culturel.</p>
                </div>
                {allEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucun événement disponible.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-input rounded-xl p-3 space-y-1">
                    {allEvents.map((ev: any) => {
                      const checked = (watchedEventIds ?? []).includes(ev.id);
                      return (
                        <label key={ev.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                            checked ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-secondary'
                          }`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleEvent(ev.id)}
                            className="accent-primary shrink-0" />
                          <span className="line-clamp-1">{ev.title}</span>
                          {(ev.dateISO || ev.year) && (
                            <span className="ml-auto text-xs text-muted-foreground shrink-0">{ev.dateISO ?? ev.year}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                {(watchedEventIds ?? []).length > 0 && (
                  <p className="text-xs text-primary font-bold">
                    {(watchedEventIds ?? []).length} événement{(watchedEventIds ?? []).length > 1 ? 's' : ''} sélectionné{(watchedEventIds ?? []).length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wide text-secondary">Métadonnées</h3>

                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Controller control={control} name="level"
                    render={({ field }) => (
                      <select {...field} value={field.value ?? 'Débutant'}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="Débutant">Débutant</option>
                        <option value="Intermédiaire">Intermédiaire</option>
                        <option value="Avancé">Avancé</option>
                      </select>
                    )} />
                </div>

                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Controller control={control} name="language"
                    render={({ field }) => (
                      <select {...field} value={field.value ?? 'fr'}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    )} />
                </div>

                <div className="space-y-2">
                  <Label>Durée estimée (minutes)</Label>
                  <Input type="number" min={1} placeholder="90"
                    {...register('durationMin', { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Parcours (Timeline) lié</Label>
                  <Controller control={control} name="timelineSlug"
                    render={({ field }) => (
                      <select {...field} value={field.value ?? ''}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">— Aucun —</option>
                        {timelines.map((t: any) => <option key={t.id} value={t.slug}>{t.title}</option>)}
                      </select>
                    )} />
                </div>

                <div className="space-y-2">
                  <Label>Tags (séparés par virgule)</Label>
                  <Input
                    placeholder="histoire, économie, afrique"
                    defaultValue={(getValues('tags') ?? []).join(', ')}
                    onBlur={e => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setValue('tags', tags, { shouldValidate: false });
                    }}
                  />
                </div>
              </div>

              {/* Save card */}
              <div className="bg-secondary p-6 rounded-2xl text-white space-y-3">
                <Button type="submit" disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold border-none">
                  {isSaving ? '⏳ Enregistrement…' : mode === 'create' ? '✓ Créer le cours' : '✓ Mettre à jour'}
                </Button>
                {mode === 'edit' && (
                  <Button type="button" variant="destructive"
                    className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                    onClick={handleDelete}>
                    Supprimer le cours
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
                <p className="text-xs text-muted-foreground mt-0.5">Chapitres → Leçons → Quiz optionnel après chaque leçon ou chapitre.</p>
              </div>
              <Button type="button" variant="outline"
                onClick={() => appendSection({
                  id: uid(), title: '', description: '', order: sectionsFields.length, lessons: [], quiz: null,
                } as any)}>
                + Nouveau chapitre
              </Button>
            </div>

            {sectionsFields.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
                <p className="text-4xl mb-3">📚</p>
                <p className="font-bold text-secondary">Aucun chapitre créé</p>
                <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter un chapitre à votre cours.</p>
                <Button type="button"
                  onClick={() => appendSection({ id: uid(), title: '', order: 0, lessons: [], quiz: null } as any)}>
                  + Créer le premier chapitre
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sectionsFields.map((section, si) => (
                  <SectionCard
                    key={section.id}
                    si={si}
                    control={control} register={register} setValue={setValue}
                    onRemove={() => removeSection(si)}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement…' : '✓ Enregistrer le cours'}
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TAB: RESSOURCES ═════════════════════════════════════════════ */}
        {tab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-secondary">Ressources complémentaires</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enrichissez le cours avec des médias, événements et récits liés.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {([
                  ['audio', '🎵 Audio'], ['video', '🎬 Vidéo'], ['image', '🖼️ Image'],
                  ['pdf', '📄 PDF'], ['link', '🔗 Lien'],
                  ['event', '📅 Événement'], ['timeline', '🎭 Récit'],
                ] as [string, string][]).map(([type, label]) => (
                  <Button key={type} type="button" size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => appendResource({
                      id: uid(), type: type as any, title: '', url: '', eventId: '', timelineSlug: '', description: '',
                    } as any)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {resourcesFields.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
                <p className="text-4xl mb-3">🔗</p>
                <p className="font-bold text-secondary">Aucune ressource ajoutée</p>
                <p className="text-sm text-muted-foreground">Cliquez sur un type ci-dessus pour ajouter une ressource.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resourcesFields.map((resource, ri) => (
                  <ResourceRow
                    key={resource.id}
                    ri={ri} control={control} register={register} setValue={setValue}
                    allEvents={allEvents} timelines={timelines}
                    onRemove={() => removeResource(ri)}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement…' : '✓ Enregistrer'}
              </Button>
            </div>
          </div>
        )}

        {/* ══════ TAB: ÉVALUATION & CERTIFICAT ════════════════════════════════ */}
        {tab === 'assessment' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏅</span>
                <div>
                  <h3 className="font-bold text-secondary">Quiz final du cours</h3>
                  <p className="text-xs text-muted-foreground">Évaluation globale proposée à la fin du parcours.</p>
                </div>
              </div>
              <QuizBuilder
                quiz={watchedFinalQuiz}
                onChange={q => setValue('finalQuiz', q as any)}
                label="Quiz final"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-muted shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-bold text-secondary">Certificat Kasuku</h3>
                  <p className="text-xs text-muted-foreground">Remis à l'apprenant à la fin du parcours.</p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setValue('hasCertificate', !watchedHasCert)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${watchedHasCert ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${watchedHasCert ? 'translate-x-5' : ''}`} />
                </div>
                <span className="font-bold text-sm">Activer le certificat de complétion</span>
              </label>

              <AnimatePresence>
                {watchedHasCert && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div className="space-y-2">
                      <Label>Intitulé du certificat</Label>
                      <Input {...register('certificateName')}
                        placeholder="Certificat de maîtrise — Histoire du Franc CFA" />
                    </div>
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 text-center">Aperçu</p>
                      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto text-center border border-primary/10">
                        <div className="flex justify-center mb-3">
                          <img src="https://i.postimg.cc/8cYFbspt/Kasuku-logo.png" alt="Kasuku" className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Kasuku Academy</p>
                        <p className="font-black text-secondary text-lg leading-tight mb-2">
                          {watch('certificateName') || 'Certificat de complétion'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">Décerné à</p>
                        <p className="font-bold text-primary text-base border-b border-dashed border-primary/30 pb-2 mb-2">Prénom Nom</p>
                        <p className="text-xs text-muted-foreground">Pour avoir complété avec succès</p>
                        <p className="font-bold text-sm text-secondary mt-0.5">{watch('title') || 'Nom du cours'}</p>
                        <p className="text-[10px] text-muted-foreground mt-3">
                          {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="h-12 px-8 font-bold">
                {isSaving ? '⏳ Enregistrement…' : '✓ Enregistrer le cours'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
