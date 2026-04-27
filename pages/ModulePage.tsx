import React, { useState, useEffect } from 'react';
import type { TrainingModule, Section, Lesson, Event, MoodleCourseMap, MoodleOfflinePackage } from '../types';
import { useModuleProgress } from '../hooks/useModuleProgress';
import { useFavorites } from '../hooks/useFavorites';
import { formatDate } from '../utils/helpers';
import { EVENTS, MOODLE_MAPS, MOODLE_PACKAGES } from '../constants';

// UI Components
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Separator } from '../components/ui/Separator';
import { ModuleActions } from '../components/modules/ModuleActions';

// Icons
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { VideoIcon } from '../components/icons/VideoIcon';
import { AudioLinesIcon } from '../components/icons/AudioLinesIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { HelpCircleIcon } from '../components/icons/HelpCircleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ExternalLinkIcon } from '../components/icons/ExternalLinkIcon';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';

interface ModulePageProps {
  module: TrainingModule;
  onNavigateToEvent: (eventId: string) => void;
  onBack: () => void;
  navigateTo: (view: any, id?: string) => void;
}

const getLessonIcon = (type: Lesson['type']) => {
    switch(type) {
        case 'video': return <VideoIcon className="h-5 w-5 text-secondary" />;
        case 'audio': return <AudioLinesIcon className="h-5 w-5 text-secondary" />;
        case 'pdf': return <FileTextIcon className="h-5 w-5 text-secondary" />;
        case 'quiz': return <HelpCircleIcon className="h-5 w-5 text-secondary" />;
        default: return null;
    }
};

