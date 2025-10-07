'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import ArticleHeader from '../components/ArticleHeader';
import ArticleContent from '../components/ArticleContent';
import NewEntityModal from '../components/NewEntityModal';

export default function TimelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2">
              {/* Article Header */}
              <ArticleHeader
                title={articleData.title}
                lastUpdated={articleData.lastUpdated}
                characterCount={articleData.characterCount}
                wordCount={articleData.wordCount}
                readTime={articleData.readTime}
              />

              {/* Article Content */}
              <ArticleContent paragraphs={paragraphs} />
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Entity Card Placeholder */}
              <div className="bg-card rounded-lg p-6 border border-card-on-card">
                <h3 className="text-sm font-semibold text-light-text uppercase tracking-wider mb-4">
                  Related Entities
                </h3>
                <p className="text-sm text-light-text">Entity cards will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
