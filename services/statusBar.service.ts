/**
 * statusBar.service.ts
 *
 * Synchronise le style de la status bar avec le thème système (clair/sombre).
 * Fonctionne uniquement dans l'app Capacitor (pas dans le navigateur).
 */

import { Capacitor } from '@capacitor/core';

async function getStatusBarPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  return { StatusBar, Style };
}

async function applyStatusBarStyle(isDark: boolean) {
  const plugin = await getStatusBarPlugin();
  if (!plugin) return;

  const { StatusBar, Style } = plugin;

  if (isDark) {
    // Mode sombre : fond sombre, icônes blanches
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0F1923' });
  } else {
    // Mode clair : fond blanc, icônes sombres
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
  }
}

export async function initDynamicStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  // Appliquer le style initial
  await applyStatusBarStyle(mq.matches);

  // Écouter les changements de thème
  mq.addEventListener('change', (e) => {
    void applyStatusBarStyle(e.matches);
  });
}
