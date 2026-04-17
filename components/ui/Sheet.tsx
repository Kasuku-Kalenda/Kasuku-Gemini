
import React from 'react';
import { XIcon } from '../icons/XIcon';

// NOTE: This is a simplified implementation for demo purposes.
// A production-ready Sheet would use portals and more complex state management.

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
    top: 'top-0 left-0 right-0 h-auto max-h-[80vh] w-full translate-y-[-100%]',
    bottom: 'bottom-0 left-0 right-0 h-auto max-h-[80vh] w-full translate-y-[100%]',
    left: 'top-0 left-0 h-full w-full max-w-md -translate-x-full',
    right: 'top-0 right-0 h-full w-full max-w-md translate-x-full',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] h-auto max-h-[90vh] rounded-2xl opacity-0 scale-95 pointer-events-none',
};
const openClasses = {
    top: 'translate-y-0',
    bottom: 'translate-y-0',
    left: 'translate-x-0',
    right: 'translate-x-0',
    center: 'opacity-100 scale-100 pointer-events-auto',
}


export const SheetContent: React.FC<SheetContentProps> = ({ children, className, isOpen, onClose, side = 'right' }) => (
  <>
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed bg-card shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${sideClasses[side]} ${
        isOpen ? openClasses[side] : ''
      } ${className}`}
    >
      <div className="h-full flex flex-col relative">
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
            side === 'center' 
              ? 'bg-muted/80 text-foreground hover:bg-muted shadow-sm' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          aria-label="Close panel"
        >
          <XIcon className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  </>
);

export const SheetHeader: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className }) => (
  <div className={`p-6 border-b ${className}`}>{children}</div>
);

export const SheetTitle: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold text-foreground pr-8 ${className}`}>{children}</h2>
);

export const SheetDescription: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

export { Sheet };
