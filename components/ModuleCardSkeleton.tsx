import React from 'react';

export const ModuleCardSkeleton: React.FC = () => (
  <div className="border bg-card text-card-foreground shadow-soft rounded-2xl p-4 space-y-4 animate-pulse">
    <div className="aspect-video bg-muted rounded-lg"></div>
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-muted rounded-full"></div>
        <div className="h-5 w-16 bg-muted rounded-full"></div>
      </div>
      <div className="h-5 bg-muted rounded w-full"></div>
      <div className="h-5 bg-muted rounded w-3/4"></div>
    </div>
    <div className="h-4 bg-muted rounded w-full"></div>
    <div className="h-4 bg-muted rounded w-2/3"></div>
    <div className="flex justify-end items-center pt-2">
      <div className="h-10 w-28 bg-muted rounded-2xl"></div>
    </div>
  </div>
);