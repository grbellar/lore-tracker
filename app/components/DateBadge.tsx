'use client';

interface DateBadgeProps {
  date: string;
  label?: string;
}

export default function DateBadge({ date, label = 'Last Updated' }: DateBadgeProps) {
  return (
    <div className="px-3 py-1 rounded-md bg-card-on-card text-light-text text-sm">
      {label}: {date}
    </div>
  );
}
