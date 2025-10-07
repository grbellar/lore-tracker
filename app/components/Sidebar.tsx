'use client';

import { Home, GitBranch, Users, MapPin, Package, Building2, Plus, Network, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddEntity?: () => void;
}

const navigationItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: GitBranch, label: 'Timeline', href: '/timeline' },
  { icon: Users, label: 'Entities', href: '/entity' },
  { icon: MapPin, label: 'Locations', href: '/locations' },
  { icon: Package, label: 'Items', href: '/items' },
  { icon: Building2, label: 'Organizations', href: '/organizations' },
];

export default function Sidebar({ isOpen = true, onClose, onAddEntity }: SidebarProps) {
  const pathname = usePathname();

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
        w-64 lg:w-24 bg-background
        flex flex-col items-center py-6 px-4 gap-6
        transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="w-14 h-14 flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="16" fill="#17171C"/>
            <path d="M40 18H32C31.2238 18 30.4582 18.1807 29.7639 18.5279C29.0697 18.875 28.4657 19.379 28 20C27.5343 19.379 26.9303 18.875 26.2361 18.5279C25.5418 18.1807 24.7762 18 24 18H16C15.4696 18 14.9609 18.2107 14.5858 18.5858C14.2107 18.9609 14 19.4696 14 20V36C14 36.5304 14.2107 37.0391 14.5858 37.4142C14.9609 37.7893 15.4696 38 16 38H24C24.7956 38 25.5587 38.3161 26.1213 38.8787C26.6839 39.4413 27 40.2044 27 41C27 41.2652 27.1054 41.5196 27.2929 41.7071C27.4804 41.8946 27.7348 42 28 42C28.2652 42 28.5196 41.8946 28.7071 41.7071C28.8946 41.5196 29 41.2652 29 41C29 40.2044 29.3161 39.4413 29.8787 38.8787C30.4413 38.3161 31.2044 38 32 38H40C40.5304 38 41.0391 37.7893 41.4142 37.4142C41.7893 37.0391 42 36.5304 42 36V20C42 19.4696 41.7893 18.9609 41.4142 18.5858C41.0391 18.2107 40.5304 18 40 18ZM24 36H16V20H24C24.7956 20 25.5587 20.3161 26.1213 20.8787C26.6839 21.4413 27 22.2044 27 23V37C26.1353 36.3493 25.0821 35.9983 24 36ZM40 36H32C30.9179 35.9983 29.8647 36.3493 29 37V23C29 22.2044 29.3161 21.4413 29.8787 20.8787C30.4413 20.3161 31.2044 20 32 20H40V36ZM32 23H37C37.2652 23 37.5196 23.1054 37.7071 23.2929C37.8946 23.4804 38 23.7348 38 24C38 24.2652 37.8946 24.5196 37.7071 24.7071C37.5196 24.8946 37.2652 25 37 25H32C31.7348 25 31.4804 24.8946 31.2929 24.7071C31.1054 24.5196 31 24.2652 31 24C31 23.7348 31.1054 23.4804 31.2929 23.2929C31.4804 23.1054 31.7348 23 32 23ZM38 28C38 28.2652 37.8946 28.5196 37.7071 28.7071C37.5196 28.8946 37.2652 29 37 29H32C31.7348 29 31.4804 28.8946 31.2929 28.7071C31.1054 28.5196 31 28.2652 31 28C31 27.7348 31.1054 27.4804 31.2929 27.2929C31.4804 27.1054 31.7348 27 32 27H37C37.2652 27 37.5196 27.1054 37.7071 27.2929C37.8946 27.4804 38 27.7348 38 28ZM38 32C38 32.2652 37.8946 32.5196 37.7071 32.7071C37.5196 32.8946 37.2652 33 37 33H32C31.7348 33 31.4804 32.8946 31.2929 32.7071C31.1054 32.5196 31 32.2652 31 32C31 31.7348 31.1054 31.4804 31.2929 31.2929C31.4804 31.1054 31.7348 31 32 31H37C37.2652 31 37.5196 31.1054 37.7071 31.2929C37.8946 31.4804 38 31.7348 38 32Z" fill="#6F6CED"/>
          </svg>
        </div>

        {/* Top Navigation Icons */}
        <div className="flex flex-col gap-2">
          {navigationItems.slice(0, 2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`
                p-3 rounded-xl transition-colors relative group
                ${pathname === item.href
                  ? 'bg-card text-white-text border-2 border-accent'
                  : 'bg-card text-light-text hover:text-white-text hover:bg-card-on-card border-2 border-transparent'
                }
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-card-on-card text-white-text text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Main Navigation Icons */}
        <nav className="flex flex-col gap-2 flex-1">
          {navigationItems.slice(2).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`
                p-3 rounded-xl transition-colors relative group
                ${pathname === item.href
                  ? 'bg-card text-white-text border-2 border-accent'
                  : 'bg-card text-light-text hover:text-white-text hover:bg-card-on-card border-2 border-transparent'
                }
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-card-on-card text-white-text text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Add button */}
          <button
            onClick={onAddEntity}
            className="p-3 rounded-xl bg-card text-light-text hover:text-white-text hover:bg-card-on-card transition-colors border border-dashed border-foreground hover:border-light-text"
            title="Add"
          >
            <Plus className="w-5 h-5" />
          </button>
        </nav>

        {/* Bottom icons */}
        <div className="flex flex-col gap-2">
          <button
            className="p-3 rounded-xl bg-card text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
            title="Analytics"
          >
            <Network className="w-5 h-5" />
          </button>
          <button
            className="p-3 rounded-xl bg-card text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            className="p-3 rounded-xl bg-card text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
