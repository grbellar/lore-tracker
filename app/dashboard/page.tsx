'use client';

import { useState } from 'react';
import { Menu, Moon, Search, Edit3, Users, MapPin, Building2, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NewEntityModal from '../components/NewEntityModal';
import Link from 'next/link';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);

  const stats = [
    { label: 'Total Words', value: '125,000', change: '+2,444 this month' },
    { label: 'Characters', value: '14', change: '+2 this month' },
    { label: 'Locations', value: '3', change: '+1 this month' },
    { label: 'Active Conflicts', value: '2', change: '3 resolved this month' },
  ];

  const quickAccess = [
    { icon: Users, name: 'Luke Skywalker', type: 'Character', href: '/entity' },
    { icon: MapPin, name: 'Yavin IV', type: 'Location', href: '/locations' },
    { icon: Building2, name: 'The Rebellion', type: 'Organization', href: '/organizations' },
  ];

  const recentActivity = [
    { text: 'Updated "The Man in the Goggles"', subtext: 'The Beginning', time: '2 hours ago' },
    { text: 'Updated "The Man in the Goggles"', subtext: 'The Beginning', time: '4 hours ago' },
    { text: 'Added character "Luke Skywalker"', subtext: '', time: '5 hours ago' },
    { text: 'Resolved timeline conflict in Chapter 1', subtext: '', time: '1 day ago' },
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white-text mb-2">Universe Dashboard</h1>
                <p className="text-light-text">Welcome back to the Star Wars Universe. Here's what's happening in your universe.</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                <button className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors">
                  <Moon className="w-5 h-5" />
                </button>
                <button className="flex items-center gap-3 px-6 py-2.5 bg-card rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors min-w-[200px]">
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white-text rounded-lg hover:brightness-110 transition-all">
                  <Edit3 className="w-5 h-5" />
                  Continue Writing
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg p-6 border border-card-on-card">
                <div className="text-sm text-light-text mb-2">{stat.label}</div>
                <div className="text-3xl font-bold text-white-text mb-1">{stat.value}</div>
                <div className="text-xs text-light-text">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Writing Progress */}
          <div className="bg-card rounded-lg p-6 border border-card-on-card mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white-text mb-1">Writing Progress</h2>
              <p className="text-sm text-light-text">Current book: The Beginning</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-light-text">Words written</span>
                <span className="text-sm text-white-text font-medium">45000 / 50,000</span>
              </div>
              <div className="w-full bg-foreground rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white-text mb-1">2</div>
                <div className="text-sm text-light-text">Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white-text mb-1">90%</div>
                <div className="text-sm text-light-text">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white-text mb-1">10</div>
                <div className="text-sm text-light-text">Days left</div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Access */}
            <div className="bg-card rounded-lg p-6 border border-card-on-card">
              <h2 className="text-xl font-semibold text-white-text mb-1">Quick Access</h2>
              <p className="text-sm text-light-text mb-6">Jump to your most important entities and locations</p>

              <div className="space-y-3">
                {quickAccess.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-on-card transition-colors"
                  >
                    <div className="p-2 bg-card-on-card rounded-lg">
                      <item.icon className="w-5 h-5 text-light-text" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white-text">{item.name}</div>
                      <div className="text-xs text-light-text">{item.type}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-lg p-6 border border-card-on-card">
              <h2 className="text-xl font-semibold text-white-text mb-6">Recent Activity</h2>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div className="flex-1">
                      <div className="text-sm text-white-text">{activity.text}</div>
                      {activity.subtext && (
                        <div className="text-xs text-light-text mt-1">{activity.subtext}</div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-light-text mt-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
