'use client';

import { Users, MapPin, Package, Building2, Calendar } from 'lucide-react';

interface EntityListCardProps {
  id: string;
  type: 'character' | 'location' | 'item' | 'organization';
  name: string;
  description: string;
  momentsCount: number;
  lastUpdated: string;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

const typeConfig = {
  character: {
    icon: Users,
    label: 'Character',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  location: {
    icon: MapPin,
    label: 'Location',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30'
  },
  item: {
    icon: Package,
    label: 'Item',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30'
  },
  organization: {
    icon: Building2,
    label: 'Organization',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  }
};

export default function EntityListCard({
  type,
  name,
  description,
  momentsCount,
  lastUpdated,
  viewMode,
  onClick
}: EntityListCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  if (viewMode === 'grid') {
    return (
      <div
        onClick={onClick}
        className="bg-card rounded-lg p-6 border-2 border-card-on-card hover:border-accent transition-all cursor-pointer group h-full flex flex-col"
      >
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 ${config.bgColor} rounded-lg`}>
            <Icon className={`w-4 h-4 ${config.textColor}`} />
          </div>
          <span className={`text-xs font-medium uppercase tracking-wider ${config.textColor}`}>
            {config.label}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-white-text mb-3 group-hover:text-accent transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-light-text leading-relaxed mb-4 flex-1 line-clamp-3">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-card-on-card">
          <div className="flex items-center gap-1 text-xs text-light-text">
            <Calendar className="w-3 h-3" />
            {lastUpdated}
          </div>
          <div className="text-xs text-light-text">
            {momentsCount} Moments
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg p-6 border-2 border-card-on-card hover:border-accent transition-all cursor-pointer group flex items-start gap-6"
    >
      {/* Icon */}
      <div className={`p-4 ${config.bgColor} rounded-lg flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${config.textColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type and Name */}
        <div className="mb-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${config.textColor} block mb-1`}>
            {config.label}
          </span>
          <h3 className="text-xl font-semibold text-white-text group-hover:text-accent transition-colors">
            {name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-light-text leading-relaxed mb-4 line-clamp-4">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-light-text">
            <Calendar className="w-3 h-3" />
            {lastUpdated}
          </div>
          <div className="text-xs text-light-text">
            {momentsCount} Moments
          </div>
        </div>
      </div>
    </div>
  );
}
