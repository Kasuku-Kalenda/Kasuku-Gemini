
import React from 'react';
import { useLayerDepth } from '../core/navigation';
import { StarIcon } from './icons/StarIcon';
import { CompassIcon } from './icons/CompassIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { ModulesIcon } from './icons/ModulesIcon';

type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timelines' | 'timeline' | 'module' | 'modules' | 'adminLogin';

interface BottomNavProps {
  currentView: View;
  navigateTo: (view: View) => void;
}

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`no-min-h flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-colors duration-200 active:scale-95 ${
      isActive ? 'text-primary' : 'text-muted-foreground'
    }`}
    aria-label={label}
  >
    <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
      {icon}
    </span>
    <span className="text-[11px] font-bold uppercase tracking-tighter leading-none">{label}</span>
  </button>
);

const navItems = [
  { view: 'home',      label: 'Discover',  icon: <CompassIcon    className="h-6 w-6" /> },
  { view: 'calendar',  label: 'Calendar',  icon: <CalendarIcon   className="h-6 w-6" /> },
  { view: 'timelines', label: 'Récits',    icon: <TimelineIcon   className="h-6 w-6" /> },
  { view: 'modules',   label: 'Modules',   icon: <ModulesIcon    className="h-6 w-6" /> },
  { view: 'favorites', label: 'Saved',     icon: <StarIcon       className="h-6 w-6" /> },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, navigateTo }) => {
  const layerDepth = useLayerDepth();
  if (layerDepth > 0) return null;

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-t-lg flex justify-around items-stretch md:hidden z-50"
      style={{
        height: 'calc(4rem + var(--sab, 0px))',
        paddingBottom: 'var(--sab, 0px)',
        paddingLeft:   'var(--sal, 0px)',
        paddingRight:  'var(--sar, 0px)',
      }}
    >
      {navItems.map((item) => (
        <NavItem
          key={item.view}
          label={item.label}
          icon={item.icon}
          isActive={currentView === item.view || (item.view === 'timelines' && currentView === 'timeline')}
          onClick={() => navigateTo(item.view)}
        />
      ))}
    </footer>
  );
};
