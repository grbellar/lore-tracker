'use client';

import EntityLink from './EntityLink';

interface Paragraph {
  id: string;
  content: string | (string | { type: 'entity'; name: string; entityType?: 'character' | 'location' | 'item' })[];
}

interface ArticleContentProps {
  paragraphs: Paragraph[];
}

export default function ArticleContent({ paragraphs }: ArticleContentProps) {
  const renderContent = (content: Paragraph['content']) => {
    if (typeof content === 'string') {
      return <span>{content}</span>;
    }

    return content.map((part, index) => {
      if (typeof part === 'string') {
        return <span key={index}>{part}</span>;
      }
      return (
        <EntityLink
          key={index}
          name={part.name}
          type={part.entityType}
        />
      );
    });
  };

  return (
    <div className="prose prose-invert max-w-none">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.id}
          className="text-light-text leading-relaxed mb-6 text-base md:text-lg"
        >
          {renderContent(paragraph.content)}
        </p>
      ))}
    </div>
  );
}
