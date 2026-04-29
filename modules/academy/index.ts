/**
 * modules/academy/index.ts — Academy (LMS) module manifest
 *
 * Set `enabled: false` to completely disconnect the academy/modules feature.
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const academyModule: KasukuModule = {
  id: 'academy',
  label: 'Formation',
  emoji: '🎓',
  version: '1.0.0',
  enabled: true,
  userViews: ['modules', 'module'],
  adminViews: ['adminModules', 'adminNewModule', 'adminEditModule'],
  userNavItem: { view: 'modules', label: 'Formation' },
  adminNavItems: [
    { view: 'adminModules', label: 'Modules', emoji: '🎓' },
  ],
};
