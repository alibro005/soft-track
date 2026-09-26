import { useNavigate } from 'react-router-dom'
import { parseServerDate } from '@/api/dates'

import type { SearchHit } from '@/api/generated/models'
import { SearchHitRow } from '@/search/SearchHitRow'
import { issueHref } from '@/search/issueHref'
import { Trans, userText, useTranslation } from '@/i18n'
import { formatRelative } from '@/i18n/format'
import { PriorityIcon } from '@/issues/PriorityIcon'
import { Loading } from '@/ui/Loading'

/** Where the match was found, said plainly. Anything else is named as the server sent it. */
const MATCHED_IN_KEY: Record<
  string,
  'matchedIn.title' | 'matchedIn.description' | 'matchedIn.comment'
> = {
  title: 'matchedIn.title',
  description: 'matchedIn.description',
  comment: 'matchedIn.comment',
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
  const { t } = useTranslation('search')
  const navigate = useNavigate()

  if (isLoading) {
    return <Loading label={t('searching')} />
  }

  if (hits.length === 0) {
    return (
      <div className="glass flex h-full flex-col items-center justify-center gap-1 rounded-panel text-sm text-neutral-500">
        <p>
          <Trans
            t={t}
            i18nKey="empty"
            values={{ query }}
            components={{ query: <span className="font-medium text-neutral-800" /> }}
            {...userText}
          />
        </p>
        <p className="text-xs text-neutral-400">{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="glass scroll-thin h-full overflow-y-auto rounded-panel">
      <p className="hairline border-b px-4 py-2.5 text-xs text-neutral-500">
        <Trans
          t={t}
          i18nKey={total > hits.length ? 'resultsFirst' : 'results'}
          count={total}
          values={{ query, shown: hits.length }}
          components={{
            n: <span className="identifier font-medium text-neutral-800" />,
            query: <span className="font-medium text-neutral-800" />,
          }}
          {...userText}
        />
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

                <p className="mt-1 pl-[1.4rem] text-[11px] text-neutral-400">
                  {/* Saying where the match was stops a result whose title has
                      nothing to do with the query looking like a mistake. */}
                  {t(MATCHED_IN_KEY[hit.matched_in] ?? 'matchedIn.other', {
                    place: hit.matched_in,
                    when: formatRelative(parseServerDate(hit.updated_at)),
                  })}
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
