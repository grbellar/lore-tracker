'use client';

import DateBadge from './DateBadge';

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
        <DateBadge date={lastUpdated} />
        <span>{momentsCount} Moments</span>
        <span>{chaptersCount} Chapters</span>
        <span>{booksCount} Books</span>
      </div>
    </div>
  );
}
