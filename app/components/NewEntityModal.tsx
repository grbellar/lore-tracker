'use client';

import { X, Save } from 'lucide-react';
import { useState } from 'react';

interface NewEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const entityTypes = [
  'Character',
  'Location',
  'Item',
  'Organization',
  'Event',
  'Concept'
];

export default function NewEntityModal({ isOpen, onClose }: NewEntityModalProps) {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    // Handle save logic here
    console.log({ name, entityType, notes });
    // Reset form
    setName('');
    setEntityType('');
    setNotes('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-card rounded-2xl w-full max-w-md p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white-text">Add New Entity</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-card-on-card rounded-lg text-white-text placeholder:text-light-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Entity Type Dropdown */}
            <div className="relative">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-card-on-card rounded-lg text-white-text appearance-none focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="" disabled className="text-light-text">
                  Entity Type
                </option>
                {entityTypes.map((type) => (
                  <option key={type} value={type} className="bg-background text-white-text">
                    {type}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-light-text">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Notes Textarea */}
            <div>
              <textarea
                placeholder="Jot down thoughts on this entity..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-background border border-card-on-card rounded-lg text-white-text placeholder:text-light-text focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-accent text-white-text rounded-lg font-medium flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Save className="w-4 h-4" />
                Save Entity
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
