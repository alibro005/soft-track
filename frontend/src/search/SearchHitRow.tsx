import type { ReactNode } from 'react';
import type { SearchHit } from '@/api/generated/models';

export function SearchHitRow({
  hit,
  onClick,
  selected = false,
  leading,
  trailing,
  children,
}: {
  hit: SearchHit;
  onClick: () => void;
  selected?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 text-left transition-colors ${
        selected ? 'bg-brand-500/10' : 'hover:bg-neutral-900/4'
      } focus:outline-none focus-visible:bg-brand-500/10`}
    >
      <div className="flex items-center gap-3">
        {leading}

        <span className="identifier shrink-0 text-xs font-medium text-neutral-400">
          {hit.identifier}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
          {hit.title}
        </span>

        {trailing}
      </div>

      {children}
    </button>
  );
}