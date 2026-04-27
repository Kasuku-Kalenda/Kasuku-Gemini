/**
 * ─── MODULE REGISTRY ─────────────────────────────────────────────────────────
 *
 * This is the single file that controls what features are active in Kasuku.
 *
 * To DISABLE a module: set `enabled: false` in its index.ts
 * To REMOVE a module: delete its import and remove from MODULES array
 * To ADD a module: create modules/[name]/, implement KasukuModule, add here
 *
 * Order of MODULES array = order in user bottom nav + admin sidebar
 */

import { calendarModule } from './calendar';
import { timelinesModule } from './timelines';
import { academyModule } from './academy';
import { featuredModule } from './featured';
import { moodleModule } from './moodle';
import type { KasukuModule, AdminNavItem, UserNavView } from './_types';
import type { AppView } from '../core/navigation';

export const MODULES: KasukuModule[] = [
  calendarModule,
  timelinesModule,
  academyModule,
  featuredModule,
  moodleModule,
].filter(m => m.enabled);

/** All views enabled in current configuration */
const enabledUserViews = new Set(MODULES.flatMap(m => m.userViews ?? []));
const enabledAdminViews = new Set(MODULES.flatMap(m => m.adminViews ?? []));

/** Core views that are always available regardless of modules */
const CORE_VIEWS: AppView[] = [
  'home', 'favorites',
  'adminLogin', 'adminDashboard', 'adminSync', 'adminImport',
];

/** Check if a view is provided by an enabled module */
export const isViewEnabled = (view: AppView): boolean =>
  enabledUserViews.has(view) ||
  enabledAdminViews.has(view) ||
  CORE_VIEWS.includes(view);

/** User bottom nav items from all enabled modules (in registry order) */
export const USER_NAV_ITEMS: UserNavView[] = MODULES
  .filter(m => m.userNavItem)
  .map(m => m.userNavItem!);

/** Admin sidebar nav items from all enabled modules */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = MODULES.flatMap(m => m.adminNavItems ?? []);
