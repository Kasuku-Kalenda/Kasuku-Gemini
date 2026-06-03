/**
 * shell/AdminApp.tsx — Admin shell
 *
 * Handles all admin views. User views are handled by UserApp.tsx.
 * Uses NavigationContext instead of prop-drilled navigateTo callbacks.
 *
 * All pages are lazy-loaded — admin bundle is never loaded for regular users.
 */

import React, { Suspense } from 'react';
import { useNavigation } from '../core/navigation';
import type { AppView } from '../core/navigation';
import { useAuth } from '../hooks/useAuth';

// AdminLoginPage reste statique : toujours potentiellement nécessaire pour le guard
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';

// ── Lazy admin pages ──────────────────────────────────────────────────────────
const AdminDashboardPage       = React.lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminEventsPage          = React.lazy(() => import('../pages/admin/AdminEventsPage').then(m => ({ default: m.AdminEventsPage })));
const AdminModulesPage         = React.lazy(() => import('../pages/admin/AdminModulesPage').then(m => ({ default: m.AdminModulesPage })));
const AdminThemesPage          = React.lazy(() => import('../pages/admin/AdminThemesPage').then(m => ({ default: m.AdminThemesPage })));
const AdminFeaturedPage        = React.lazy(() => import('../pages/admin/AdminFeaturedPage').then(m => ({ default: m.AdminFeaturedPage })));
const AdminTimelinesPage       = React.lazy(() => import('../pages/admin/AdminTimelinesPage').then(m => ({ default: m.AdminTimelinesPage })));
const AdminKalendaPage         = React.lazy(() => import('../pages/admin/AdminKalendaPage').then(m => ({ default: m.AdminKalendaPage })));
const AdminSyncPage            = React.lazy(() => import('../pages/admin/AdminSyncPage').then(m => ({ default: m.AdminSyncPage })));
const AdminImportPage          = React.lazy(() => import('../pages/admin/AdminImportPage').then(m => ({ default: m.AdminImportPage })));
const EventFormPage            = React.lazy(() => import('../pages/admin/forms/EventFormPage').then(m => ({ default: m.EventFormPage })));
const ModuleFormPage           = React.lazy(() => import('../pages/admin/forms/ModuleFormPage').then(m => ({ default: m.ModuleFormPage })));
const ThemeFormPage            = React.lazy(() => import('../pages/admin/forms/ThemeFormPage').then(m => ({ default: m.ThemeFormPage })));
const FeaturedFormPage         = React.lazy(() => import('../pages/admin/forms/FeaturedFormPage').then(m => ({ default: m.FeaturedFormPage })));
const TimelineFormPage         = React.lazy(() => import('../pages/admin/forms/TimelineFormPage').then(m => ({ default: m.TimelineFormPage })));
const AdminMoodleInstancesPage = React.lazy(() => import('../pages/admin/moodle/AdminMoodleInstancesPage').then(m => ({ default: m.AdminMoodleInstancesPage })));
const AdminMoodleCoursesPage   = React.lazy(() => import('../pages/admin/moodle/AdminMoodleCoursesPage').then(m => ({ default: m.AdminMoodleCoursesPage })));
const AdminMoodlePackagesPage  = React.lazy(() => import('../pages/admin/moodle/AdminMoodlePackagesPage').then(m => ({ default: m.AdminMoodlePackagesPage })));
const AdminMoodleMapsPage      = React.lazy(() => import('../pages/admin/moodle/AdminMoodleMapsPage').then(m => ({ default: m.AdminMoodleMapsPage })));
const MoodleInstanceFormPage   = React.lazy(() => import('../pages/admin/moodle/forms/MoodleInstanceFormPage').then(m => ({ default: m.MoodleInstanceFormPage })));
const MoodleCourseFormPage     = React.lazy(() => import('../pages/admin/moodle/forms/MoodleCourseFormPage').then(m => ({ default: m.MoodleCourseFormPage })));
const MoodlePackageFormPage    = React.lazy(() => import('../pages/admin/moodle/forms/MoodlePackageFormPage').then(m => ({ default: m.MoodlePackageFormPage })));
const MoodleMapFormPage        = React.lazy(() => import('../pages/admin/moodle/forms/MoodleMapFormPage').then(m => ({ default: m.MoodleMapFormPage })));
const MoodlePackageUploadPage  = React.lazy(() => import('../pages/admin/moodle/forms/MoodlePackageUploadPage').then(m => ({ default: m.MoodlePackageUploadPage })));
const AdminPeoplePage          = React.lazy(() => import('../pages/admin/AdminPeoplePage').then(m => ({ default: m.AdminPeoplePage })));
const PersonFormPage           = React.lazy(() => import('../pages/admin/forms/PersonFormPage').then(m => ({ default: m.PersonFormPage })));

