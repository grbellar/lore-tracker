'use client';

import { Clock, FileText, Maximize2, Check, Loader2 } from 'lucide-react';
import DateBadge from './DateBadge';

interface ArticleHeaderProps {
  title: string;
  lastUpdated: string;
  characterCount: number;
  wordCount: number;
  readTime: string;
  onExpand?: () => void;
  onTitleChange?: (title: string) => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
}

export default function ArticleHeader({
  title,
  lastUpdated,
  characterCount,
  wordCount,
  readTime,
  onExpand,
  onTitleChange,
  saveStatus = 'idle'
}: ArticleHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 gap-4">
        {onTitleChange ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter moment title..."
            className="text-4xl md:text-5xl font-bold text-white-text bg-transparent border-none outline-none focus:outline-none flex-1"
          />
        ) : (
          <h1 className="text-4xl md:text-5xl font-bold text-white-text">
            {title}
          </h1>
        )}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm text-light-text">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Saved</span>
                </>
              )}
            </div>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-light-text">
        <DateBadge date={lastUpdated} />
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
