/**
 * shell/AdminApp.tsx — Admin shell
 *
 * Handles all admin views. User views are handled by UserApp.tsx.
 * Uses NavigationContext instead of prop-drilled navigateTo callbacks.
 */

import React from 'react';
import { useNavigation } from '../core/navigation';
import type { AppView } from '../core/navigation';
import { useAuth } from '../hooks/useAuth';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminEventsPage } from '../pages/admin/AdminEventsPage';
import { AdminModulesPage } from '../pages/admin/AdminModulesPage';
import { AdminThemesPage } from '../pages/admin/AdminThemesPage';
import { AdminFeaturedPage } from '../pages/admin/AdminFeaturedPage';
import { AdminTimelinesPage } from '../pages/admin/AdminTimelinesPage';
import { EventFormPage } from '../pages/admin/forms/EventFormPage';
import { ModuleFormPage } from '../pages/admin/forms/ModuleFormPage';
import { ThemeFormPage } from '../pages/admin/forms/ThemeFormPage';
import { FeaturedFormPage } from '../pages/admin/forms/FeaturedFormPage';
import { TimelineFormPage } from '../pages/admin/forms/TimelineFormPage';
import { AdminMoodleInstancesPage } from '../pages/admin/moodle/AdminMoodleInstancesPage';
import { AdminMoodleCoursesPage } from '../pages/admin/moodle/AdminMoodleCoursesPage';
import { AdminMoodlePackagesPage } from '../pages/admin/moodle/AdminMoodlePackagesPage';
import { AdminMoodleMapsPage } from '../pages/admin/moodle/AdminMoodleMapsPage';
import { MoodleInstanceFormPage } from '../pages/admin/moodle/forms/MoodleInstanceFormPage';
import { MoodleCourseFormPage } from '../pages/admin/moodle/forms/MoodleCourseFormPage';
import { MoodlePackageFormPage } from '../pages/admin/moodle/forms/MoodlePackageFormPage';
import { MoodleMapFormPage } from '../pages/admin/moodle/forms/MoodleMapFormPage';
import { MoodlePackageUploadPage } from '../pages/admin/moodle/forms/MoodlePackageUploadPage';
import { AdminSyncPage } from '../pages/admin/AdminSyncPage';
import { AdminImportPage } from '../pages/admin/AdminImportPage';

export const AdminApp: React.FC = () => {
  const { view, payload, navigate } = useNavigation();
  const { session } = useAuth();

  const userRole = session?.user?.role;
  const isAuthorized = userRole === 'SUPERADMIN' || userRole === 'EDITOR';

  // Convenience: adapter for pages that use the old (view, id?) signature
  const legacyNavigateTo = (v: string, id?: string) => {
    navigate(v as AppView, id ? { id } : undefined);
  };

  // Guard — redirect to login if not authorized
  if (!isAuthorized && view !== 'adminLogin') {
    return <AdminLoginPage navigateTo={legacyNavigateTo as any} />;
  }

  // Helper: create a "go to list" callback for form save handlers
  const goToList = (listView: AppView) => () => navigate(listView);

  const renderView = () => {
    switch (view) {
      // ── Auth ──────────────────────────────────────────────────────────────
      case 'adminLogin':
        return <AdminLoginPage navigateTo={legacyNavigateTo as any} />;

      // ── Dashboard ─────────────────────────────────────────────────────────
      case 'adminDashboard':
        return <AdminDashboardPage navigateTo={legacyNavigateTo as any} />;

      // ── Calendar / Events ─────────────────────────────────────────────────
      case 'adminEvents':
        return <AdminEventsPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewEvent':
        return <EventFormPage mode="create" onSave={goToList('adminEvents')} />;
      case 'adminEditEvent':
        return <EventFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminEvents')} />;

      // ── Calendar / Themes ─────────────────────────────────────────────────
      case 'adminThemes':
        return <AdminThemesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewTheme':
        return <ThemeFormPage mode="create" onSave={goToList('adminThemes')} />;
      case 'adminEditTheme':
        return <ThemeFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminThemes')} />;

      // ── Timelines ─────────────────────────────────────────────────────────
      case 'adminTimelines':
        return <AdminTimelinesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewTimeline':
        return <TimelineFormPage mode="create" onSave={goToList('adminTimelines')} />;
      case 'adminEditTimeline':
        return <TimelineFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminTimelines')} />;

      // ── Academy / Modules ─────────────────────────────────────────────────
      case 'adminModules':
        return <AdminModulesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewModule':
        return <ModuleFormPage mode="create" onSave={goToList('adminModules')} />;
      case 'adminEditModule':
        return <ModuleFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminModules')} />;

      // ── Featured ──────────────────────────────────────────────────────────
      case 'adminFeatured':
        return <AdminFeaturedPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewFeatured':
        return <FeaturedFormPage mode="create" onSave={goToList('adminFeatured')} />;
      case 'adminEditFeatured':
        return <FeaturedFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminFeatured')} />;

      // ── Moodle — Instances ────────────────────────────────────────────────
      case 'adminMoodleInstances':
        return <AdminMoodleInstancesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleInstance':
        return <MoodleInstanceFormPage mode="create" onSave={goToList('adminMoodleInstances')} />;
      case 'adminEditMoodleInstance':
        return <MoodleInstanceFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleInstances')} />;

      // ── Moodle — Courses ──────────────────────────────────────────────────
      case 'adminMoodleCourses':
        return <AdminMoodleCoursesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleCourse':
        return <MoodleCourseFormPage mode="create" onSave={goToList('adminMoodleCourses')} />;
      case 'adminEditMoodleCourse':
        return <MoodleCourseFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleCourses')} />;

      // ── Moodle — Packages ─────────────────────────────────────────────────
      case 'adminMoodlePackages':
        return <AdminMoodlePackagesPage navigateTo={legacyNavigateTo as any} />;
      case 'adminMoodlePackageUpload':
        return <MoodlePackageUploadPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodlePackage':
        return <MoodlePackageFormPage mode="create" onSave={goToList('adminMoodlePackages')} />;
      case 'adminEditMoodlePackage':
        return <MoodlePackageFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodlePackages')} />;

      // ── Moodle — Maps ─────────────────────────────────────────────────────
      case 'adminMoodleMaps':
        return <AdminMoodleMapsPage navigateTo={legacyNavigateTo as any} />;
      case 'adminNewMoodleMap':
        return <MoodleMapFormPage mode="create" onSave={goToList('adminMoodleMaps')} />;
      case 'adminEditMoodleMap':
        return <MoodleMapFormPage mode="edit" id={payload.id ?? null} onSave={goToList('adminMoodleMaps')} />;

      // ── Sync / Import ─────────────────────────────────────────────────────
      case 'adminSync':
        return <AdminSyncPage navigateTo={legacyNavigateTo as any} />;
      case 'adminImport':
        return <AdminImportPage navigateTo={legacyNavigateTo as any} />;

      default:
        return <AdminDashboardPage navigateTo={legacyNavigateTo as any} />;
    }
  };

  return <>{renderView()}</>;
};
