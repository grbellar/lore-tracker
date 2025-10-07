'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Filter, Plus, BookOpen, Workflow } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import NewEntityModal from '../components/NewEntityModal';
import MomentCard from '../components/MomentCard';

export default function TimelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('5');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Mock timeline moments data - extended list for infinite scroll
  const allMoments = [
    {
      id: '4',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 4',
      content: 'The Millennium Falcon soared through hyperspace, carrying Luke, Han Solo, and Princess Leia to Alderaan. Luke couldn\'t shake the fe...'
    },
    {
      id: '5',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 5',
      content: 'Luke Skywalker, a young moisture farmer on Tatooine, felt a strange pull as he gazed at the twin suns setting on the horizon. It was a feeling he couldn\'t explain, a sense of destiny calling him to something greater than himself...'
    },
    {
      id: '6',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 6',
      content: 'Dagobah was a swampy, mist-shrouded planet, teeming with strange creatures and hidden dangers. Luke struggled to adapt to the h...'
    },
    {
      id: '1',
      book: 'Book 2',
      chapter: 'Chapter 3',
      moment: 'Moment 1',
      content: 'Cloud City was a gleaming metropolis in the sky, a haven of luxury and sophistication. But beneath the surface, danger lurked. Lando...'
    },
    {
      id: '2',
      book: 'Book 2',
      chapter: 'Chapter 3',
      moment: 'Moment 2',
      content: 'Jabba\'s palace was a den of villainy and excess, filled with bounty hunters, smugglers, and other unsavory characters. Luke knew he...'
    },
    {
      id: '3',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 5',
      content: 'The forest moon of Endor was a lush, green paradise, inhabited by the small but fierce Ewoks. Luke and his friends sought their help...'
    },
    {
      id: '7',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 6',
      content: 'The Emperor\'s throne room was a dark and foreboding place, filled with an aura of immense power. Luke faced his ultimate test, conf...'
    },
    {
      id: '8',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 7',
      content: 'The celebration on Endor was a joyous occasion, as the Rebel Alliance celebrated their victory over the Empire. But Luke couldn\'t sha...'
    },
    {
      id: '9',
      book: 'Book 2',
      chapter: 'Chapter 4',
      moment: 'Moment 8',
      content: 'The Resistance base on D\'Qar was a hive of activity. Pilots prepared their X-wings for the next mission against the First Order...'
    },
    {
      id: '10',
      book: 'Book 1',
      chapter: 'Chapter 2',
      moment: 'Moment 9',
      content: 'Ben Solo stood at a crossroads, torn between the light and dark sides of the Force. The pull of both was strong...'
    },
    {
      id: '11',
      book: 'Book 2',
      chapter: 'Chapter 5',
      moment: 'Moment 10',
      content: 'Ahch-To was a remote planet, shrouded in mystery and ancient Jedi history. Rey climbed the stone steps, searching for Luke Skywalker...'
    },
    {
      id: '12',
      book: 'Book 1',
      chapter: 'Chapter 3',
      moment: 'Moment 11',
      content: 'The Battle of Hoth raged on. Rebel soldiers fought valiantly against the Imperial AT-AT walkers advancing across the frozen plains...'
    },
    {
      id: '13',
      book: 'Book 2',
      chapter: 'Chapter 6',
      moment: 'Moment 12',
      content: 'Crait\'s white salt plains turned red as the battle intensified. The Resistance made their last stand against overwhelming odds...'
    },
    {
      id: '14',
      book: 'Book 1',
      chapter: 'Chapter 4',
      moment: 'Moment 13',
      content: 'The cantina on Mos Eisley was filled with the galaxy\'s most dangerous scum and villainy. Obi-Wan and Luke searched for a pilot...'
    },
    {
      id: '15',
      book: 'Book 2',
      chapter: 'Chapter 7',
      moment: 'Moment 14',
      content: 'Exegol was hidden in the Unknown Regions, a dark world where the Sith Eternal prepared for their final assault on the galaxy...'
    },
    {
      id: '16',
      book: 'Book 1',
      chapter: 'Chapter 5',
      moment: 'Moment 15',
      content: 'The second Death Star loomed in orbit above Endor. Inside, Luke faced the Emperor and Darth Vader in a final confrontation...'
    },
    {
      id: '17',
      book: 'Book 2',
      chapter: 'Chapter 8',
      moment: 'Moment 16',
      content: 'Rey and Kylo Ren dueled in the wreckage of the Death Star II, waves crashing around them as they fought for the fate of the galaxy...'
    },
    {
      id: '18',
      book: 'Book 1',
      chapter: 'Chapter 6',
      moment: 'Moment 17',
      content: 'Maz Kanata\'s castle held countless treasures and secrets from across the galaxy. It was here that Rey first heard the call of a lightsaber...'
    },
    {
      id: '19',
      book: 'Book 2',
      chapter: 'Chapter 9',
      moment: 'Moment 18',
      content: 'The Battle of Scarif marked the first major victory for the Rebellion, but it came at a terrible cost. Rogue One had sacrificed everything...'
    },
    {
      id: '20',
      book: 'Book 1',
      chapter: 'Chapter 7',
      moment: 'Moment 19',
      content: 'Mandalore was a world of warriors, where honor and combat prowess were valued above all else. Bo-Katan led her people with strength...'
    },
    {
      id: '21',
      book: 'Book 2',
      chapter: 'Chapter 10',
      moment: 'Moment 20',
      content: 'The Razor Crest soared through hyperspace, the Mandalorian and Grogu on another adventure across the Outer Rim territories...'
    }
  ];

  const [displayedMoments, setDisplayedMoments] = useState(allMoments.slice(0, 10));
  const [loading, setLoading] = useState(false);

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
    const hasMoreToLoad = currentLength < allMoments.length;

    if (hasMoreToLoad && !loading) {
      setLoading(true);

      // Simulate loading delay for smooth animation
      setTimeout(() => {
        const nextMoments = allMoments.slice(currentLength, currentLength + 5);
        setDisplayedMoments([...displayedMoments, ...nextMoments]);
        setLoading(false);
      }, 300);
    }
  };

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
                  {displayedMoments.map((moment) => (
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
                  {displayedMoments.length < allMoments.length && (
                    <div ref={observerTarget} className="py-4 text-center pl-8">
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
