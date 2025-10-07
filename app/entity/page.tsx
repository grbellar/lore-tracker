'use client';

import { useState } from 'react';
import { Menu, Trash2, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import EntityHeader from '../components/EntityHeader';
import CustomFieldsPanel from '../components/CustomFieldsPanel';
import RelationshipsPanel from '../components/RelationshipsPanel';
import MomentsList from '../components/MomentsList';
import NewEntityModal from '../components/NewEntityModal';

export default function EntityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);

  // Hard-coded data
  const breadcrumbItems = [
    { label: 'Character' },
    { label: 'Jedi' }
  ];

  const entityData = {
    name: 'Luke Skywalker',
    lastUpdated: 'March 14, 2024',
    momentsCount: 285,
    chaptersCount: 24,
    booksCount: 3,
    description: `Born on Tatooine, Luke Skywalker was a farm boy yearning for adventure among the stars. His life took a turn when he encountered Obi-Wan Kenobi, who revealed his Jedi heritage and set him on a path to confront the dark forces of the Galactic Empire.

Guided by the wisdom of Obi-Wan and later Yoda, Luke honed his Force abilities and joined the Rebel Alliance. He faced Darth Vader in a climactic showdown, discovering a shocking truth about his parentage. Luke's journey inspired hope across the galaxy, paving the way for unity and peace.`
  };

  const customFields = [
    { label: 'Home Planet', value: 'Tatooine' },
    { label: 'Species', value: 'Human' },
    { label: 'Force Sensitive', value: 'Yes' }
  ];

  const relationships = [
    { type: 'Trained_By', target: 'Yoda' },
    { type: 'Related_To', target: 'Leia' },
    { type: 'Starship', target: 'X-Wing' }
  ];

  const moments = [
    {
      id: '1',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 1',
      content: 'The twin suns of Tatooine beat down on Luke as he tinkered with his T-16 Skyhopper, dreaming of adventure beyond the desert.'
    },
    {
      id: '2',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 2',
      content: 'A mysterious message hidden within a droid sparked Luke\'s curiosity and set him on a path he never imagined. The holographic plea from Princess Leia ignited a sense of duty within him, compelling him to help the Rebellion.'
    },
    {
      id: '3',
      book: 'Book 1',
      chapter: 'Chapter 1',
      moment: 'Moment 3',
      content: 'Obi-Wan Kenobi\'s arrival on Tatooine revealed Luke\'s connection to the Force and the legacy of his father.'
    },
    {
      id: '4',
      book: 'Book 1',
      chapter: 'Chapter 2',
      moment: 'Moment 1',
      content: 'The Millennium Falcon soared through hyperspace, carrying Luke, Han Solo, and Princess Leia toward their destiny.'
    },
    {
      id: '5',
      book: 'Book 1',
      chapter: 'Chapter 2',
      moment: 'Moment 2',
      content: 'Luke began his training aboard the Falcon, learning to trust the Force and let go of his conscious self.'
    },
    {
      id: '6',
      book: 'Book 1',
      chapter: 'Chapter 3',
      moment: 'Moment 1',
      content: 'The Death Star loomed before them, a symbol of the Empire\'s power and tyranny.'
    },
    {
      id: '7',
      book: 'Book 1',
      chapter: 'Chapter 3',
      moment: 'Moment 2',
      content: 'Luke witnessed Obi-Wan\'s sacrifice, a moment that would fuel his determination to fight the Empire.'
    },
    {
      id: '8',
      book: 'Book 1',
      chapter: 'Chapter 4',
      moment: 'Moment 1',
      content: 'In the trench run, Luke heard Obi-Wan\'s voice urging him to use the Force, and he took the shot that changed the galaxy.'
    },
    {
      id: '9',
      book: 'Book 2',
      chapter: 'Chapter 1',
      moment: 'Moment 1',
      content: 'On the ice planet Hoth, Luke faced his first real test of survival when he was attacked by a wampa.'
    },
    {
      id: '10',
      book: 'Book 2',
      chapter: 'Chapter 1',
      moment: 'Moment 2',
      content: 'A vision of Obi-Wan appeared, guiding Luke to seek out Master Yoda on Dagobah.'
    },
    {
      id: '11',
      book: 'Book 2',
      chapter: 'Chapter 2',
      moment: 'Moment 1',
      content: 'Luke crashed on the swamp planet, skeptical that a small green creature could be the legendary Jedi Master.'
    },
    {
      id: '12',
      book: 'Book 2',
      chapter: 'Chapter 2',
      moment: 'Moment 2',
      content: 'Yoda put Luke through rigorous training, teaching him patience, focus, and the true nature of the Force.'
    },
    {
      id: '13',
      book: 'Book 2',
      chapter: 'Chapter 3',
      moment: 'Moment 1',
      content: 'In the dark cave, Luke confronted a vision of Darth Vader, only to discover his own face beneath the mask.'
    },
    {
      id: '14',
      book: 'Book 2',
      chapter: 'Chapter 3',
      moment: 'Moment 2',
      content: 'Against Yoda\'s warnings, Luke left Dagobah to save his friends, sensing their pain in the Force.'
    },
    {
      id: '15',
      book: 'Book 2',
      chapter: 'Chapter 4',
      moment: 'Moment 1',
      content: 'Luke faced Vader in Cloud City, their lightsabers clashing in a duel that would change everything.'
    },
    {
      id: '16',
      book: 'Book 2',
      chapter: 'Chapter 4',
      moment: 'Moment 2',
      content: 'The devastating truth: "I am your father." Luke\'s world shattered as Vader revealed their connection.'
    },
    {
      id: '17',
      book: 'Book 3',
      chapter: 'Chapter 1',
      moment: 'Moment 1',
      content: 'Luke returned to Tatooine with a plan to rescue Han Solo from Jabba the Hutt.'
    },
    {
      id: '18',
      book: 'Book 3',
      chapter: 'Chapter 1',
      moment: 'Moment 2',
      content: 'Confronting Jabba, Luke demonstrated his newfound power and confidence as a Jedi Knight.'
    },
    {
      id: '19',
      book: 'Book 3',
      chapter: 'Chapter 2',
      moment: 'Moment 1',
      content: 'On Endor, Luke sensed Vader\'s presence and knew their final confrontation was inevitable.'
    },
    {
      id: '20',
      book: 'Book 3',
      chapter: 'Chapter 2',
      moment: 'Moment 2',
      content: 'Luke surrendered to the Empire, believing he could turn his father back to the light.'
    },
    {
      id: '21',
      book: 'Book 3',
      chapter: 'Chapter 3',
      moment: 'Moment 1',
      content: 'Before the Emperor, Luke refused to fight his father, choosing compassion over aggression.'
    },
    {
      id: '22',
      book: 'Book 3',
      chapter: 'Chapter 3',
      moment: 'Moment 2',
      content: 'In the end, Vader chose to save his son, destroying the Emperor and fulfilling the prophecy of the Chosen One.'
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
          {/* Breadcrumb and Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Breadcrumb items={breadcrumbItems} />
              <button className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Entity Header */}
          <EntityHeader
            name={entityData.name}
            lastUpdated={entityData.lastUpdated}
            momentsCount={entityData.momentsCount}
            chaptersCount={entityData.chaptersCount}
            booksCount={entityData.booksCount}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="text-light-text leading-relaxed whitespace-pre-line">
                {entityData.description}
              </div>

              {/* Moments */}
              <MomentsList moments={moments} />
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              <CustomFieldsPanel fields={customFields} />
              <RelationshipsPanel relationships={relationships} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
