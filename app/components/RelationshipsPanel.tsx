'use client';

import { Plus } from 'lucide-react';

interface Relationship {
  type: string;
  target: string;
}

interface RelationshipsPanelProps {
  relationships: Relationship[];
  onAddNew?: () => void;
}

export default function RelationshipsPanel({ relationships, onAddNew }: RelationshipsPanelProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-light-text uppercase tracking-wider mb-4">
        Relationships
      </h3>

      <div className="space-y-3">
        {relationships.map((rel, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-light-text">{rel.type}:</span>
            <span className="text-sm text-white-text font-medium">{rel.target}</span>
          </div>
        ))}

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 text-sm text-light-text hover:text-white-text transition-colors mt-4"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>
    </div>
  );
}
