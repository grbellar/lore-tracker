'use client';

import { useState, useMemo } from 'react';
import { Menu, Search, Filter, Grid, List as ListIcon, Users, MapPin, Package, Building2, ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import NewEntityModal from '../components/NewEntityModal';
import EntityListCard from '../components/EntityListCard';

type EntityType = 'character' | 'location' | 'item' | 'organization';

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  momentsCount: number;
  chaptersCount: number;
  booksCount: number;
  lastUpdated: string;
}

const mockEntities: Entity[] = [
  {
    id: '1',
    type: 'character',
    name: 'Luke Skywalker',
    description: 'Born on Tatooine, Luke Skywalker was a farm boy yearning for adventure among the stars. His life took a turn when he encountered Obi-Wan Kenobi, who revealed his Jedi heritage and set him on a path to confront the dark forces of the Galactic Empire.',
    momentsCount: 285,
    chaptersCount: 24,
    booksCount: 3,
    lastUpdated: 'March 14, 2024'
  },
  {
    id: '2',
    type: 'character',
    name: 'Leia Organa',
    description: 'Princess Leia Organa was a leader of the Rebel Alliance and a member of the Imperial Senate. She played a crucial role in the defeat of the Galactic Empire and the restoration of the Republic.',
    momentsCount: 198,
    chaptersCount: 18,
    booksCount: 3,
    lastUpdated: 'March 12, 2024'
  },
  {
    id: '3',
    type: 'character',
    name: 'Han Solo',
    description: 'A smuggler and captain of the Millennium Falcon, Han Solo became a hero of the Rebel Alliance despite his initial reluctance. His friendship with Chewbacca is legendary across the galaxy.',
    momentsCount: 176,
    chaptersCount: 16,
    booksCount: 2,
    lastUpdated: 'March 11, 2024'
  },
  {
    id: '4',
    type: 'location',
    name: 'Tatooine',
    description: 'A harsh desert world in the Outer Rim, home to moisture farmers, Jawas, and the infamous Mos Eisley spaceport. Twin suns beat down on endless sand dunes.',
    momentsCount: 124,
    chaptersCount: 15,
    booksCount: 2,
    lastUpdated: 'March 10, 2024'
  },
  {
    id: '5',
    type: 'location',
    name: 'Death Star',
    description: 'A moon-sized battle station capable of destroying entire planets, symbol of the Empire\'s military might and technological prowess. Its reactor core proved to be its fatal weakness.',
    momentsCount: 89,
    chaptersCount: 12,
    booksCount: 1,
    lastUpdated: 'March 8, 2024'
  },
  {
    id: '6',
    type: 'location',
    name: 'Yavin IV',
    description: 'A jungle moon that served as the primary base for the Rebel Alliance. Ancient temples dot the landscape, remnants of a long-lost civilization.',
    momentsCount: 67,
    chaptersCount: 10,
    booksCount: 1,
    lastUpdated: 'March 6, 2024'
  },
  {
    id: '7',
    type: 'item',
    name: 'Lightsaber',
    description: 'An elegant weapon for a more civilized age. The lightsaber is the signature weapon of the Jedi Order, with each one uniquely constructed by its wielder.',
    momentsCount: 156,
    chaptersCount: 20,
    booksCount: 3,
    lastUpdated: 'March 9, 2024'
  },
  {
    id: '8',
    type: 'item',
    name: 'Millennium Falcon',
    description: 'The fastest hunk of junk in the galaxy. This heavily modified Corellian freighter has made the Kessel Run in less than twelve parsecs.',
    momentsCount: 143,
    chaptersCount: 17,
    booksCount: 2,
    lastUpdated: 'March 7, 2024'
  },
  {
    id: '9',
    type: 'item',
    name: 'Death Star Plans',
    description: 'Stolen blueprints containing the technical readouts of the Empire\'s ultimate weapon, including the location of its critical vulnerability.',
    momentsCount: 45,
    chaptersCount: 8,
    booksCount: 1,
    lastUpdated: 'March 5, 2024'
  },
  {
    id: '10',
    type: 'organization',
    name: 'Rebel Alliance',
    description: 'A resistance movement formed to oppose the tyrannical Galactic Empire and restore freedom to the galaxy. Led by Mon Mothma and supported by various worlds.',
    momentsCount: 234,
    chaptersCount: 22,
    booksCount: 3,
    lastUpdated: 'March 4, 2024'
  },
  {
    id: '11',
    type: 'organization',
    name: 'Jedi Order',
    description: 'An ancient monastic peacekeeping organization devoted to defending the Galactic Republic and studying the light side of the Force.',
    momentsCount: 187,
    chaptersCount: 19,
    booksCount: 3,
    lastUpdated: 'March 3, 2024'
  },
  {
    id: '12',
    type: 'organization',
    name: 'Galactic Empire',
    description: 'The autocratic regime that replaced the Galactic Republic, ruled by Emperor Palpatine with an iron fist and enforced by the Imperial military.',
    momentsCount: 201,
    chaptersCount: 21,
    booksCount: 3,
    lastUpdated: 'March 2, 2024'
  }
];

