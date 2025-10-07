'use client';

import { Calendar } from 'lucide-react';

interface EntityHeaderProps {
  name: string;
  lastUpdated: string;
  momentsCount: number;
  chaptersCount: number;
  booksCount: number;
}

export default function EntityHeader({
  name,
  lastUpdated,
  momentsCount,
  chaptersCount,
  booksCount
}: EntityHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl md:text-5xl font-bold text-white-text mb-4">
        {name}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-light-text">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{momentsCount} Moments</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{chaptersCount} Chapters</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{booksCount} Books</span>
        </div>
      </div>
    </div>
  );
}
