'use client';

import { Plus } from 'lucide-react';

interface CustomField {
  label: string;
  value: string;
}

interface CustomFieldsPanelProps {
  fields: CustomField[];
  onAddNew?: () => void;
}

export default function CustomFieldsPanel({ fields, onAddNew }: CustomFieldsPanelProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-light-text uppercase tracking-wider mb-4">
        Custom Fields
      </h3>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-light-text">{field.label}:</span>
            <span className="text-sm text-white-text font-medium">{field.value}</span>
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