// ── Fallback ──────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs text-muted-foreground">Chargement…</span>
    </div>
  </div>
);

export const AdminApp: React.FC = () => {
  const { view, payload, navigate } = useNavigation();
  const { session } = useAuth();

  const userRole    = session?.user?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'editor';

  const legacyNavigateTo = (v: string, id?: string) => {
    navigate(v as AppView, id ? { id } : undefined);
  };

  // Guard — redirect to login if not authorized
  if (!isAuthorized && view !== 'adminLogin') {
    return <AdminLoginPage navigateTo={legacyNavigateTo as any} />;
  }

  const goToList = (listView: AppView) => () => navigate(listView);

  const renderView = () => {
    switch (view) {
      case 'adminLogin':
        return <AdminLoginPage navigateTo={legacyNavigateTo as any} />;

      case 'adminDashboard':
        return <AdminDashboardPage navigateTo={legacyNavigateTo as any} />;

      case 'adminEvents':
        return <AdminEventsPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewEvent':
        return <EventFormPage mode="create" onSave={goToList('adminEvents')} />;
      case 'adminEditEvent':
        return <EventFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminEvents')} />;

      case 'adminThemes':
        return <AdminThemesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewTheme':
        return <ThemeFormPage mode="create" onSave={goToList('adminThemes')} />;
      case 'adminEditTheme':
        return <ThemeFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminThemes')} />;

      case 'adminTimelines':
        return <AdminTimelinesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewTimeline':
        return <TimelineFormPage mode="create" onSave={goToList('adminTimelines')} />;
      case 'adminEditTimeline':
        return <TimelineFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminTimelines')} />;

      case 'adminModules':
        return <AdminModulesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewModule':
        return <ModuleFormPage mode="create" onSave={goToList('adminModules')} />;
      case 'adminEditModule':
        return <ModuleFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminModules')} />;

      case 'adminFeatured':
        return <AdminFeaturedPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewFeatured':
        return <FeaturedFormPage mode="create" onSave={goToList('adminFeatured')} />;
      case 'adminEditFeatured':
        return <FeaturedFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminFeatured')} />;

      case 'adminMoodleInstances':
        return <AdminMoodleInstancesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleInstance':
        return <MoodleInstanceFormPage mode="create" onSave={goToList('adminMoodleInstances')} />;
      case 'adminEditMoodleInstance':
        return <MoodleInstanceFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleInstances')} />;

      case 'adminMoodleCourses':
        return <AdminMoodleCoursesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleCourse':
        return <MoodleCourseFormPage mode="create" onSave={goToList('adminMoodleCourses')} />;
      case 'adminEditMoodleCourse':
        return <MoodleCourseFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleCourses')} />;

      case 'adminMoodlePackages':
        return <AdminMoodlePackagesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminMoodlePackageUpload':
        return <MoodlePackageUploadPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodlePackage':
        return <MoodlePackageFormPage mode="create" onSave={goToList('adminMoodlePackages')} />;
      case 'adminEditMoodlePackage':
        return <MoodlePackageFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodlePackages')} />;

      case 'adminMoodleMaps':
        return <AdminMoodleMapsPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleMap':
        return <MoodleMapFormPage mode="create" onSave={goToList('adminMoodleMaps')} />;
      case 'adminEditMoodleMap':
        return <MoodleMapFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleMaps')} />;

      case 'adminPeople':
        return <AdminPeoplePage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewPerson':
        return <PersonFormPage mode="create" onSave={goToList('adminPeople')} />;
      case 'adminEditPerson':
        return <PersonFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminPeople')} />;

      case 'adminKalenda':
        return <AdminKalendaPage navigateTo={legacyNavigateTo as any} />;

      case 'adminSync':
        return <AdminSyncPage navigateTo={legacyNavigateTo as any} />;
      case 'adminImport':
        return <AdminImportPage navigateTo={legacyNavigateTo as any} />;

      default:
        return <AdminDashboardPage navigateTo={legacyNavigateTo as any} />;
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      {renderView()}
    </Suspense>
  );
};
