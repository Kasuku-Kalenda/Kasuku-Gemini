/**
 * modules/timelines/index.ts — Timelines module manifest
 *
 * Set `enabled: false` to completely disconnect the timelines feature.
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const timelinesModule: KasukuModule = {
  id: 'timelines',
  label: 'Récits & Parcours',
  emoji: '🎭',
  version: '1.0.0',
  enabled: true,
  userViews: ['timelines', 'timeline'],
  adminViews: ['adminTimelines', 'adminNewTimeline', 'adminEditTimeline'],
  userNavItem: { view: 'timelines', label: 'Récits' },
  adminNavItems: [
    { view: 'adminTimelines', label: 'Timelines (Parcours)', emoji: '🎭' },
  ],
};
