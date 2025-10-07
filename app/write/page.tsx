'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import ArticleHeader from '../components/ArticleHeader';
import ArticleContent from '../components/ArticleContent';
import NewEntityModal from '../components/NewEntityModal';
import EntityCard from '../components/EntityCard';

export default function WritePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Hard-coded data
  const breadcrumbItems = [
    { label: 'Book 1' },
    { label: 'Chapter 1' }
  ];

  const articleData = {
    title: 'The Man in the Goggles',
    lastUpdated: 'August 20, 2025',
    characterCount: 12018,
    wordCount: 512,
    readTime: '15 Minute Read'
  };

  const paragraphs = [
    {
      id: '1',
      content: [
        { type: 'entity' as const, name: 'Luke Skywalker', entityType: 'character' as const },
        ' wasn\'t sure how to explain any of this. There were few ways to casually tell someone, "Hey, I found an untraceable hyperdrive unit that somehow knew my name and started spitting out encrypted data logs." But if there was anyone who might make sense of it, it was ',
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        '.'
      ]
    },
    {
      id: '2',
      content: [
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        ' was a protocol droid, a translator of languages both digital and analog, an individual whose positronic brain could effortlessly blend etiquette, function, and a touch of the melodramatic. He also had a tendency to charge headlong into the unknown, a useful trait when confronted with a possibly sentient, possibly haunted piece of vintage hardware.'
      ]
    },
    {
      id: '3',
      content: [
        { type: 'entity' as const, name: 'Luke', entityType: 'character' as const },
        ' had arranged to meet him in the hangar bay of the ',
        { type: 'entity' as const, name: 'Millennium Falcon', entityType: 'location' as const },
        '. As ',
        { type: 'entity' as const, name: 'Luke', entityType: 'character' as const },
        ' hauled the now-notorious hyperdrive unit into the workspace, ',
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        ' took one look at it and let out a series of concerned beeps.'
      ]
    },
    {
      id: '4',
      content: '"Oh, dear," ' + 'C-3PO said, fidgeting with his vocabulator. "What exactly am I looking at?"'
    },
    {
      id: '5',
      content: [
        { type: 'entity' as const, name: 'Luke', entityType: 'character' as const },
        ' exhaled. "I have no idea."'
      ]
    },
    {
      id: '6',
      content: [
        'He recounted the events: the salvage yard on ',
        { type: 'entity' as const, name: 'Jakku', entityType: 'location' as const },
        ', the pandemic boredom, the cryptic welcome message, the folder labeled LOST IN THE OUTER RIM, and, most importantly, the data logs filled with what appeared to be instructions—though instructions for what, exactly, remained unclear.'
      ]
    },
    {
      id: '7',
      content: [
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        ' extended his metallic fingers. "Well, there\'s only one way to find out."'
      ]
    },
    {
      id: '8',
      content: [
        { type: 'entity' as const, name: 'Luke', entityType: 'character' as const },
        ' gave the hyperdrive unit a solid thump on its side, and it once again powered up. The glow of the holographic display filled the room, and right in the center of the screen, that folder: "Lost in the Outer Rim?" ',
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        ' said, "What does that signify?"'
      ]
    },
    {
      id: '9',
      content: 'They began combing through the files. Most of the documents were a jumbled mess of binary code, technical schematics, and, bizarrely, handwritten notes—some of which contained grease stains and what looked like doodles of ' + 'X-wings.'
    },
    {
      id: '10',
      content: 'Toiling late into the night and over multiple weekends, they managed to partially decode eleven files. What they found perplexed them.'
    },
    {
      id: '11',
      content: 'The files contained detailed blueprints for an advanced astrogation system—one that accounted for variables no one in their sector had even thought of. The system could chart courses across uncharted space, predict hyperspace anomalies with astonishing accuracy. The blueprint even seemed to account for future trends, such as the mandated droid co-pilots for all long-haul smugglers.'
    },
    {
      id: '12',
      content: [
        '"This is unreal," ',
        { type: 'entity' as const, name: 'C-3PO', entityType: 'character' as const },
        ' murmured. "It\'s not just advanced—it\'s predictive. Like, almost too predictive."'
      ]
    }
  ];

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
                characterCount={articleData.characterCount}
                wordCount={articleData.wordCount}
                readTime={articleData.readTime}
                onExpand={() => setIsExpanded(!isExpanded)}
              />

              {/* Article Content */}
              <ArticleContent paragraphs={paragraphs} />
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
