/**
 * pushNotifications.service.ts
 *
 * Gère l'enregistrement FCM, la réception des notifications, et le tap.
 * Fonctionne uniquement dans l'app Capacitor (pas dans le navigateur).
 */

import { Capacitor } from '@capacitor/core';
import { api } from './apiClient';

// Lazy import Capacitor plugin — évite les erreurs dans le browser
async function getPushPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
}

type NavigateToEventFn = (slug: string) => void;

// ─── Initialisation ───────────────────────────────────────────────────────────

export async function initPushNotifications(navigateToEvent: NavigateToEventFn) {
  const Push = await getPushPlugin();
  if (!Push) return; // navigateur web — rien à faire

  // Demander la permission
  const permission = await Push.requestPermissions();
  if (permission.receive !== 'granted') return;

  // S'enregistrer auprès de FCM
  await Push.register();

  // ── Token FCM reçu → l'envoyer au backend ────────────────────────────────
  await Push.addListener('registration', async ({ value: token }) => {
    try {
      const deviceId = await import('@capacitor/device')
        .then(m => m.Device.getId())
        .then(r => r.identifier)
        .catch(() => undefined);

      await api.post('/push/register', {
        token,
        platform: Capacitor.getPlatform(),
        deviceId,
      });
    } catch (err) {
      console.warn('[Push] Échec enregistrement token:', err);
    }
  });

  // ── Erreur d'enregistrement ───────────────────────────────────────────────
  await Push.addListener('registrationError', (err) => {
    console.error('[Push] Erreur d\'enregistrement FCM:', err);
  });

  // ── Notification reçue pendant que l'app est ouverte ─────────────────────
  await Push.addListener('pushNotificationReceived', (notification) => {
    console.info('[Push] Notification reçue:', notification.title);
    // Optionnel : afficher un toast en overlay
  });

  // ── Tap sur une notification ──────────────────────────────────────────────
  await Push.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data as Record<string, string> | undefined;
    if (data?.eventSlug) {
      navigateToEvent(data.eventSlug);
    }
  });
}

// ─── Désenregistrement (au logout) ───────────────────────────────────────────

export async function unregisterPushToken(token: string) {
  try {
    await api.delete(`/push/token?token=${encodeURIComponent(token)}`);
    const Push = await getPushPlugin();
    if (Push) await Push.removeAllListeners();
  } catch (err) {
    console.warn('[Push] Désenregistrement échoué:', err);
  }
}
