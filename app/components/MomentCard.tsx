'use client';

import { Edit } from 'lucide-react';
import Link from 'next/link';

interface MomentCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded?: boolean;
}

export default function MomentCard({
  id,
  title,
  content,
  isExpanded = false
}: MomentCardProps) {
  return (
    <div className="relative pl-8 pb-6">
      {/* Timeline line */}
      <div className="absolute left-[6px] top-0 bottom-0 w-1 bg-accent/40 rounded-full" />

      {/* Timeline dot */}
      {isExpanded ? (
        // Larger active dot - hollow with thicker ring
        <div className="absolute left-[0px] top-2 w-5 h-5 rounded-full bg-card-on-card border-[3px] border-accent z-10" />
      ) : (
        // Smaller inactive dot
        <div className="absolute left-[3px] top-2 w-3 h-3 rounded-full bg-card-on-card border-2 border-accent/60 z-10" />
      )}

      <div className={`
        rounded-lg p-4 transition-all
        ${isExpanded
          ? 'bg-card-on-card border-2 border-accent'
          : 'bg-card hover:bg-card-on-card cursor-pointer'
        }
      `}>
        {/* Title */}
        <h3 className={`text-base font-semibold mb-2 ${isExpanded ? 'text-white-text' : 'text-white-text/90'}`}>
          {title || 'Untitled Moment'}
        </h3>

        {/* Content preview */}
        <p className={`text-sm leading-relaxed mb-3 ${isExpanded ? 'text-white' : 'text-light-text'}`}>
          {content || 'No content yet...'}
        </p>

        {/* Edit button (only show when expanded) */}
        {isExpanded && (
          <Link
            href={`/write?moment=${id}`}
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
