import React, { useEffect, useRef, useId } from 'react';
import { XIcon } from '../icons/XIcon';

// ─── Context — permet à SheetTitle de lire l'ID généré par SheetContent ──────
const SheetContext = React.createContext<{ titleId: string } | null>(null);

// ─── Sélecteur d'éléments focusables ─────────────────────────────────────────
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const Sheet: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const SheetTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => <>{children}</>;

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  side?: 'right' | 'left' | 'top' | 'bottom' | 'center';
}

const sideClasses = {
  top:    'top-0 left-0 right-0 h-auto max-h-[85vh] w-full -translate-y-full rounded-b-3xl',
  bottom: 'bottom-0 left-0 right-0 h-auto max-h-[85vh] w-full translate-y-full rounded-t-3xl',
  left:   'top-0 left-0 h-full w-full max-w-md -translate-x-full',
  right:  'top-0 right-0 h-full w-full max-w-md translate-x-full',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] h-auto max-h-[88vh] rounded-3xl opacity-0 scale-95 pointer-events-none',
};

const openClasses = {
  top:    'translate-y-0',
  bottom: 'translate-y-0',
  left:   'translate-x-0',
  right:  'translate-x-0',
  center: 'opacity-100 scale-100 pointer-events-auto',
};

export const SheetContent: React.FC<SheetContentProps> = ({
  children, className, isOpen, onClose, side = 'right',
}) => {
  const panelRef  = useRef<HTMLDivElement>(null);
  const titleId   = useId();
  // Élément qui avait le focus avant l'ouverture — on le restaure à la fermeture
  const prevFocus = useRef<HTMLElement | null>(null);

  // Focus trap + Escape + restauration du focus
  useEffect(() => {
    if (!isOpen) return;

    prevFocus.current = document.activeElement as HTMLElement;

    const panel = panelRef.current;
    if (!panel) return;

    // Focus le premier élément focusable (le bouton Fermer en pratique)
    const focusables = (): HTMLElement[] => {
      const all = panel.querySelectorAll(FOCUSABLE);
      return Array.from(all).filter(el => !(el as HTMLElement).closest('[aria-hidden="true"]')) as HTMLElement[];
    };

    requestAnimationFrame(() => { const els = focusables(); els[0]?.focus(); });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const els = focusables();
      if (els.length === 0) { e.preventDefault(); return; }

      const first = els[0];
      const last  = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restaure le focus à l'élément d'origine
      prevFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <SheetContext.Provider value={{ titleId }}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        className={`fixed bg-card shadow-2xl z-50 transform transition-all duration-300 ease-out ${sideClasses[side]} ${
          isOpen ? openClasses[side] : ''
        } ${className ?? ''}`}
      >
        <div className="h-full flex flex-col relative overscroll-contain overflow-hidden">

          {/* Drag handle (bottom sheet uniquement) */}
          {side === 'bottom' && (
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>
          )}

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className={`no-min-h absolute z-10 p-2.5 rounded-full transition-colors active:scale-95 ${
              side === 'center'
                ? 'top-3 right-3 bg-muted/80 hover:bg-muted'
                : 'top-3 right-3 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            aria-label="Fermer"
            style={{ top: side === 'bottom' ? '0.75rem' : undefined }}
          >
            <XIcon className="h-5 w-5" />
          </button>

          {/* Contenu scrollable */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={side === 'bottom' ? { paddingBottom: 'var(--sab, 0px)' } : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </SheetContext.Provider>
  );
};

export const SheetHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`px-5 py-4 border-b flex-shrink-0 ${className ?? ''}`}>{children}</div>
);

export const SheetTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ctx = React.useContext(SheetContext);
  return (
    <h2
      id={ctx?.titleId}
      className={`text-base sm:text-lg font-semibold text-foreground pr-10 ${className ?? ''}`}
    >
      {children}
    </h2>
  );
};

export const SheetDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground ${className ?? ''}`}>{children}</p>
);

export { Sheet };
