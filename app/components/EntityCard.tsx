'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import DateBadge from './DateBadge';

interface Moment {
  text: string;
}

interface Chapter {
  title: string;
  momentCount: number;
  moments?: Moment[];
  isExpanded?: boolean;
}

interface Book {
  title: string;
  chapters: Chapter[];
  isExpanded?: boolean;
}

interface EntityCardProps {
  type: string;
  name: string;
  lastUpdated: string;
  momentCount: number;
  description: string;
  books: Book[];
}

export default function EntityCard({
  type,
  name,
  lastUpdated,
  momentCount,
  description,
  books: initialBooks
}: EntityCardProps) {
  const [books, setBooks] = useState(initialBooks);

  const toggleBook = (bookIndex: number) => {
    setBooks(books.map((book, i) =>
      i === bookIndex ? { ...book, isExpanded: !book.isExpanded } : book
    ));
  };

  const toggleChapter = (bookIndex: number, chapterIndex: number) => {
    setBooks(books.map((book, i) => {
      if (i === bookIndex) {
        return {
          ...book,
          chapters: book.chapters.map((chapter, j) =>
            j === chapterIndex ? { ...chapter, isExpanded: !chapter.isExpanded } : chapter
          )
        };
      }
      return book;
    }));
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-card-on-card h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-light-text uppercase tracking-wider mb-2">{type}</div>
        <h2 className="text-2xl font-bold text-white-text mb-3">{name}</h2>
        <div className="flex items-center gap-3">
          <DateBadge date={lastUpdated} />
          <span className="text-sm text-light-text">{momentCount} Moments</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-light-text leading-relaxed mb-8">
        {description}
      </p>

      {/* Moments Section */}
      <div>
        <h3 className="text-lg font-semibold text-white-text mb-4">Moments</h3>

        <div className="space-y-3">
          {books.map((book, bookIndex) => (
            <div key={bookIndex}>
              {/* Book Header */}
              <button
                onClick={() => toggleBook(bookIndex)}
                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-card-on-card transition-colors"
              >
                <span className="text-sm font-medium text-white-text">{book.title}</span>
                {book.isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-light-text" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-light-text" />
                )}
              </button>

              {/* Chapters */}
              {book.isExpanded && (
                <div className="mt-3 space-y-3">
                  {book.chapters.map((chapter, chapterIndex) => (
                    <div key={chapterIndex} className="pl-4 p-4 bg-card-on-card rounded-lg">
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(bookIndex, chapterIndex)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="text-sm text-white-text">{chapter.title}</span>
                        <span className="text-xs text-light-text whitespace-nowrap ml-2">{chapter.momentCount} Moments</span>
                      </button>

                      {/* Moments Pills */}
                      {chapter.isExpanded && chapter.moments && (
                        <div className="flex flex-col gap-2 mt-3">
                          {chapter.moments.map((moment, momentIndex) => (
                            <span
                              key={momentIndex}
                              className="px-3 py-2 bg-accent/10 text-white-text text-xs rounded-full hover:bg-accent/20 transition-colors cursor-pointer truncate"
                            >
                              {moment.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
