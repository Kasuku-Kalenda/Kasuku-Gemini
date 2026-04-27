/**
 * App.tsx — Thin root component
 *
 * Responsibilities:
 *  1. Wrap the app in AuthProvider
 *  2. Wrap the app in NavigationProvider
 *  3. Delegate rendering to UserApp or AdminApp based on current view
 *
 * All routing logic lives in shell/UserApp.tsx and shell/AdminApp.tsx.
 * All navigation state lives in core/navigation/index.tsx.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from './hooks/useAuth';
import { NavigationProvider, useNavigation } from './core/navigation';
import { UserApp } from './shell/UserApp';
import { AdminApp } from './shell/AdminApp';

// ─── AppShell ─────────────────────────────────────────────────────────────────

const AppShell: React.FC = () => {
  const { view, payload } = useNavigation();

  const isAdmin = view.startsWith('admin');

  // Unique key drives AnimatePresence transition on every navigation change
  const animationKey =
    view +
    (payload.id ?? '') +
    (payload.event?.id ?? '') +
    (payload.module?.id ?? '');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        {isAdmin ? <AdminApp /> : <UserApp />}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider initialView="calendar">
        <AppShell />
      </NavigationProvider>
    </AuthProvider>
  );
}
