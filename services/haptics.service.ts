/**
 * haptics.service.ts
 *
 * Retour haptique léger sur les interactions clés.
 * No-op silencieux dans le navigateur.
 */

import { Capacitor } from '@capacitor/core';

async function getHapticsPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  return { Haptics, ImpactStyle };
}

/** Tap léger — navigation, boutons secondaires */
export async function hapticLight() {
  const plugin = await getHapticsPlugin();
  if (!plugin) return;
  await plugin.Haptics.impact({ style: plugin.ImpactStyle.Light });
}

/** Tap moyen — actions importantes, ouverture de page */
export async function hapticMedium() {
  const plugin = await getHapticsPlugin();
  if (!plugin) return;
  await plugin.Haptics.impact({ style: plugin.ImpactStyle.Medium });
}

/** Vibration succès — confirmation, like */
export async function hapticSuccess() {
  const plugin = await getHapticsPlugin();
  if (!plugin) return;
  await plugin.Haptics.notification({ type: (await import('@capacitor/haptics')).NotificationType.Success });
}
