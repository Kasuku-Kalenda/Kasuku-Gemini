/**
 * modules/calendar/index.ts — Calendar module manifest
 *
 * Set `enabled: false` to completely disconnect the calendar feature.
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const calendarModule: KasukuModule = {
  id: 'calendar',
  label: 'Calendrier culturel',
  emoji: '📅',
  version: '1.0.0',
  enabled: true,
  userViews: ['calendar', 'event', 'dateTimeline'],
  adminViews: ['adminEvents', 'adminNewEvent', 'adminEditEvent', 'adminThemes', 'adminNewTheme', 'adminEditTheme'],
  userNavItem: { view: 'calendar', label: 'Calendrier' },
  adminNavItems: [
    { view: 'adminEvents', label: 'Événements Calendrier', emoji: '📅' },
    { view: 'adminThemes', label: 'Thèmes', emoji: '🏷️' },
  ],
};
