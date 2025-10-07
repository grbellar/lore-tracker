'use client';

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <button
          key={index}
          className={`
            px-3 py-1 rounded-md transition-colors
            ${index === items.length - 1
              ? 'bg-accent text-white-text'
              : 'bg-card-on-card text-light-text hover:text-white-text hover:bg-foreground'
            }
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
