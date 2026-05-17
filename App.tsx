/**
 * App.tsx — Root component
 *
 * Wraps in AuthProvider + NavigationProvider, then delegates to
 * LayeredViewStack which renders the keep-alive layer stack.
 */

import React, { useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { NavigationProvider, useNavigation } from './core/navigation';
import { LayeredViewStack } from './core/navigation/LayeredViewStack';
import { initPushNotifications } from './services/pushNotifications.service';
import { initDynamicStatusBar } from './services/statusBar.service';
import { apiService } from './services/api.service';

// Composant interne qui a accès au contexte navigation
function AppWithPush() {
  const { navigate } = useNavigation();

  useEffect(() => {
    // Status bar dynamique selon le thème système
    void initDynamicStatusBar();

    // Push notifications
    const navigateToEvent = async (slug: string) => {
      const event = await apiService.getEventBySlug(slug);
      if (event) navigate('event', { event });
    };
    void initPushNotifications(navigateToEvent);
  }, [navigate]);

  return <LayeredViewStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider initialView="calendar">
        <AppWithPush />
      </NavigationProvider>
    </AuthProvider>
  );
}
