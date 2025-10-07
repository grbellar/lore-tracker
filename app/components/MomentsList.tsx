'use client';

import { Filter, Search } from 'lucide-react';
import MomentCard from './MomentCard';
import { useState, useRef, useEffect } from 'react';

interface Moment {
  id: string;
  book: string;
  chapter: string;
  moment: string;
  content: string;
}

interface MomentsListProps {
  moments: Moment[];
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function MomentsList({ moments, hasMore = false, onLoadMore }: MomentsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(moments[1]?.id || null);
  const [displayedMoments, setDisplayedMoments] = useState<Moment[]>(moments.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMoreMoments();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [displayedMoments, loading]);

  const loadMoreMoments = () => {
    const currentLength = displayedMoments.length;
    const hasMoreToLoad = currentLength < moments.length;

    if (hasMoreToLoad && !loading) {
      setLoading(true);

      // Simulate loading delay for smooth animation
      setTimeout(() => {
        const nextMoments = moments.slice(currentLength, currentLength + 5);
        setDisplayedMoments([...displayedMoments, ...nextMoments]);
        setLoading(false);
      }, 300);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white-text">Moments</h2>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg text-sm text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg text-sm text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Scrollable Moments timeline */}
      <div
        ref={scrollContainerRef}
        className="max-h-[60vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto pr-2 pl-1 scrollbar-thin scrollbar-thumb-card-on-card scrollbar-track-transparent hover:scrollbar-thumb-foreground"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        <div className="space-y-0">
          {displayedMoments.map((moment, index) => (
            <div
              key={moment.id}
              onClick={() => setExpandedId(expandedId === moment.id ? null : moment.id)}
            >
              <MomentCard
                book={moment.book}
                chapter={moment.chapter}
                moment={moment.moment}
                content={moment.content}
                isExpanded={expandedId === moment.id}
              />
            </div>
          ))}

          {/* Loading indicator / Intersection observer target */}
          {displayedMoments.length < moments.length && (
            <div ref={observerTarget} className="py-4 text-center">
              {loading && (
                <div className="flex items-center justify-center gap-2 text-light-text text-sm">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Loading more moments...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #202027;
          border-radius: 3px;
        }

        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: #292932;
        }
      `}</style>
    </div>
  );
}
