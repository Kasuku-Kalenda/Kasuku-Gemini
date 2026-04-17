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
        return (
             <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Retour
                </button>
                 <header className="space-y-4 mb-8 bg-card p-6 sm:p-8 rounded-2xl shadow-soft">
                    <div className="text-sm text-muted-foreground">
                       <span>Accueil › Modules › {module.title}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-secondary">{module.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                       <Badge variant="secondary">{module.level}</Badge>
                       {module.durationMin && <Badge variant="outline" className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{module.durationMin} min</Badge>}
                       <Badge variant="outline">{module.language === 'fr' ? 'Français' : 'English'}</Badge>
                       <Badge variant="accent">Cours Moodle</Badge>
                    </div>
                     <p className="text-sm text-muted-foreground">Mis à jour le {formatDate(new Date(module.updatedAt))}</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                        <Button size="lg" onClick={handleGoToMoodle} className="h-12 rounded-xl">
                            <GraduationCapIcon className="h-5 w-5 mr-2" />
                            Accéder au cours sur Moodle
                        </Button>
                        <div className="flex gap-2">
                            <Button variant={isFav ? "secondary" : "outline"} onClick={handleToggleFavorite} aria-pressed={isFav} className="flex-1 h-12 rounded-xl">
                                <StarIcon className={`mr-2 h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                                {isFav ? 'Sauvegardé' : 'Sauvegarder'}
                            </Button>
                             <Button variant="outline" onClick={handleShare} className="flex-1 h-12 rounded-xl">
                                <ShareIcon className="mr-2 h-4 w-4" />
                                Partager
                            </Button>
                        </div>
                        <ModuleActions
                            mode={moodleMap?.mode}
                            packageBaseUrl={moodlePackage?.storagePath}
                            navigateTo={handleReadOffline}
                        />
                    </div>
                </header>
                <div className="space-y-8">
                     <Tabs defaultValue="overview">
                        <TabsList>
                            <TabsTrigger value="overview">Aperçu</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-bold text-xl mb-4">À propos de ce module</h3>
                                    <p className="text-muted-foreground mb-6">{module.summary}</p>
                                    <h3 className="font-bold text-xl mb-4">Objectifs d’apprentissage</h3>
                                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                        {module.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Creator Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Créateurs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {module.creators.map(creator => (
                                <div key={creator.id} className="flex items-start gap-4">
                                    <img src={creator.avatarUrl} alt={creator.name} className="h-16 w-16 rounded-full bg-muted" />
                                    <div>
                                        <h4 className="font-semibold">{creator.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{creator.bio}</p>
                                        {creator.links && (
                                            <a href={creator.links[0]} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
                                                En savoir plus <ExternalLinkIcon className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    {/* Event Link */}
                    {relatedEvents.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Pour aller plus loin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">Ce module est lié à des événements de notre calendrier culturel. Explorez-les pour plus de contexte.</p>
                                <div className="flex flex-wrap gap-2">
                                    {relatedEvents.map(event => (
                                         <Button key={event.id} variant="outline" onClick={() => onNavigateToEvent(event.id)}>
                                            Voir l'événement : {event.title}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        )
    }

    // Internal Module View
    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="h-4 w-4" />
                Retour
            </button>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Left Sidebar (Sticky) */}
                <aside className="w-full lg:w-1/3 lg:max-w-sm lg:sticky top-24 self-start space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Programme du module</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                    <span>Progression</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} />
                            </div>
                            <Accordion>
                                {module.sections?.map(section => (
                                    <AccordionItem key={section.id} value={section.id}>
                                        <AccordionTrigger>{section.order}. {section.title}</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-1">
                                                {section.lessons.map(lesson => {
                                                    const isSelected = selectedLesson?.id === lesson.id;
                                                    const isCompleted = completedLessons.has(lesson.id);
                                                    return (
                                                        <li key={lesson.id}>
                                                            <button 
                                                                onClick={() => setSelectedLesson(lesson)}
                                                                className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                                            >
                                                                {getLessonIcon(lesson.type)}
                                                                <span className="flex-grow">{lesson.title}</span>
                                                                {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                                                            </button>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Hero */}
                    <header className="space-y-4 mb-8">
                        <div className="text-sm text-muted-foreground">
                           <span>Accueil › Modules › {module.title}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-secondary">{module.title}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                           <Badge variant="secondary">{module.level}</Badge>
                           {module.durationMin && <Badge variant="outline" className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{module.durationMin} min</Badge>}
                           <Badge variant="outline">{module.language === 'fr' ? 'Français' : 'English'}</Badge>
                        </div>
                         <p className="text-sm text-muted-foreground">Mis à jour le {formatDate(new Date(module.updatedAt))}</p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <Button size="lg" className="h-12 rounded-xl">Commencer le module</Button>
                            <div className="flex gap-2">
                                <Button variant={isFav ? "secondary" : "outline"} onClick={handleToggleFavorite} aria-pressed={isFav} className="flex-1 h-12 rounded-xl">
                                    <StarIcon className={`mr-2 h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                                    {isFav ? 'Sauvegardé' : 'Sauvegarder'}
                                </Button>
                                 <Button variant="outline" onClick={handleShare} className="flex-1 h-12 rounded-xl">
                                    <ShareIcon className="mr-2 h-4 w-4" />
                                    Partager
                                </Button>
                            </div>
                        </div>
                    </header>
                    
                    <Separator className="my-8" />

                    {/* Media Player & Content */}
                    <div className="space-y-8">
                        <div className="bg-card rounded-2xl p-4 shadow-soft">
                             <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                {selectedLesson ? (
                                    <div className="text-center text-muted-foreground">
                                        {getLessonIcon(selectedLesson.type)}
                                        <p className="mt-2 font-semibold">Aperçu du média : {selectedLesson.title}</p>
                                        <p className="text-sm">Type : {selectedLesson.type}</p>
                                    </div>
                                ) : (
                                    <p>Sélectionnez une leçon</p>
                                )}
                            </div>
                            {selectedLesson && (
                                <div className="p-4 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">{selectedLesson.title}</h3>
                                    <Button onClick={() => toggleLessonComplete(selectedLesson.id)} variant={completedLessons.has(selectedLesson.id) ? 'outline' : 'primary'}>
                                        <CheckCircleIcon className="mr-2 h-4 w-4"/>
                                        {completedLessons.has(selectedLesson.id) ? 'Marquée comme faite' : 'Marquer comme fait'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Tabs defaultValue="overview">
                            <TabsList>
                                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                                <TabsTrigger value="resources">Ressources</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview">
                                <Card>
                                    <CardContent className="pt-6">
                                        <h3 className="font-bold text-xl mb-4">À propos de ce module</h3>
                                        <p className="text-muted-foreground mb-6">{module.summary}</p>
                                        <h3 className="font-bold text-xl mb-4">Objectifs d’apprentissage</h3>
                                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                            {module.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="resources">
                                 <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-muted-foreground">Ressources et liens pour cette leçon seront affichés ici.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Creator Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Créateurs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {module.creators.map(creator => (
                                    <div key={creator.id} className="flex items-start gap-4">
                                        <img src={creator.avatarUrl} alt={creator.name} className="h-16 w-16 rounded-full bg-muted" />
                                        <div>
                                            <h4 className="font-semibold">{creator.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{creator.bio}</p>
                                            {creator.links && (
                                                <a href={creator.links[0]} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
                                                    En savoir plus <ExternalLinkIcon className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        {/* Event Link */}
                        {relatedEvents.length > 0 && (
                             <Card>
                                <CardHeader>
                                    <CardTitle>Pour aller plus loin</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">Ce module est lié à des événements de notre calendrier culturel. Explorez-les pour plus de contexte.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {relatedEvents.map(event => (
                                             <Button key={event.id} variant="outline" onClick={() => onNavigateToEvent(event.id)}>
                                                Voir l'événement : {event.title}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};
