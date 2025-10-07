'use client';

import { Home, Workflow, Users, MapPin, Package, Building2, Plus, Network, Settings, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddEntity?: () => void;
}

const navigationItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Workflow, label: 'Timeline', href: '/timeline' },
];

const entityItems = [
  { icon: Users, label: 'Characters', href: '/entities?type=character' },
  { icon: MapPin, label: 'Locations', href: '/entities?type=location' },
  { icon: Package, label: 'Items', href: '/entities?type=item' },
  { icon: Building2, label: 'Organizations', href: '/entities?type=organization' },
];

export default function Sidebar({ isOpen = true, onClose, onAddEntity }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen
        bg-background
        flex flex-col py-6 px-4 gap-6
        transition-all duration-300 z-50
        ${isExpanded ? 'w-64' : 'w-24'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo and Collapse Toggle */}
        <div className="flex items-center justify-between w-full">
          {isExpanded && (
            <span className="text-2xl font-semibold text-white-text">Lore Tracker</span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card transition-colors flex-shrink-0 ${!isExpanded ? 'mx-auto' : ''}`}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Project Info */}
        <div className={`px-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0'}`}>
          <h2 className="text-sm font-semibold text-white-text mb-1">Star Wars Universe</h2>
          <p className="text-xs text-light-text leading-relaxed">
            A science fiction universe where fantasy meets technology.
          </p>
        </div>

        {/* Top Navigation */}
        <div className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center rounded-xl transition-colors
                ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
                ${pathname === item.href
                  ? 'bg-card text-white-text border-2 border-accent'
                  : 'text-light-text hover:text-white-text hover:bg-card/50'
                }
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Entities Section */}
        <nav className="flex flex-col gap-2 flex-1">
          {isExpanded && (
            <div className="text-xs text-light-text uppercase tracking-wider px-3 mb-1">
              Entities
            </div>
          )}

          {entityItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center rounded-xl transition-colors
                ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
                ${pathname === item.href
                  ? 'bg-card text-white-text border-2 border-accent'
                  : 'text-light-text hover:text-white-text hover:bg-card/50'
                }
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}

          {/* Add button */}
          <button
            onClick={onAddEntity}
            className={`
              flex items-center rounded-xl text-light-text hover:text-white-text hover:bg-card/50 transition-colors border border-dashed border-foreground hover:border-light-text
              ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
            `}
            title="Create New"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Create New</span>}
          </button>
        </nav>

        {/* Bottom icons */}
        <div className="flex flex-col gap-2">
          <button
            className={`
              flex items-center rounded-xl text-light-text hover:text-white-text hover:bg-card/50 transition-colors
              ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
            `}
            title="Graph View"
          >
            <Network className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Graph View</span>}
          </button>
          <button
            className={`
              flex items-center rounded-xl text-light-text hover:text-white-text hover:bg-card/50 transition-colors
              ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
            `}
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Settings</span>}
          </button>
          <button
            className={`
              flex items-center rounded-xl text-light-text hover:text-white-text hover:bg-card/50 transition-colors
              ${isExpanded ? 'gap-3 p-3' : 'p-3 justify-center'}
            `}
            title="Profile"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Profile</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
