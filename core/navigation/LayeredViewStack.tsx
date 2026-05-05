/**
 * core/navigation/LayeredViewStack.tsx
 *
 * Rendu keep-alive de la pile de navigation.
 *
 * Principe :
 *  • Chaque HistoryEntry est un <motion.div> avec une clé UUID stable.
 *  • AnimatePresence mode="sync" gère simultanément entrées et sorties.
 *  • La couche active  → opacity 1, interactive.
 *  • Les couches bg   → opacity 0, pointer-events none (montées mais invisibles).
 *  • L'état React (données, scroll, formulaires) est préservé automatiquement
 *    puisque les composants ne sont jamais démontés tant que l'entrée reste
 *    dans la pile.
 *  • TopBar et BottomNav se masquent dans les couches bg (useLayerDepth).
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigation, ViewOverrideProvider, LayerDepthProvider } from './index';
import type { HistoryEntry } from './index';
import { UserApp } from '../../shell/UserApp';
import { AdminApp } from '../../shell/AdminApp';

// ─── Contenu d'une couche ─────────────────────────────────────────────────────

const LayerContent = React.memo(({ entry, isActive }: { entry: HistoryEntry; isActive: boolean }) => (
  <ViewOverrideProvider view={entry.view} payload={entry.payload}>
    <LayerDepthProvider depth={isActive ? 0 : 1}>
      {/*
        Chaque couche a son propre conteneur scrollable.
        Le scroll est préservé naturellement car le div reste monté.
        overflowY "hidden" sur les couches bg empêche le scroll accidentel.
      */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: isActive ? 'auto' : 'hidden',
          overflowX: 'hidden',
        }}
      >
        {entry.view.startsWith('admin') ? <AdminApp /> : <UserApp />}
      </div>
    </LayerDepthProvider>
  </ViewOverrideProvider>
));

LayerContent.displayName = 'LayerContent';

// ─── Stack principal ──────────────────────────────────────────────────────────

export const LayeredViewStack: React.FC = () => {
  const { stack, direction } = useNavigation();

  // Forward → slide up from below (détail qui s'ouvre)
  // Backward → slide back to the right
  const isForward = direction === 'forward';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'var(--color-light, #FAF8F5)',
      }}
    >
      <AnimatePresence mode="sync">
        {stack.map((entry, index) => {
          const isTop = index === stack.length - 1;

          return (
            <motion.div
              key={entry.id}
              initial={isForward
                ? { opacity: 0, y: 48, scale: 0.98 }
                : { opacity: 0, x: -32 }
              }
              animate={{
                opacity: isTop ? 1 : 0,
                x: 0,
                y: 0,
                scale: isTop ? 1 : 0.98,
              }}
              exit={isForward
                ? { opacity: 0, y: -24, scale: 0.98 }
                : { opacity: 0, x: 32 }
              }
              transition={{
                duration: 0.32,
                ease: [0.32, 0.72, 0, 1],
              }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: index + 1,
                // Seule la couche active reçoit les événements
                pointerEvents: isTop ? 'auto' : 'none',
              }}
            >
              <LayerContent entry={entry} isActive={isTop} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
