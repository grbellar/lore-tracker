'use client';

interface EntityLinkProps {
  name: string;
  type?: 'character' | 'location' | 'item' | 'organization';
}

export default function EntityLink({ name }: EntityLinkProps) {
  return (
    <button className="text-accent hover:brightness-110 hover:underline transition-all font-medium">
      {name}
    </button>
  );
}
