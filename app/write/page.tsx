'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import ArticleHeader from '../components/ArticleHeader';
import Editor from '../components/Editor';
import NewEntityModal from '../components/NewEntityModal';
import EntityCard from '../components/EntityCard';

export default function WritePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // Hard-coded data
  const breadcrumbItems = [
    { label: 'Book 1' },
    { label: 'Chapter 1' }
  ];

  const articleData = {
    title: 'The Man in the Goggles',
    lastUpdated: 'August 20, 2025',
    readTime: '15 Minute Read'
  };

  const entityCardData = {
    type: 'CHARACTER',
    name: 'Mark Janzen',
    lastUpdated: 'August 20, 2025',
    momentCount: 15,
    description: "Mark Janzen is the real-life CEO of Planetary Talent Inc., based in Wichita, Kansas. In the lore, Mark's discovery of Maxwell's computer at the Living Computer Museum in Seattle and purchased it from the museum when they were considering closing.\n\nDuring the Covid pandemic, when he moved back to Wichita, Mark found the old computer and decided to try to get it working. Little did he know, this would lead to the founding of Planetary Talent. The computer contained files and plans that inspired Mark to realize Maxwell's vision.",
    books: [
      {
        title: 'Book 1: The Beginning',
        isExpanded: true,
        chapters: [
          {
            title: 'Chapter 1: The First Thing',
            momentCount: 14,
            isExpanded: true,
            moments: [
              { text: '...Mark gave the machine a solid thump on its side...' },
              { text: 'As he looked around, Mark wonder' },
              { text: 'As he t' },
              { text: '...Mark arranged the meeting...' },
              { text: '"What is this?" Mark asked.' },
              { text: 'The door next to him' },
              { text: '"What is' },
              { text: 'As Mark took the first step...' },
              { text: '...and Mark turned toward him...' },
              { text: '"What\'s the meaning' },
              { text: '...and M' }
            ]
          },
          {
            title: 'Chapter 2: The Man in the Goggles',
            momentCount: 14,
            isExpanded: false
          },
          {
            title: 'Chapter 3: The Man in the Goggles',
            momentCount: 17,
            isExpanded: false
          }
        ]
      }
    ]
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

        {/* Content Container */}
        <div className="max-w-7xl mx-auto pl-4 sm:pl-6 lg:pl-8 pr-2 py-8">
          {/* Breadcrumb */}
          {!isExpanded && (
            <div className="mb-8">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          )}

          {/* Two Column Layout */}
          <div className={`grid grid-cols-1 ${isExpanded ? '' : 'lg:grid-cols-3'} gap-8 transition-all duration-300`}>
            {/* Main Content - Left Side */}
            <div className={`transition-all duration-300 ${isExpanded ? 'max-w-4xl mx-auto' : 'lg:col-span-2'}`}>
              {/* Article Header */}
              <ArticleHeader
                title={articleData.title}
                lastUpdated={articleData.lastUpdated}
                characterCount={characterCount}
                wordCount={wordCount}
                readTime={articleData.readTime}
                onExpand={() => setIsExpanded(!isExpanded)}
              />

              {/* Editor */}
              <Editor
                content={editorContent}
                onUpdate={setEditorContent}
                onCharacterCountUpdate={setCharacterCount}
                onWordCountUpdate={setWordCount}
              />
            </div>

            {/* Sidebar - Right Side */}
            <div className={`space-y-6 transition-all duration-300 ${isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <EntityCard {...entityCardData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
