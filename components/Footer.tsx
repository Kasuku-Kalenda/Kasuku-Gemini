
import React from 'react';
import { ParrotIcon } from './icons/ParrotIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <ParrotIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Kasuku</span>
          </div>
          <p className="text-sm text-center">
            &copy; {new Date().getFullYear()} Kasuku. All rights reserved. 
            <br className="sm:hidden" />
            Created with passion.
          </p>
          <div className="text-sm">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
