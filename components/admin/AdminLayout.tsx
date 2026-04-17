
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ParrotIcon } from '../icons/ParrotIcon';
import { LogOutIcon } from '../icons/LogOutIcon';
import { DashboardIcon } from '../icons/DashboardIcon';
import { ContentIcon } from '../icons/ContentIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { ModulesIcon } from '../icons/ModulesIcon';
import { MenuIcon } from '../icons/MenuIcon';
import { XIcon } from '../icons/XIcon';
import { ThemeIcon } from '../icons/ThemeIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { Button } from '../ui/Button';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import { DatabaseIcon } from '../icons/DatabaseIcon';
import { TimelineIcon } from '../icons/TimelineIcon';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminFeatured' | 'adminTimelines' | 'adminMoodleInstances' | 'adminMoodleCourses' | 'adminMoodlePackages' | 'adminMoodleMaps';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: AdminView;
  navigateTo: (view: string) => void;
}

interface NavLinkProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary/10 text-primary' : 'text-dark/80 hover:bg-primary/5 hover:text-primary'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
);

const navItems = [
  { view: 'adminDashboard', label: 'Dashboard', icon: <DashboardIcon className="h-5 w-5" /> },
  { view: 'adminFeatured', label: 'À la une', icon: <MegaphoneIcon className="h-5 w-5" /> },
  { view: 'adminTimelines', label: 'Timelines (Parcours)', icon: <TimelineIcon className="h-5 w-5" /> },
  { view: 'adminEvents', label: 'Événements Calendrier', icon: <ContentIcon className="h-5 w-5" /> },
  { view: 'adminModules', label: 'Modules', icon: <ModulesIcon className="h-5 w-5" /> },
  { view: 'adminThemes', label: 'Themes', icon: <ThemeIcon className="h-5 w-5" /> },
  { view: 'adminMoodleInstances', label: 'Moodle Instances', icon: <DatabaseIcon className="h-5 w-5" /> },
  { view: 'adminMoodleCourses', label: 'Moodle Courses', icon: <DatabaseIcon className="h-5 w-5" /> },
  { view: 'adminMoodlePackages', label: 'Moodle Packages', icon: <DatabaseIcon className="h-5 w-5" /> },
  { view: 'adminMoodleMaps', label: 'Moodle Maps', icon: <DatabaseIcon className="h-5 w-5" /> },
] as const;


export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentView, navigateTo }) => {
    const { session, signOut } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sidebarContent = (
         <div className="flex flex-col h-full">
            <div
                className="flex items-center space-x-3 cursor-pointer p-4 border-b border-border"
                onClick={() => navigateTo('adminDashboard')}
            >
                <ParrotIcon className="h-10 w-10 text-accent" />
                <div>
                    <span className="text-2xl font-bold text-dark">Kasuku</span>
                    <span className="block text-xs text-muted-foreground -mt-1">Admin</span>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                    <NavLink
                        key={item.view}
                        label={item.label}
                        icon={item.icon}
                        isActive={currentView === item.view}
                        onClick={() => {
                            navigateTo(item.view);
                            setIsSidebarOpen(false);
                        }}
                    />
                ))}
            </nav>
        </div>
    );
    
    const user = session?.user;

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-card">
                 {sidebarContent}
            </aside>

            <div className="md:pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
                    <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">{navItems.find(i => i.view === currentView)?.label || 'Dashboard'}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2" onClick={() => navigateTo('calendar')}>
                            <ArrowLeftIcon className="h-4 w-4" />
                            Retour au site
                        </Button>
                        {user && (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                                        {user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:inline text-sm">{user.email}</span>
                                </button>
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 border">
                                        <div className="px-4 py-2 text-sm text-dark font-semibold border-b">{user.email}</div>
                                        <button onClick={() => navigateTo('calendar')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-muted md:hidden">
                                            <ArrowLeftIcon className="h-4 w-4" />
                                            Retour au site
                                        </button>
                                        <button onClick={signOut} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-dark hover:bg-muted">
                                            <LogOutIcon className="h-4 w-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
