
import React from 'react';
import type { Source } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface SourceListProps {
  sources: Source[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return <p className="text-muted-foreground">No sources available.</p>;
  }

  return (
    <ul className="space-y-2">
      {sources.map(source => (
        <li key={source.id}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline group"
          >
            {source.label}
            <ExternalLinkIcon className="h-4 w-4 ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </li>
      ))}
    </ul>
  );
};
