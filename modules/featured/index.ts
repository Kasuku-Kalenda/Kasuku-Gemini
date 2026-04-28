/**
 * modules/featured/index.ts — Featured (Stories / Mise en avant) module manifest
 *
 * Set `enabled: false` to completely disconnect the featured stories feature.
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const featuredModule: KasukuModule = {
  id: 'featured',
  label: 'À la une',
  emoji: '⭐',
  version: '1.0.0',
  enabled: true,
  userViews: [],
  adminViews: ['adminFeatured', 'adminNewFeatured', 'adminEditFeatured'],
  adminNavItems: [
    { view: 'adminFeatured', label: 'À la une', emoji: '⭐' },
  ],
};
