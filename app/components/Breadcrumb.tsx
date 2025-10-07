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
          className="px-3 py-1 rounded-md bg-card-on-card text-accent transition-colors hover:bg-foreground"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
