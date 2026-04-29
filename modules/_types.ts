/**
 * modules/_types.ts — KasukuModule interface
 *
 * Every feature module implements this interface and registers itself in
 * modules/_registry.ts.  Setting `enabled: false` in the module's index.ts
 * completely disconnects it — no routes, no nav items, no admin access.
 */

import type { AppView } from '../core/navigation';

export interface AdminNavItem {
  view: AppView;
  label: string;
  emoji: string;
  /** SUPERADMIN-only items won't show for EDITOR role */
  superAdminOnly?: boolean;
}

export interface UserNavView {
  view: AppView;
  label: string;
}

/**
 * KasukuModule — the Lego brick interface.
 * Each feature module implements this and registers in _registry.ts.
 */
export interface KasukuModule {
  id: string;
  label: string;
  emoji: string;
  version: string;
  /**
   * Master switch: false = module fully disconnected.
   * No routes, no nav items, no admin access.
   */
  enabled: boolean;
  /** Which views this module provides (user-facing) */
  userViews?: AppView[];
  /** Which views this module provides (admin) */
  adminViews?: AppView[];
  /** Bottom nav item for public shell */
  userNavItem?: UserNavView;
  /** Sidebar item(s) for admin shell */
  adminNavItems?: AdminNavItem[];
}
