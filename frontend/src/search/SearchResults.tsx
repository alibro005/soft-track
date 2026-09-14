import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { parseServerDate } from '@/api/dates'

import type { SearchHit } from '@/api/generated/models'
import { SearchHitRow } from '@/search/SearchHitRow'
import { issueHref } from '@/search/issueHref'
import { PriorityIcon } from '@/issues/PriorityIcon'
import { Loading } from '@/ui/Loading'

/** Where the match was found, said plainly. */
const MATCHED_IN_LABEL: Record<string, string> = {
  title: 'title',
  description: 'description',
  comment: 'a comment',
}

export function SearchResults({
  query,
  hits,
  total,
  isLoading,
}: {
  query: string
  hits: SearchHit[]
  total: number
  isLoading: boolean
}) {
  const navigate = useNavigate()

  if (isLoading) {
    return <Loading label="Searching…" />
  }

  if (hits.length === 0) {
    return (
      <div className="glass flex h-full flex-col items-center justify-center gap-1 rounded-panel text-sm text-neutral-500">
        <p>
          Nothing matches <span className="font-medium text-neutral-800">“{query}”</span>.
        </p>
        <p className="text-xs text-neutral-400">
          Titles, descriptions and comments were all searched.
        </p>
      </div>
    )
  }

  return (
    <div className="glass scroll-thin h-full overflow-y-auto rounded-panel">
      <p className="hairline border-b px-4 py-2.5 text-xs text-neutral-500">
        <span className="identifier font-medium text-neutral-800">{total}</span>{' '}
        {total === 1 ? 'result' : 'results'} for{' '}
        <span className="font-medium text-neutral-800">“{query}”</span>
        {total > hits.length && <> · showing the first {hits.length}</>}
      </p>

      <ul className="divide-y divide-neutral-900/8">
        {hits.map((hit) => {
            const meta = hit.status

            return (
              <li key={hit.id}>
                <SearchHitRow
                  hit={hit}
                  onClick={() => navigate(issueHref(hit.team_key, hit.number))}
                  leading={
                    <span
                      className="dot"
                      style={{ ['--dot' as string]: meta.color }}
                    />
                  }
                  trailing={<PriorityIcon priority={hit.priority} />}
                >
                  {hit.snippet && (
                    <p className="mt-1 line-clamp-2 px-4 pl-[1.4rem] text-xs leading-relaxed text-neutral-500">
                      {hit.snippet}
                    </p>
                  )}

                  <p className="mt-1 px-4 pl-[1.4rem] text-[11px] text-neutral-400">
                    matched in {MATCHED_IN_LABEL[hit.matched_in] ?? hit.matched_in} ·{' '}
                    {formatDistanceToNow(parseServerDate(hit.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </SearchHitRow>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
