
import React, { useState, useEffect, useRef } from 'react';
import { useLayerDepth } from '../core/navigation';
import { ParrotIcon } from './icons/ParrotIcon';
import { LogOutIcon } from './icons/LogOutIcon';
import { useAuth } from '../hooks/useAuth';
import { DashboardIcon } from './icons/DashboardIcon';
import { UserIcon } from './icons/UserIcon';


type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timeline' | 'timelines' | 'module' | 'modules' | 'adminDashboard' | 'adminLogin';

interface TopBarProps {
  currentView: View;
  navigateTo: (view: View) => void;
}

interface NavLinkProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ label, isActive, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-dark/80 hover:bg-primary/5 hover:text-primary'
    } ${className}`}
  >
    {label}
  </button>
);

const navItems = [
  { view: 'home', label: 'Discover' },
  { view: 'calendar', label: 'Calendar' },
  { view: 'timelines', label: 'Récits' }, // Changement de 'timeline' à 'timelines'
  { view: 'modules', label: 'Modules' },
  { view: 'favorites', label: 'Favorites' },
] as const;

export const TopBar: React.FC<TopBarProps> = ({ currentView, navigateTo }) => {
  // Tous les hooks d'abord (règle React)
  const layerDepth    = useLayerDepth();
  const { session, status, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = session?.user;
  const isAuthenticated = status === 'authenticated';
  const isAuthorizedAdmin = user?.role === 'SUPERADMIN' || user?.role === 'EDITOR';

  // Ne pas rendre dans les couches en arrière-plan (évite les doublons de chrome)
  if (layerDepth > 0) return null;

  return (
    <header className="bg-light/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border shadow-soft">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigateTo('calendar')}
          >
            <ParrotIcon className="h-10 w-10 text-accent" />
            <span className="text-2xl font-bold text-dark">Kasuku</span>
          </div>

          {/* Right Side: Navigation and Actions */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.view}
                  label={item.label}
                  isActive={currentView === item.view || (item.view === 'timelines' && currentView === 'timeline')}
                  onClick={() => navigateTo(item.view)}
                />
              ))}
            </div>

            {/* Auth Actions */}
            <div className="flex items-center md:ml-6">
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                    <img src={user.image ?? `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt={user.name!} className="h-9 w-9 rounded-full" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 text-sm text-dark font-semibold border-b">{user.name}</div>
                       {isAuthorizedAdmin && (
                         <button onClick={() => navigateTo('adminDashboard')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-muted">
                            <DashboardIcon className="h-4 w-4" />
                            Admin
                         </button>
                       )}
                      <button onClick={signOut} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-muted">
                        <LogOutIcon className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={() => navigateTo('adminLogin')} className="hidden md:flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
                    Sign in / Admin
                  </button>
                  <button onClick={() => navigateTo('adminLogin')} className="md:hidden p-2 rounded-full hover:bg-muted transition-colors" aria-label="Sign in">
                    <UserIcon className="h-6 w-6 text-dark/80" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
