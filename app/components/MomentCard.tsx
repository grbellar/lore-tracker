'use client';

import { Edit } from 'lucide-react';
import Link from 'next/link';

interface MomentCardProps {
  book: string;
  chapter: string;
  moment: string;
  content: string;
  isExpanded?: boolean;
  onEdit?: () => void;
}

export default function MomentCard({
  book,
  chapter,
  moment,
  content,
  isExpanded = false,
  onEdit
}: MomentCardProps) {
  return (
    <div className="relative pl-8 pb-6">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-accent/40" />

      {/* Timeline dot */}
      {isExpanded ? (
        // Larger active dot with ring
        <div className="absolute left-[-1px] top-2 w-5 h-5 rounded-full bg-accent border-4 border-accent/20 z-10" />
      ) : (
        // Smaller inactive dot
        <div className="absolute left-[3px] top-2 w-3 h-3 rounded-full bg-card-on-card border-2 border-accent/60 z-10" />
      )}

      <div className={`
        rounded-lg p-4 transition-all
        ${isExpanded
          ? 'bg-card-on-card border border-accent'
          : 'bg-card hover:bg-card-on-card cursor-pointer'
        }
      `}>
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 rounded text-xs bg-accent/20 text-accent">
            {book}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-accent/20 text-accent">
            {chapter}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-accent text-white-text">
            {moment}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-light-text leading-relaxed mb-3">
          {content}
        </p>

        {/* Edit button (only show when expanded) */}
        {isExpanded && (
          <Link
            href="/write"
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white-text rounded-lg text-sm font-medium hover:brightness-110 transition-all w-fit"
          >
            <Edit className="w-4 h-4" />
            Edit Moment
          </Link>
        )}
      </div>
    </div>
  );
}
