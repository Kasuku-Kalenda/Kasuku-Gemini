
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
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-bottom-nav md:pb-8">
        {children}
      </main>
      <Footer />
      <BottomNav currentView={currentView} navigateTo={navigateTo} />
    </div>
  );
};