export const ModulePage: React.FC<ModulePageProps> = ({ module, onNavigateToEvent, onBack, navigateTo }) => {
    const { completedLessons, toggleLessonComplete, progressPercentage } = useModuleProgress(module);
    const { exists, toggle } = useFavorites();
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const isFav = exists('module', module.id);
    
    const [moodleMap, setMoodleMap] = useState<MoodleCourseMap | null>(null);
    const [moodlePackage, setMoodlePackage] = useState<MoodleOfflinePackage | null>(null);

    useEffect(() => {
        // Select the first lesson of the first section by default for internal modules
        if (module && module.moduleType !== 'moodle' && module.sections?.[0]?.lessons?.[0]) {
            setSelectedLesson(module.sections[0].lessons[0]);
        }
    }, [module]);

    useEffect(() => {
        const foundMap = MOODLE_MAPS.find(m => m.moduleId === module.id) ?? null;
        setMoodleMap(foundMap);
        if (foundMap?.packageId) {
            const foundPkg = MOODLE_PACKAGES.find(p => p.id === foundMap.packageId) ?? null;
            setMoodlePackage(foundPkg);
        }
    }, [module.id]);


    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Lien du module copié !');
    };
    
    const handleToggleFavorite = () => {
        toggle({
          type: 'module',
          id: module.id,
          slug: module.slug,
          title: module.title,
          thumbnail: module.thumbnail,
        });
    };
    
    const relatedEvents = EVENTS.filter(event => module.eventIds.includes(event.id));

    const handleGoToMoodle = () => {
        if (module.moodleCourseUrl) {
            window.open(module.moodleCourseUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleReadOffline = (view: 'offlineScorm' | 'offlineH5p', baseUrl: string) => {
        navigateTo(view, baseUrl);
    };

    // Moodle Course View
    if (module.moduleType === 'moodle') {
        const modeLabel = module.moodleMode === 'lti' ? 'LTI' : module.moodleMode === 'offline' ? 'Hors-ligne' : 'Lien direct';
        return (
             <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Retour
                </button>

                {/* Hero Banner */}
                {module.thumbnail && (
                    <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 shadow-soft">
                        <img src={module.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-6">
                            <Badge variant="accent" className="text-[10px] font-black uppercase tracking-widest">
                                🎓 Cours Moodle — {modeLabel}
                            </Badge>
                        </div>
                    </div>
                )}

                <header className="space-y-4 mb-8 bg-card p-6 sm:p-8 rounded-2xl shadow-soft">
                    <div className="text-sm text-muted-foreground">Accueil › Modules › {module.title}</div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-secondary">{module.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                       {module.level && <Badge variant="secondary">{module.level}</Badge>}
                       {module.durationMin && <Badge variant="outline" className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{module.durationMin} min</Badge>}
                       <Badge variant="outline">{module.language === 'fr' ? 'Français' : 'English'}</Badge>
                       {!module.thumbnail && <Badge variant="accent">🎓 Cours Moodle</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Mis à jour le {formatDate(new Date(module.updatedAt))}</p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        {module.moodleCourseUrl && (
                            <Button size="lg" onClick={handleGoToMoodle} className="h-12 rounded-xl">
                                <GraduationCapIcon className="h-5 w-5 mr-2" />
                                Accéder au cours Moodle
                            </Button>
                        )}
                        <ModuleActions
                            mode={moodleMap?.mode}
                            packageBaseUrl={moodlePackage?.storagePath}
                            navigateTo={handleReadOffline}
                        />
                        <Button variant={isFav ? "secondary" : "outline"} onClick={handleToggleFavorite} aria-pressed={isFav} className="h-12 rounded-xl">
                            <StarIcon className={`mr-2 h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                            {isFav ? 'Sauvegardé' : 'Sauvegarder'}
                        </Button>
                        <Button variant="outline" onClick={handleShare} className="h-12 rounded-xl">
                            <ShareIcon className="mr-2 h-4 w-4" />
                            Partager
                        </Button>
                    </div>
                </header>

                <div className="space-y-6">
                    {/* Description & Objectives */}
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-xl mb-3">À propos</h3>
                                <p className="text-muted-foreground leading-relaxed">{module.summary}</p>
                            </div>
                            {module.objectives?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-xl mb-3">Objectifs d'apprentissage</h3>
                                    <ul className="space-y-2">
                                        {module.objectives.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                                <CheckCircleIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline associée */}
                    {module.timelineSlug && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Parcours associé</p>
                                    <p className="font-bold text-secondary">Explorez le récit historique lié à ce cours</p>
                                    <p className="text-sm text-muted-foreground mt-1">Ce module est contextualisé dans un parcours narratif.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-white"
                                    onClick={() => navigateTo('timeline', module.timelineSlug!)}
                                >
                                    Voir le parcours →
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Related events */}
                    {relatedEvents.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Événements liés</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4 text-sm">Ce module est ancré dans des événements de notre calendrier culturel.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {relatedEvents.map(event => (
                                        <button
                                            key={event.id}
                                            onClick={() => onNavigateToEvent(event.id)}
                                            className="flex items-start gap-3 p-3 rounded-xl border border-muted hover:border-primary/30 hover:bg-primary/5 transition-colors text-left group"
                                        >
                                            {event.media?.[0]?.url && (
                                                <img src={event.media[0].url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                                            )}
                                            <div>
                                                <p className="font-bold text-sm text-secondary group-hover:text-primary transition-colors line-clamp-2">{event.title}</p>
                                                {(event.dateISO || event.year) && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{event.dateISO || event.year}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Creators */}
                    {module.creators?.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Créateurs</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {module.creators.map(creator => (
                                    <div key={creator.id} className="flex items-start gap-4">
                                        <img src={creator.avatarUrl} alt={creator.name} className="h-14 w-14 rounded-full bg-muted object-cover" />
                                        <div>
                                            <h4 className="font-semibold">{creator.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-0.5">{creator.bio}</p>
                                            {creator.links?.[0] && (
                                                <a href={creator.links[0]} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                                                    En savoir plus <ExternalLinkIcon className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    // ═══════ INTERNAL MODULE — FULL LMS PLAYER ═════════════════════════════
    return <InternalCoursePlayer
        module={module}
        onBack={onBack}
        onNavigateToEvent={onNavigateToEvent}
        navigateTo={navigateTo}
        isFav={isFav}
        onToggleFav={handleToggleFavorite}
        onShare={handleShare}
        completedLessons={completedLessons}
        toggleLessonComplete={toggleLessonComplete}
        progressPercentage={progressPercentage}
        relatedEvents={relatedEvents}
    />;
};

// ─── RESOURCE ICONS MAP ──────────────────────────────────────────────────────
const RESOURCE_ICONS: Record<string, string> = {
    audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄',
    link: '🔗', event: '📅', timeline: '🎭',
};

// ─── QUIZ PLAYER ─────────────────────────────────────────────────────────────
interface QuizPlayerProps {
    quiz: any;
    onPass: () => void;
    onClose: () => void;
}
function QuizPlayer({ quiz, onPass, onClose }: QuizPlayerProps) {
    const [currentQ, setCurrentQ] = React.useState(0);
    const [answers, setAnswers] = React.useState<Record<number, number | boolean>>({});
    const [showResults, setShowResults] = React.useState(false);
    const [showExplanation, setShowExplanation] = React.useState(false);
    const q = quiz.questions[currentQ];
    const isLast = currentQ === quiz.questions.length - 1;
    const hasAnswered = answers[currentQ] !== undefined;

    const answer = (val: number | boolean) => {
        if (hasAnswered) return;
        setAnswers(prev => ({ ...prev, [currentQ]: val }));
        setShowExplanation(true);
    };

    const next = () => {
        setShowExplanation(false);
        if (isLast) { setShowResults(true); return; }
        setCurrentQ(i => i + 1);
    };

    const score = React.useMemo(() => {
        let correct = 0;
        quiz.questions.forEach((q: any, i: number) => {
            const a = answers[i];
            if (q.type === 'multiple_choice' && a === q.correctIndex) correct++;
            if (q.type === 'true_false' && a === q.correctBool) correct++;
        });
        return Math.round((correct / quiz.questions.length) * 100);
    }, [showResults, answers]);

    const passed = score >= (quiz.passingScore ?? 70);

    if (showResults) return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">{passed ? '🏆' : '📚'}</div>
                <h2 className="text-2xl font-black text-secondary mb-2">
                    {passed ? 'Félicitations !' : 'Presque !'}
                </h2>
                <p className="text-muted-foreground mb-6">
                    Votre score : <span className={`font-black text-2xl ${passed ? 'text-green-600' : 'text-amber-500'}`}>{score}%</span>
                    {' '}<span className="text-sm">(requis : {quiz.passingScore}%)</span>
                </p>
                {passed ? (
                    <Button className="w-full h-12 font-bold" onClick={onPass}>
                        Continuer →
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full h-12" onClick={() => {
                            setCurrentQ(0); setAnswers({}); setShowResults(false); setShowExplanation(false);
                        }}>Réessayer</Button>
                        <button onClick={onClose} className="text-sm text-muted-foreground hover:underline">
                            Passer pour l'instant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-secondary px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-wide">{quiz.title || 'Quiz'}</p>
                        <p className="text-white text-sm font-bold">{currentQ + 1} / {quiz.questions.length}</p>
                    </div>
                    <div className="flex gap-1">
                        {quiz.questions.map((_: any, i: number) => (
                            <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${
                                i < currentQ ? 'bg-green-400' : i === currentQ ? 'bg-white' : 'bg-white/20'
                            }`} />
                        ))}
                    </div>
                </div>

                {/* Question */}
                <div className="p-6 space-y-5">
                    <p className="font-bold text-secondary text-lg leading-snug">{q.question}</p>

                    {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-2">
                            {q.options.map((opt: string, oi: number) => {
                                const chosen = answers[currentQ] === oi;
                                const correct = oi === q.correctIndex;
                                let cls = 'border-muted hover:border-primary/40 hover:bg-primary/5';
                                if (hasAnswered) {
                                    if (correct) cls = 'border-green-500 bg-green-50 text-green-700';
                                    else if (chosen) cls = 'border-red-400 bg-red-50 text-red-600';
                                }
                                return (
                                    <button key={oi} onClick={() => answer(oi)}
                                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${cls}`}>
                                        <span className="w-6 h-6 rounded-full border-2 border-current inline-flex items-center justify-center text-xs font-black mr-2">
                                            {String.fromCharCode(65 + oi)}
                                        </span>
                                        {opt}
                                        {hasAnswered && correct && ' ✓'}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {q.type === 'true_false' && (
                        <div className="flex gap-3">
                            {[{ v: true, l: '✓ Vrai' }, { v: false, l: '✗ Faux' }].map(({ v, l }) => {
                                const chosen = answers[currentQ] === v;
                                const correct = v === q.correctBool;
                                let cls = 'border-muted hover:border-primary/40';
                                if (hasAnswered) {
                                    if (correct) cls = 'border-green-500 bg-green-50 text-green-700';
                                    else if (chosen) cls = 'border-red-400 bg-red-50 text-red-600';
                                }
                                return (
                                    <button key={String(v)} onClick={() => answer(v)}
                                        className={`flex-1 py-4 rounded-xl border-2 font-black text-sm transition-all ${cls}`}>
                                        {l}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {showExplanation && q.explanation && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            💡 {q.explanation}
                        </div>
                    )}

                    {hasAnswered && (
                        <Button className="w-full h-11 font-bold" onClick={next}>
                            {isLast ? 'Voir les résultats →' : 'Question suivante →'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── CERTIFICATE MODAL ───────────────────────────────────────────────────────
function CertificateModal({ module, onClose }: { module: any; onClose: () => void }) {
    const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-2" onClick={e => e.stopPropagation()}>
                {/* Certificate */}
                <div className="border-4 border-primary/30 rounded-2xl p-8 text-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
                    <div className="flex justify-center mb-4">
                        <img src="https://i.postimg.cc/8cYFbspt/Kasuku-logo.png" alt="Kasuku" className="h-16 w-16 rounded-full shadow" />
                    </div>
                    <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2">Kasuku Academy</p>
                    <h2 className="text-2xl font-black text-secondary mb-1">
                        {module.certificateName || 'Certificat de complétion'}
                    </h2>
                    <div className="h-px bg-primary/20 my-4" />
                    <p className="text-sm text-muted-foreground mb-1">Décerné à</p>
                    <p className="text-xl font-black text-primary mb-4">Votre Nom</p>
                    <p className="text-sm text-muted-foreground">Pour avoir complété avec succès</p>
                    <p className="font-bold text-secondary text-base mt-1 mb-6">« {module.title} »</p>
                    <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                            <div className="h-px w-24 bg-secondary/30 mb-1" />
                            <p className="text-[10px] text-muted-foreground">Date</p>
                            <p className="text-xs font-bold">{date}</p>
                        </div>
                        <div className="text-center">
                            <div className="h-px w-24 bg-secondary/30 mb-1" />
                            <p className="text-[10px] text-muted-foreground">Kasuku Academy</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Certifié Kasuku</span>
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <Button className="flex-1 h-11" onClick={() => window.print()}>🖨️ Imprimer</Button>
                    <Button variant="outline" className="flex-1 h-11" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}

// ─── LESSON MEDIA PLAYER ─────────────────────────────────────────────────────
function LessonPlayer({ lesson }: { lesson: any }) {
    if (!lesson) return (
        <div className="aspect-video bg-gradient-to-br from-secondary/10 to-primary/5 rounded-2xl flex flex-col items-center justify-center text-center p-8">
            <span className="text-5xl mb-3">📚</span>
            <p className="font-bold text-secondary">Sélectionnez une leçon pour commencer</p>
        </div>
    );
    if (lesson.type === 'video' && lesson.url) {
        // Support YouTube, Vimeo, direct mp4
        const isEmbed = lesson.url.includes('youtube') || lesson.url.includes('youtu.be') || lesson.url.includes('vimeo');
        const embedUrl = lesson.url.includes('youtu.be')
            ? lesson.url.replace('youtu.be/', 'www.youtube.com/embed/')
            : lesson.url.includes('youtube.com/watch?v=')
                ? lesson.url.replace('watch?v=', 'embed/')
                : lesson.url;
        return isEmbed ? (
            <iframe src={embedUrl} className="w-full aspect-video rounded-2xl bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={lesson.title} />
        ) : (
            <video src={lesson.url} controls className="w-full aspect-video rounded-2xl bg-black" />
        );
    }
    if (lesson.type === 'audio' && lesson.url) return (
        <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/5 p-8 flex flex-col items-center gap-4">
            <span className="text-5xl">🎵</span>
            <p className="font-bold text-secondary">{lesson.title}</p>
            <audio src={lesson.url} controls className="w-full" />
        </div>
    );
    if (lesson.type === 'pdf' && lesson.url) return (
        <div className="rounded-2xl border border-muted overflow-hidden">
            <iframe src={lesson.url} className="w-full h-[600px]" title={lesson.title} />
        </div>
    );
    if (lesson.type === 'text' && lesson.content) return (
        <div className="rounded-2xl bg-white border border-muted p-6 prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-secondary leading-relaxed">{lesson.content}</div>
        </div>
    );
    return (
        <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center text-center p-8">
            <div>
                <span className="text-4xl block mb-2">📄</span>
                <p className="font-medium text-secondary">{lesson.title}</p>
                {lesson.url && (
                    <a href={lesson.url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm text-primary font-bold hover:underline">
                        Ouvrir le contenu →
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── FULL INTERNAL COURSE PLAYER ─────────────────────────────────────────────
function InternalCoursePlayer({
    module, onBack, onNavigateToEvent, navigateTo,
    isFav, onToggleFav, onShare,
    completedLessons, toggleLessonComplete, progressPercentage, relatedEvents,
}: {
    module: any; onBack: () => void; onNavigateToEvent: (id: string) => void;
    navigateTo: (v: any, id?: string) => void;
    isFav: boolean; onToggleFav: () => void; onShare: () => void;
    completedLessons: Set<string>; toggleLessonComplete: (id: string) => void;
    progressPercentage: number; relatedEvents: any[];
}) {
    const allLessons = (module.sections ?? []).flatMap((s: any) => s.lessons ?? []);
    const [selectedLesson, setSelectedLesson] = React.useState<any>(allLessons[0] ?? null);
    const [activeQuiz, setActiveQuiz] = React.useState<any>(null);
    const [showFinalQuiz, setShowFinalQuiz] = React.useState(false);
    const [showCert, setShowCert] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const isLessonDone = (id: string) => completedLessons.has(id);

    const markAndNext = (lesson: any) => {
        toggleLessonComplete(lesson.id);
        if (lesson.quiz?.questions?.length) {
            setActiveQuiz(lesson.quiz);
            return;
        }
        goToNext(lesson);
    };

    const goToNext = (lesson: any) => {
        const idx = allLessons.findIndex((l: any) => l.id === lesson.id);
        if (idx < allLessons.length - 1) {
            setSelectedLesson(allLessons[idx + 1]);
        } else if (module.finalQuiz?.questions?.length) {
            setShowFinalQuiz(true);
        } else if (module.hasCertificate) {
            setShowCert(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Quizzes */}
            {activeQuiz && (
                <QuizPlayer
                    quiz={activeQuiz}
                    onPass={() => { setActiveQuiz(null); goToNext(selectedLesson); }}
                    onClose={() => setActiveQuiz(null)}
                />
            )}
            {showFinalQuiz && module.finalQuiz && (
                <QuizPlayer
                    quiz={module.finalQuiz}
                    onPass={() => { setShowFinalQuiz(false); if (module.hasCertificate) setShowCert(true); }}
                    onClose={() => setShowFinalQuiz(false)}
                />
            )}
            {showCert && <CertificateModal module={module} onClose={() => setShowCert(false)} />}

            {/* Top bar */}
            <div className="flex items-center justify-between mb-4 gap-4">
                <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0">
                    <ArrowLeftIcon className="h-4 w-4" /> Retour
                </button>
                {/* Progress bar */}
                <div className="flex-1 hidden sm:flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${progressPercentage}%` }} />
                    </div>
                    <span className="text-xs font-black text-primary shrink-0">{progressPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={isFav ? 'secondary' : 'outline'} size="sm" onClick={onToggleFav}>
                        <StarIcon className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onShare}>
                        <ShareIcon className="h-4 w-4" />
                    </Button>
                    {/* Mobile sidebar toggle */}
                    <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(o => !o)}>
                        ☰ Cours
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Sidebar ── */}
                <aside className={`w-full lg:w-72 shrink-0 lg:sticky top-4 self-start ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white rounded-2xl border border-muted shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-secondary text-white">
                            <h2 className="font-black text-sm">{module.title}</h2>
                            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
                            </div>
                            <p className="text-white/60 text-[10px] mt-1">{progressPercentage}% complété</p>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh]">
                            {(module.sections ?? []).map((section: any, si: number) => (
                                <div key={section.id ?? si}>
                                    <div className="px-4 py-2 bg-muted/40 border-b border-muted">
                                        <p className="text-xs font-black text-secondary uppercase tracking-wider">
                                            Ch. {si + 1} — {section.title}
                                        </p>
                                    </div>
                                    {(section.lessons ?? []).map((lesson: any, li: number) => {
                                        const done = isLessonDone(lesson.id);
                                        const active = selectedLesson?.id === lesson.id;
                                        return (
                                            <button key={lesson.id ?? li}
                                                onClick={() => { setSelectedLesson(lesson); setSidebarOpen(false); }}
                                                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-muted/50 transition-colors ${
                                                    active ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/40'
                                                }`}>
                                                <span className="text-base shrink-0">
                                                    {done ? '✅' :
                                                        lesson.type === 'video' ? '🎬' :
                                                        lesson.type === 'audio' ? '🎵' :
                                                        lesson.type === 'pdf' ? '📄' : '📝'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium line-clamp-2 ${active ? 'text-primary font-bold' : 'text-secondary'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    {lesson.durationMin && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.durationMin} min</p>
                                                    )}
                                                </div>
                                                {lesson.quiz?.questions?.length > 0 && (
                                                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold shrink-0">Quiz</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Final quiz / Certificat */}
                            {(module.finalQuiz || module.hasCertificate) && (
                                <div className="p-3 border-t border-muted space-y-2">
                                    {module.finalQuiz?.questions?.length > 0 && (
                                        <button onClick={() => setShowFinalQuiz(true)}
                                            className="w-full py-2 text-xs font-bold text-center text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                                            🏅 Quiz final
                                        </button>
                                    )}
                                    {module.hasCertificate && (
                                        <button
                                            onClick={() => setShowCert(true)}
                                            disabled={progressPercentage < 100}
                                            className="w-full py-2 text-xs font-bold text-center bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                            🎓 {progressPercentage >= 100 ? 'Obtenir mon certificat' : `Certificat (${progressPercentage}%)`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── Main player ── */}
                <main className="flex-1 min-w-0 space-y-5">
                    {/* Lesson title */}
                    {selectedLesson && (
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold mb-1">
                                    {module.sections?.find((s: any) => s.lessons?.some((l: any) => l.id === selectedLesson.id))?.title}
                                </p>
                                <h1 className="text-xl sm:text-2xl font-black text-secondary">{selectedLesson.title}</h1>
                            </div>
                            {selectedLesson.durationMin && (
                                <Badge variant="outline" className="shrink-0 flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5" />{selectedLesson.durationMin} min
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Media */}
                    <LessonPlayer lesson={selectedLesson} />

                    {/* Transcript */}
                    {selectedLesson?.transcript && (
                        <details className="bg-muted/30 rounded-xl border border-muted">
                            <summary className="px-4 py-3 text-sm font-bold text-secondary cursor-pointer">📋 Transcription</summary>
                            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedLesson.transcript}</p>
                        </details>
                    )}

                    {/* Complete + Next */}
                    {selectedLesson && (
                        <div className="flex flex-wrap gap-3">
                            {isLessonDone(selectedLesson.id) ? (
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold">
                                    <CheckCircleIcon className="h-5 w-5" /> Leçon complétée
                                </div>
                            ) : (
                                <Button className="h-11 px-6 font-bold" onClick={() => markAndNext(selectedLesson)}>
                                    {selectedLesson.quiz?.questions?.length ? '✓ Valider et passer le quiz' : '✓ Marquer comme terminé'}
                                </Button>
                            )}
                            {isLessonDone(selectedLesson.id) && selectedLesson.quiz?.questions?.length > 0 && (
                                <Button variant="outline" className="h-11" onClick={() => setActiveQuiz(selectedLesson.quiz)}>
                                    🧠 Repasser le quiz
                                </Button>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Resources */}
                    {module.resources?.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-secondary">🔗 Ressources complémentaires</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {module.resources.map((r: any) => (
                                    <div key={r.id} className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-muted hover:border-primary/30 hover:shadow-sm transition-all">
                                        <span className="text-xl shrink-0">{RESOURCE_ICONS[r.type] ?? '🔗'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-secondary line-clamp-1">{r.title}</p>
                                            {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                                            {r.url && (
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
                                                    Accéder →
                                                </a>
                                            )}
                                            {r.type === 'event' && r.eventId && (
                                                <button onClick={() => onNavigateToEvent(r.eventId)}
                                                    className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
                                                    Voir l'événement →
                                                </button>
                                            )}
                                            {r.type === 'timeline' && r.timelineSlug && (
                                                <button onClick={() => navigateTo('timeline', r.timelineSlug)}
                                                    className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
                                                    Voir le parcours →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related events */}
                    {relatedEvents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-secondary">📅 Événements liés</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {relatedEvents.map(ev => (
                                    <button key={ev.id} onClick={() => onNavigateToEvent(ev.id)}
                                        className="flex items-start gap-3 p-3 bg-white rounded-xl border border-muted hover:border-primary/30 hover:bg-primary/5 transition-colors text-left group">
                                        {ev.media?.[0]?.url && (
                                            <img src={ev.media[0].url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                                        )}
                                        <div>
                                            <p className="font-bold text-sm text-secondary group-hover:text-primary transition-colors line-clamp-2">{ev.title}</p>
                                            {(ev.dateISO || ev.year) && <p className="text-xs text-muted-foreground mt-0.5">{ev.dateISO || ev.year}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline associée */}
                    {module.timelineSlug && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black text-primary uppercase tracking-widest">Parcours associé</p>
                                <p className="font-bold text-secondary text-sm mt-0.5">Explorez le récit historique lié à ce cours</p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-white"
                                onClick={() => navigateTo('timeline', module.timelineSlug)}>
                                Voir →
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
