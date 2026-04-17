
import React from 'react';

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="border bg-card text-card-foreground shadow-soft rounded-2xl p-4 space-y-4 animate-pulse">
      <div className="bg-muted h-40 rounded-lg"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-6 bg-muted rounded w-full"></div>
        <div className="h-6 bg-muted rounded w-3/4"></div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
      <div className="flex justify-between items-center pt-4">
        <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded-full"></div>
            <div className="h-6 w-20 bg-muted rounded-full"></div>
        </div>
      </div>
       <div className="h-10 bg-muted rounded-md mt-4"></div>
    </div>
  );
};
