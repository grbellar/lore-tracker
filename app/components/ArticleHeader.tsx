'use client';

import { Clock, FileText, Calendar, Expand } from 'lucide-react';

interface ArticleHeaderProps {
  title: string;
  lastUpdated: string;
  characterCount: number;
  wordCount: number;
  readTime: string;
}

export default function ArticleHeader({
  title,
  lastUpdated,
  characterCount,
  wordCount,
  readTime
}: ArticleHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white-text">
          {title}
        </h1>
        <button className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
          <Expand className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-light-text">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Last Updated: {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>{characterCount.toLocaleString()} Characters</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>{wordCount} Words</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{readTime}</span>
        </div>
      </div>
    </div>
  );
}
