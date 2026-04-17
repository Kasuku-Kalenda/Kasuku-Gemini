
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { TimelineListingPage } from './pages/TimelineListingPage';
import { TimelinePage } from './pages/TimelinePage';
import { ModulePage } from './pages/ModulePage';
import { ModulesIndexPage } from './pages/ModulesIndexPage';
import { DateTimelinePage } from './pages/DateTimelinePage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminModulesPage } from './pages/admin/AdminModulesPage';
import { AdminThemesPage } from './pages/admin/AdminThemesPage';
import { AdminFeaturedPage } from './pages/admin/AdminFeaturedPage';
import { AdminTimelinesPage } from './pages/admin/AdminTimelinesPage';
import { EventFormPage } from './pages/admin/forms/EventFormPage';
import { ModuleFormPage } from './pages/admin/forms/ModuleFormPage';
import { ThemeFormPage } from './pages/admin/forms/ThemeFormPage';
import { FeaturedFormPage } from './pages/admin/forms/FeaturedFormPage';
import { TimelineFormPage } from './pages/admin/forms/TimelineFormPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import type { Event, TrainingModule } from './types';
import { EVENTS, ALL_TRAINING_MODULES, TIMELINES } from './constants';
// Moodle Admin Pages
import { AdminMoodleInstancesPage } from './pages/admin/moodle/AdminMoodleInstancesPage';
import { AdminMoodleCoursesPage } from './pages/admin/moodle/AdminMoodleCoursesPage';
import { AdminMoodlePackagesPage } from './pages/admin/moodle/AdminMoodlePackagesPage';
import { AdminMoodleMapsPage } from './pages/admin/moodle/AdminMoodleMapsPage';
import { MoodleInstanceFormPage } from './pages/admin/moodle/forms/MoodleInstanceFormPage';
import { MoodleCourseFormPage } from './pages/admin/moodle/forms/MoodleCourseFormPage';
import { MoodlePackageFormPage } from './pages/admin/moodle/forms/MoodlePackageFormPage';
import { MoodleMapFormPage } from './pages/admin/moodle/forms/MoodleMapFormPage';
import { MoodlePackageUploadPage } from './pages/admin/moodle/forms/MoodlePackageUploadPage';
// Offline Player Pages
import { ScormPlayerPage } from './pages/offline/ScormPlayerPage';
import { H5pPlayerPage } from './pages/offline/H5pPlayerPage';


