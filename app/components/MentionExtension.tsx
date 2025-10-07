import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import MentionList, { MentionItem, MentionListHandle } from './MentionList';

// Hardcoded entities for now - will be replaced with API call later
const MOCK_ENTITIES: MentionItem[] = [
  { id: '1', name: 'Luke Skywalker', type: 'character' },
  { id: '2', name: 'C-3PO', type: 'character' },
  { id: '3', name: 'Mark Janzen', type: 'character' },
  { id: '4', name: 'Millennium Falcon', type: 'location' },
  { id: '5', name: 'Jakku', type: 'location' },
  { id: '6', name: 'Tatooine', type: 'location' },
  { id: '7', name: 'Lightsaber', type: 'item' },
  { id: '8', name: 'Planetary Talent Inc.', type: 'organization' },
];

export const createMentionExtension = () => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention bg-accent/20 text-accent px-1 rounded',
    },
    suggestion: {
      items: ({ query }: { query: string }) => {
        return MOCK_ENTITIES.filter((entity) =>
          entity.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
      },

      render: () => {
        let component: ReactRenderer;
        let popup: TippyInstance[];

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },

          onUpdate(props) {
            component.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            popup[0].setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          },

          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              popup[0].hide();
              return true;
            }

            const ref = component.ref as MentionListHandle | null;
            return ref?.onKeyDown(props) ?? false;
          },

          onExit() {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
    } as Omit<SuggestionOptions, 'editor'>,
  });
};
