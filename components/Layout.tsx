
import React from 'react';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

type View = 'home' | 'calendar' | 'favorites' | 'event' | 'timeline' | 'module' | 'modules';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  navigateTo: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, navigateTo }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar currentView={currentView} navigateTo={navigateTo} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <BottomNav currentView={currentView} navigateTo={navigateTo} />
    </div>
  );
};