type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timelines' | 'timeline' | 'module' | 'modules' | 'dateTimeline' |
            'adminLogin' | 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminTimelines' |
            'adminNewEvent' | 'adminEditEvent' | 'adminNewModule' | 'adminEditModule' |
            'adminNewTheme' | 'adminEditTheme' | 'adminFeatured' | 'adminNewFeatured' | 'adminEditFeatured' |
            'adminNewTimeline' | 'adminEditTimeline' |
            'adminMoodleInstances' | 'adminNewMoodleInstance' | 'adminEditMoodleInstance' |
            'adminMoodleCourses' | 'adminNewMoodleCourse' | 'adminEditMoodleCourse' |
            'adminMoodlePackages' | 'adminNewMoodlePackage' | 'adminEditMoodlePackage' | 'adminMoodlePackageUpload' |
            'adminMoodleMaps' | 'adminNewMoodleMap' | 'adminEditMoodleMap' |
            'offlineScorm' | 'offlineH5p';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('calendar');
  const [previousView, setPreviousView] = useState<View | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTimelineSlug, setSelectedTimelineSlug] = useState<string | null>(null);
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string | null>(null);
  const [selectedDateForTimeline, setSelectedDateForTimeline] = useState<Date | null>(null);
  const [eventsForTimeline, setEventsForTimeline] = useState<Event[]>([]);
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const scrollPositions = useRef<Partial<Record<View, number>>>({});
  const { session } = useAuth();

  const navigateTo = useCallback((newView: View, id?: string) => {
    if (view !== newView || (id && id !== selectedItemId)) {
      scrollPositions.current[view] = window.scrollY;
      setScrollTargetId(null);
      setPreviousView(view);
      setView(newView);
      setSelectedItemId(id ?? null);
      window.scrollTo(0, 0);
    }
  }, [view, selectedItemId]);

  const viewEvent = useCallback((event: Event) => {
    scrollPositions.current[view] = window.scrollY;
    setScrollTargetId(event.id); 
    setPreviousView(view);
    setSelectedEvent(event);
    setView('event');
    window.scrollTo(0, 0);
  }, [view]);

  const navigateToTimeline = useCallback((slug: string, eventId?: string) => {
    scrollPositions.current[view] = window.scrollY;
    setPreviousView(view);
    setSelectedTimelineSlug(slug);
    setSelectedTimelineEventId(eventId ?? null);
    setView('timeline');
    window.scrollTo(0, 0);
  }, [view]);

  const navigateToDateTimeline = useCallback((date: Date, events: Event[]) => {
    scrollPositions.current[view] = window.scrollY;
    setPreviousView(view);
    setSelectedDateForTimeline(date);
    setEventsForTimeline(events);
    setView('dateTimeline');
    window.scrollTo(0, 0);
  }, [view]);
  
  const navigateToModule = useCallback((slug: string) => {
      // On vérifie d'abord si c'est un module
      const module = ALL_TRAINING_MODULES.find(m => m.slug === slug);
      if (module) {
          scrollPositions.current[view] = window.scrollY;
          setPreviousView(view);
          setSelectedModule(module);
          setView('module');
          window.scrollTo(0, 0);
          return;
      }
      // Sinon on vérifie si c'est une timeline (parcours)
      const timeline = TIMELINES.find(t => t.slug === slug);
      if (timeline) {
          navigateToTimeline(slug);
          return;
      }
  }, [view, navigateToTimeline]);

  const navigateToEventBySlug = useCallback((slug: string) => {
    const event = EVENTS.find(e => e.slug === slug);
    if (event) viewEvent(event);
  }, [viewEvent]);

  const navigateBack = useCallback(() => {
    if (previousView) {
      setView(previousView);
      if(previousView === 'module') setPreviousView('modules');
    }
  }, [previousView]);

  useEffect(() => {
    if ((previousView === 'event' || previousView === 'module') && scrollTargetId) return;
    const savedPosition = scrollPositions.current[view];
    if (typeof savedPosition === 'number') {
      setTimeout(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }), 0);
    }
  }, [view, previousView, scrollTargetId]);
  
  useEffect(() => {
    const userRole = session?.user?.role;
    const isAuthorizedAdmin = userRole === 'SUPERADMIN' || userRole === 'EDITOR';
    if (view.startsWith('admin') && view !== 'adminLogin' && !isAuthorizedAdmin) {
      setView('adminLogin');
    }
  }, [view, session]);

  const onScrolled = useCallback(() => setScrollTargetId(null), []);

  const renderView = () => {
    const userRole = session?.user?.role;
    const isAuthorizedAdmin = userRole === 'SUPERADMIN' || userRole === 'EDITOR';
    
    if (view.startsWith('admin') && view !== 'adminLogin' && !isAuthorizedAdmin) {
        return <AdminLoginPage navigateTo={navigateTo} />;
    }
    
    const viewEventById = (eventId: string) => {
        const event = EVENTS.find(e => e.id === eventId);
        if (event) viewEvent(event);
    };
    
    switch (view) {
      case 'home':
        return <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule}/>;
      case 'calendar':
        return <CalendarPage onViewEvent={viewEvent} navigateToModule={navigateToModule} navigateToEventBySlug={navigateToEventBySlug} navigateToDateTimeline={navigateToDateTimeline} />;
      case 'timelines':
        return <TimelineListingPage onSelectTimeline={(slug) => navigateToTimeline(slug)} />;
      case 'timeline':
        return <TimelinePage onViewEvent={viewEvent} timelineSlug={selectedTimelineSlug} initialEventId={selectedTimelineEventId} onBack={navigateBack} />;
      case 'dateTimeline':
        return selectedDateForTimeline ? <DateTimelinePage onViewEvent={viewEvent} events={eventsForTimeline} date={selectedDateForTimeline} onBack={navigateBack} /> : <CalendarPage onViewEvent={viewEvent} navigateToModule={navigateToModule} navigateToEventBySlug={navigateToEventBySlug} navigateToDateTimeline={navigateToDateTimeline} />;
      case 'favorites':
        return <FavoritesPage onViewEvent={viewEvent} navigateToModule={navigateToModule} />;
      case 'modules':
        return <ModulesIndexPage navigateToModule={navigateToModule} />;
      case 'event':
        return selectedEvent ? <EventDetailPage event={selectedEvent} onBack={navigateBack} fromView={previousView || 'home'} navigateToModule={navigateToModule} navigateToTimeline={navigateToTimeline} /> : <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />;
      case 'module':
        return selectedModule ? <ModulePage module={selectedModule} onNavigateToEvent={viewEventById} onBack={navigateBack} navigateTo={navigateTo} /> : <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule} />;
      
      case 'adminLogin':
        return <AdminLoginPage navigateTo={navigateTo} />;
      case 'adminDashboard':
        return <AdminDashboardPage navigateTo={navigateTo as any} />;
      case 'adminEvents':
          return <AdminEventsPage navigateTo={navigateTo as any}/>;
      case 'adminModules':
          return <AdminModulesPage navigateTo={navigateTo as any}/>;
      case 'adminThemes':
          return <AdminThemesPage navigateTo={navigateTo as any}/>;
      case 'adminTimelines':
          return <AdminTimelinesPage navigateTo={navigateTo as any}/>;
      case 'adminFeatured':
          return <AdminFeaturedPage navigateTo={navigateTo as any}/>;
      case 'adminNewEvent':
          return <EventFormPage mode="create" onSave={() => navigateTo('adminEvents')} />;
      case 'adminEditEvent':
          return <EventFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminEvents')} />;
      case 'adminNewModule':
          return <ModuleFormPage mode="create" onSave={() => navigateTo('adminModules')} />;
      case 'adminEditModule':
          return <ModuleFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminModules')} />;
      case 'adminNewTheme':
          return <ThemeFormPage mode="create" onSave={() => navigateTo('adminThemes')} />;
      case 'adminEditTheme':
          return <ThemeFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminThemes')} />;
      case 'adminNewFeatured':
          return <FeaturedFormPage mode="create" onSave={() => navigateTo('adminFeatured')} />;
      case 'adminEditFeatured':
          return <FeaturedFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminFeatured')} />;
      case 'adminNewTimeline':
          return <TimelineFormPage mode="create" onSave={() => navigateTo('adminTimelines')} />;
      case 'adminEditTimeline':
          return <TimelineFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminTimelines')} />;

      case 'adminMoodleInstances':
          return <AdminMoodleInstancesPage navigateTo={navigateTo as any} />;
      case 'adminNewMoodleInstance':
          return <MoodleInstanceFormPage mode="create" onSave={() => navigateTo('adminMoodleInstances')} />;
      case 'adminEditMoodleInstance':
          return <MoodleInstanceFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminMoodleInstances')} />;
      case 'adminMoodleCourses':
          return <AdminMoodleCoursesPage navigateTo={navigateTo as any} />;
      case 'adminNewMoodleCourse':
          return <MoodleCourseFormPage mode="create" onSave={() => navigateTo('adminMoodleCourses')} />;
      case 'adminEditMoodleCourse':
          return <MoodleCourseFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminMoodleCourses')} />;
      case 'adminMoodlePackages':
          return <AdminMoodlePackagesPage navigateTo={navigateTo as any} />;
       case 'adminMoodlePackageUpload':
          return <MoodlePackageUploadPage navigateTo={navigateTo as any} />;
      case 'adminNewMoodlePackage':
          return <MoodlePackageFormPage mode="create" onSave={() => navigateTo('adminMoodlePackages')} />;
      case 'adminEditMoodlePackage':
          return <MoodlePackageFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminMoodlePackages')} />;
      case 'adminMoodleMaps':
          return <AdminMoodleMapsPage navigateTo={navigateTo as any} />;
      case 'adminNewMoodleMap':
          return <MoodleMapFormPage mode="create" onSave={() => navigateTo('adminMoodleMaps')} />;
      case 'adminEditMoodleMap':
          return <MoodleMapFormPage mode="edit" id={selectedItemId} onSave={() => navigateTo('adminMoodleMaps')} />;
      case 'offlineScorm':
          return <ScormPlayerPage baseUrl={selectedItemId!} onBack={navigateBack} />;
      case 'offlineH5p':
          return <H5pPlayerPage baseUrl={selectedItemId!} onBack={navigateBack} />;

      default:
        return <HomePage onViewEvent={viewEvent} navigateToModule={navigateToModule}/>;
    }
  };

  const isPublicView = !view.startsWith('admin') && !view.startsWith('offline') && view !== 'timeline' && view !== 'dateTimeline';
  const isImmersiveTimeline = view === 'timeline' || view === 'dateTimeline';
  const isOfflinePlayer = view.startsWith('offline');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view + (selectedItemId || '') + (selectedEvent?.id || '') + (selectedModule?.id || '')}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {isPublicView ? (
           <Layout currentView={view as any} navigateTo={navigateTo as any}>
              {renderView()}
           </Layout>
        ) : isImmersiveTimeline ? (
           <div className="bg-[#FAF8F5] min-h-screen">
               {renderView()}
           </div>
        ) : isOfflinePlayer ? (
          <div className="bg-light min-h-screen">{renderView()}</div>
        ) : (
          renderView()
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}