// Label options for each entity type
const labelOptions = {
  character: [
    { value: 'all', label: 'All Characters' },
    { value: 'protagonist', label: 'Protagonist' },
    { value: 'antagonist', label: 'Antagonist' },
    { value: 'supporting', label: 'Supporting' },
    { value: 'minor', label: 'Minor' }
  ],
  location: [
    { value: 'all', label: 'All Locations' },
    { value: 'planet', label: 'Planet' },
    { value: 'city', label: 'City' },
    { value: 'building', label: 'Building' },
    { value: 'landmark', label: 'Landmark' }
  ],
  item: [
    { value: 'all', label: 'All Items' },
    { value: 'weapon', label: 'Weapon' },
    { value: 'artifact', label: 'Artifact' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'technology', label: 'Technology' }
  ],
  organization: [
    { value: 'all', label: 'All Organizations' },
    { value: 'government', label: 'Government' },
    { value: 'military', label: 'Military' },
    { value: 'religious', label: 'Religious' },
    { value: 'criminal', label: 'Criminal' }
  ]
};

export default function EntitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as EntityType | null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Get current entity type from URL
  const currentEntityType = (typeParam || 'all') as 'all' | EntityType;

  // Filter entities based on type and search
  const filteredEntities = useMemo(() => {
    let filtered = mockEntities;

    // Filter by type from URL
    if (currentEntityType !== 'all') {
      filtered = filtered.filter(entity => entity.type === currentEntityType);
    }

    // Filter by label (placeholder for now - will be implemented with actual entity labels later)
    // if (selectedLabel !== 'all') {
    //   filtered = filtered.filter(entity => entity.labels?.includes(selectedLabel));
    // }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.name.toLowerCase().includes(query) ||
        entity.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [currentEntityType, searchQuery]);

  const handleLabelChange = (newLabel: string) => {
    setSelectedLabel(newLabel);
    setFilterDropdownOpen(false);
  };

  const handleEntityClick = (entity: Entity) => {
    router.push(`/entity?id=${entity.id}&type=${entity.type}`);
  };

  // Get page title and description based on entity type
  const getPageTitle = () => {
    if (currentEntityType === 'all') return 'All Entities';
    if (currentEntityType === 'character') return 'Characters';
    if (currentEntityType === 'location') return 'Locations';
    if (currentEntityType === 'item') return 'Items';
    if (currentEntityType === 'organization') return 'Organizations';
    return 'All Entities';
  };

  const getPageDescription = () => {
    if (currentEntityType === 'all') {
      return 'Browse and manage all entities in your universe.';
    }
    return `Browse and manage all ${getPageTitle().toLowerCase()} in your universe.`;
  };

  // Get label options for current entity type
  const getCurrentLabelOptions = () => {
    if (currentEntityType === 'all') {
      return [{ value: 'all', label: 'All Entities' }];
    }
    return labelOptions[currentEntityType] || [{ value: 'all', label: 'All' }];
  };

  const currentLabelOptions = getCurrentLabelOptions();
  const currentLabelOption = currentLabelOptions.find(opt => opt.value === selectedLabel) || currentLabelOptions[0];

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
                <h1 className="text-2xl font-bold text-white-text mb-1">{getPageTitle()}</h1>
                <p className="text-sm text-light-text">{getPageDescription()}</p>
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-light-text" />
                  <input
                    type="text"
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-card border border-card-on-card rounded-lg text-sm text-white-text placeholder-light-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Label Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-card-on-card rounded-lg text-sm text-white-text hover:border-accent transition-colors"
                >
                  {currentEntityType === 'character' && <Users className="w-4 h-4" />}
                  {currentEntityType === 'location' && <MapPin className="w-4 h-4" />}
                  {currentEntityType === 'item' && <Package className="w-4 h-4" />}
                  {currentEntityType === 'organization' && <Building2 className="w-4 h-4" />}
                  {currentEntityType === 'all' && <Filter className="w-4 h-4" />}
                  <span>{currentLabelOption?.label}</span>
                  <ChevronDown className="w-4 h-4 text-light-text" />
                </button>

                {/* Dropdown Menu */}
                {filterDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setFilterDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-card border border-card-on-card rounded-lg shadow-lg z-50 py-2">
                      {currentLabelOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleLabelChange(option.value)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            selectedLabel === option.value
                              ? 'bg-accent/20 text-accent'
                              : 'text-white-text hover:bg-card-on-card'
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Results Count */}
              <span className="text-sm text-light-text">
                {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-card border border-card-on-card rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white-text'
                    : 'text-light-text hover:text-white-text'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-accent text-white-text'
                    : 'text-light-text hover:text-white-text'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Entities Grid/List */}
          {filteredEntities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-light-text mb-2">No entities found</p>
              <p className="text-sm text-light-text">
                {searchQuery.trim() ? 'Try adjusting your search query' : 'Create your first entity to get started'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'grid grid-cols-1 gap-4'
            }>
              {filteredEntities.map((entity) => (
                <EntityListCard
                  key={entity.id}
                  id={entity.id}
                  type={entity.type}
                  name={entity.name}
                  description={entity.description}
                  momentsCount={entity.momentsCount}
                  lastUpdated={entity.lastUpdated}
                  viewMode={viewMode}
                  onClick={() => handleEntityClick(entity)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
