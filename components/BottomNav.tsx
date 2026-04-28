
import React from 'react';
import { useLayerDepth } from '../core/navigation';

// Import existing and new icons
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
    className={`flex flex-col items-center justify-center space-y-1 w-full pt-1 transition-colors duration-200 ${
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-dark'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

const navItems = [
  { view: 'home', label: 'Discover', icon: <CompassIcon className="h-6 w-6" /> },
  { view: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-6 w-6" /> },
  { view: 'timelines', label: 'Récits', icon: <TimelineIcon className="h-6 w-6" /> },
  { view: 'modules', label: 'Modules', icon: <ModulesIcon className="h-6 w-6" /> },
  { view: 'favorites', label: 'Saved', icon: <StarIcon className="h-6 w-6" /> },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, navigateTo }) => {
    const layerDepth = useLayerDepth();
    // Ne pas rendre dans les couches en arrière-plan (évite les doublons de chrome)
    if (layerDepth > 0) return null;

    return (
        <footer
            className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-t-lg flex justify-around items-center md:hidden z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
