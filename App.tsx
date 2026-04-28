/**
 * App.tsx — Root component
 *
 * Wraps in AuthProvider + NavigationProvider, then delegates to
 * LayeredViewStack which renders the keep-alive layer stack.
 */

import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { NavigationProvider } from './core/navigation';
import { LayeredViewStack } from './core/navigation/LayeredViewStack';

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider initialView="calendar">
        <LayeredViewStack />
      </NavigationProvider>
    </AuthProvider>
  );
}
