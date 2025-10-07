'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import { SlashCommands } from './SlashMenu';
import { createMentionExtension } from './MentionExtension';

interface EditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onCharacterCountUpdate?: (count: number) => void;
  onWordCountUpdate?: (count: number) => void;
}

export default function Editor({
  content = '',
  onUpdate,
  onCharacterCountUpdate,
  onWordCountUpdate
}: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Write something great... '/' for commands, '@' to tag entities...",
      }),
      CharacterCount,
      SlashCommands,
      createMentionExtension(),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);

      // Update character and word counts
      const characterCount = editor.storage.characterCount.characters();
      const wordCount = editor.storage.characterCount.words();
      onCharacterCountUpdate?.(characterCount);
      onWordCountUpdate?.(wordCount);
    },
  });

  // Update counts on mount
  useEffect(() => {
    if (editor) {
      const characterCount = editor.storage.characterCount.characters();
      const wordCount = editor.storage.characterCount.words();
      onCharacterCountUpdate?.(characterCount);
      onWordCountUpdate?.(wordCount);
    }
  }, [editor, onCharacterCountUpdate, onWordCountUpdate]);

  return (
    <div className="w-full">
      <EditorContent
        editor={editor}
        className="
          min-h-[500px]
          text-light-text
          leading-relaxed
          text-base
          md:text-lg
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[500px]
          [&_.ProseMirror]:py-4
          [&_.ProseMirror_p]:mb-6
          [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_h1]:text-3xl
          [&_.ProseMirror_h1]:font-bold
          [&_.ProseMirror_h1]:text-white-text
          [&_.ProseMirror_h1]:mb-4
          [&_.ProseMirror_h1]:mt-8
          [&_.ProseMirror_h2]:text-2xl
          [&_.ProseMirror_h2]:font-bold
          [&_.ProseMirror_h2]:text-white-text
          [&_.ProseMirror_h2]:mb-3
          [&_.ProseMirror_h2]:mt-6
          [&_.ProseMirror_h3]:text-xl
          [&_.ProseMirror_h3]:font-bold
          [&_.ProseMirror_h3]:text-white-text
          [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_h3]:mt-4
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ul]:ml-6
          [&_.ProseMirror_ul]:mb-6
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_ol]:ml-6
          [&_.ProseMirror_ol]:mb-6
          [&_.ProseMirror_li]:mb-2
          [&_.ProseMirror_code]:bg-card-on-card
          [&_.ProseMirror_code]:text-accent
          [&_.ProseMirror_code]:px-1.5
          [&_.ProseMirror_code]:py-0.5
          [&_.ProseMirror_code]:rounded
          [&_.ProseMirror_code]:text-sm
          [&_.ProseMirror_pre]:bg-card-on-card
          [&_.ProseMirror_pre]:p-4
          [&_.ProseMirror_pre]:rounded-lg
          [&_.ProseMirror_pre]:mb-6
          [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_blockquote]:border-l-4
          [&_.ProseMirror_blockquote]:border-accent
          [&_.ProseMirror_blockquote]:pl-4
          [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_blockquote]:text-light-text/80
          [&_.ProseMirror_blockquote]:mb-6
          [&_.ProseMirror_.is-editor-empty:first-child::before]:text-light-text/40
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0
          [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_.mention]:bg-accent/20
          [&_.ProseMirror_.mention]:text-accent
          [&_.ProseMirror_.mention]:px-1
          [&_.ProseMirror_.mention]:rounded
          [&_.ProseMirror_.mention]:cursor-pointer
          [&_.ProseMirror_.mention:hover]:bg-accent/30
        "
      />
    </div>
  );
}
