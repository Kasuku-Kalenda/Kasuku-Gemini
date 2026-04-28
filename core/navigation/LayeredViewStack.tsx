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

  // Décalage directionnel léger pour donner le sens forward / backward.
  // Pas de plein écran (évite tout chevauchement visible).
  const enterX = direction === 'forward' ? 24 : -24;
  const exitX  = direction === 'forward' ? -16 : 24;

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
              /*
                initial  : état au premier rendu de cet entry (nouvelle navigation)
                animate  : état cible selon la position dans la pile
                exit     : état lors du retrait de la pile (goBack)
              */
              initial={{ opacity: 0, x: enterX }}
              animate={{
                opacity: isTop ? 1 : 0,
                x: 0,
                // Légère réduction de scale pour la couche bg (optique de profondeur)
                scale: isTop ? 1 : 0.99,
              }}
              exit={{ opacity: 0, x: exitX }}
              transition={{
                duration: 0.22,
                ease: [0.25, 0.46, 0.45, 0.94],
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
