'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Filter, Plus, BookOpen, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useMomentList } from '../hooks/useMomentList';
import Sidebar from '../components/Sidebar';
import NewEntityModal from '../components/NewEntityModal';
import MomentCard from '../components/MomentCard';

export default function TimelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch moments from API with pagination
  const { moments, loading, error, hasMore, loadMore, refresh } = useMomentList(10);

  // Load initial moments on mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  // Mock books data
  const booksData = [
    {
      title: 'Book 1',
      description: 'The start of Luke\'s journey with the mysterious force.',
      progress: 80,
      wordCount: 45000,
      chapters: [
        { title: 'The Man in the Goggles', moments: 53, words: 312 },
        { title: 'The Robot from Tatooine', moments: 12, words: 310 }
      ],
      isExpanded: true
    },
    {
      title: 'Book 2',
      description: 'Luke\'s second journey to fight Darth Vader.',
      progress: 0,
      wordCount: 0,
      chapters: [],
      isExpanded: false
    }
  ];

  const [books, setBooks] = useState(booksData);

  const toggleBook = (index: number) => {
    setBooks(books.map((book, i) =>
      i === index ? { ...book, isExpanded: !book.isExpanded } : book
    ));
  };

  return (
    <div className="min-h-screen bg-background text-white-text flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddEntity={() => setEntityModalOpen(true)}
      />

      {/* New Entity Modal */}
      <NewEntityModal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-card-on-card p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Header with Title and Actions */}
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-white-text mb-1">Universe Timeline</h1>
                <p className="text-sm text-light-text">Organize your moments in a sequence.</p>
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-light-text" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 bg-card border border-card-on-card rounded-lg text-sm text-white-text placeholder-light-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Continue Writing Button */}
                <Link href="/write" className="flex items-center gap-2 px-4 py-2 bg-accent text-white-text rounded-lg text-sm font-medium hover:brightness-110 transition-all whitespace-nowrap">
                  <BookOpen className="w-4 h-4" />
                  Continue Writing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Timeline Moments */}
            <div className="lg:col-span-7">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Workflow className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold text-white-text">Timeline Moments</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg text-sm text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-accent text-white-text rounded-lg text-sm font-medium hover:brightness-110 transition-all">
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>

              {/* Timeline - Scrollable Container */}
              <div
                ref={scrollContainerRef}
                className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-card-on-card scrollbar-track-transparent hover:scrollbar-thumb-foreground"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-0">
                  {/* Error message */}
                  {error && (
                    <div className="py-4 text-center pl-8">
                      <p className="text-sm text-red-400">{error}</p>
                      <button
                        onClick={refresh}
                        className="mt-2 px-4 py-2 bg-accent text-white-text rounded-lg text-sm hover:brightness-110 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Initial loading state */}
                  {loading && moments.length === 0 && (
                    <div className="py-12 text-center pl-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-light-text">Loading your moments...</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && !error && moments.length === 0 && (
                    <div className="py-12 text-center pl-8">
                      <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto text-light-text/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-lg font-semibold text-white-text mb-2">No Moments Yet</h3>
                        <p className="text-light-text mb-6 max-w-sm mx-auto">Start writing your first moment to begin building your story universe!</p>
                      </div>
                      <Link
                        href="/write"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white-text rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                      >
                        <BookOpen className="w-4 h-4" />
                        Start Writing Your First Moment
                      </Link>
                    </div>
                  )}

                  {/* Moments list */}
                  {moments.map((moment) => (
                    <div
                      key={moment.id}
                      onClick={() => setExpandedId(expandedId === moment.id ? null : moment.id)}
                    >
                      <MomentCard
                        id={moment.id}
                        title={moment.title}
                        content={moment.preview}
                        isExpanded={expandedId === moment.id}
                      />
                    </div>
                  ))}

                  {/* Loading indicator / Intersection observer target - only show if we have moments */}
                  {moments.length > 0 && hasMore && (
                    <div ref={observerTarget} className="py-4 text-center pl-8">
                      {loading && (
                        <div className="flex items-center justify-center gap-2 text-light-text text-sm">
                          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          Loading more moments...
                        </div>
                      )}
                    </div>
                  )}

                  {/* End of list message */}
                  {!loading && !hasMore && moments.length > 0 && (
                    <div className="py-4 text-center pl-8">
                      <p className="text-sm text-light-text">You&apos;ve reached the end of your timeline</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom scrollbar styles */}
              <style jsx>{`
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

            {/* Right Column - Stats and Books */}
            <div className="lg:col-span-5 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Books */}
                <div className="bg-card rounded-lg p-4 border border-card-on-card">
                  <div className="text-xs text-light-text uppercase tracking-wider mb-2">Total Books</div>
                  <div className="text-3xl font-bold text-white-text mb-1">2</div>
                  <div className="text-xs text-light-text">+1 this month</div>
                </div>

                {/* Total Chapters */}
                <div className="bg-card rounded-lg p-4 border border-card-on-card">
                  <div className="text-xs text-light-text uppercase tracking-wider mb-2">Total Chapters</div>
                  <div className="text-3xl font-bold text-white-text mb-1">14</div>
                  <div className="text-xs text-light-text">+2 this month</div>
                </div>
              </div>

              {/* Books Section */}
              <div className="bg-card rounded-lg p-6 border border-card-on-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-white-text">Books</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-accent text-white-text hover:brightness-110 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Books List */}
                <div className="space-y-4">
                  {books.map((book, index) => (
                    <div key={index} className="bg-card-on-card rounded-lg p-4">
                      {/* Book Header */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white-text mb-1">{book.title}</h4>
                            <p className="text-xs text-light-text">{book.description}</p>
                          </div>
                          <button
                            onClick={() => toggleBook(index)}
                            className="text-light-text hover:text-white-text transition-colors ml-2"
                          >
                            <Menu className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-light-text mb-1">
                            <span>Progress</span>
                            <span>{book.wordCount.toLocaleString()} words</span>
                          </div>
                          <div className="w-full h-2 bg-foreground rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all duration-300"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-light-text mt-1">{book.progress}% complete</div>
                        </div>
                      </div>

                      {/* Chapters */}
                      {book.isExpanded && book.chapters.length > 0 && (
                        <div>
                          <div className="text-xs text-light-text uppercase tracking-wider mb-2">Chapters</div>
                          <div className="space-y-2">
                            {book.chapters.map((chapter, chapterIndex) => (
                              <div
                                key={chapterIndex}
                                className="flex items-center justify-between p-3 bg-foreground rounded-lg hover:bg-card transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                    <span className="text-xs font-medium text-accent">{chapterIndex + 1}</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-white-text group-hover:text-accent transition-colors">
                                      {chapter.title}
                                    </div>
                                    <div className="text-xs text-light-text">
                                      {chapter.moments} Moments · {chapter.words} Words
                                    </div>
                                  </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Menu className="w-4 h-4 text-light-text hover:text-white-text" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Open Book Button */}
                      <Link href="/write" className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white-text rounded-lg text-sm font-medium hover:brightness-110 transition-all">
                        <BookOpen className="w-4 h-4" />
                        Open Book
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
