import React from 'react';

export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />
);
