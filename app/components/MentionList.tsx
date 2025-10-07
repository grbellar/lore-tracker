'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User, MapPin, Package, Building2 } from 'lucide-react';

export interface MentionItem {
  id: string;
  name: string;
  type: 'character' | 'location' | 'item' | 'organization';
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export interface MentionListHandle {
  onKeyDown: ({ event }: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const getEntityIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'character':
        return <User className={iconClass} />;
      case 'location':
        return <MapPin className={iconClass} />;
      case 'item':
        return <Package className={iconClass} />;
      case 'organization':
        return <Building2 className={iconClass} />;
      default:
        return <User className={iconClass} />;
    }
  };

  return (
    <div className="bg-card border border-card-on-card rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`
              w-full text-left px-3 py-2 flex items-center gap-2.5
              transition-colors
              ${
                index === selectedIndex
                  ? 'bg-accent/20'
                  : 'hover:bg-card-on-card'
              }
            `}
          >
            <div className={index === selectedIndex ? 'text-accent' : 'text-light-text'}>
              {getEntityIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${index === selectedIndex ? 'text-accent' : 'text-white-text'}`}>
                {item.name}
              </div>
              <div className="text-xs text-light-text capitalize">
                {item.type}
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-4 py-3 text-light-text/50 text-sm">No entities found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
