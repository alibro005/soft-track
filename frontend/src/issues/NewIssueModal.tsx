import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCreateIssueTeamsTeamIdIssuesPost } from '@/api/generated/endpoints/issues/issues'
import { useListTemplatesTeamsTeamIdIssueTemplatesGet } from '@/api/generated/endpoints/templates/templates'
import { useSearchSearchGet } from '@/api/generated/endpoints/search/search'
import { IssuePriority, type IssueType } from '@/api/generated/models'
import { useTranslation } from '@/i18n'
import {
  MAX_SUGGESTIONS,
  getSearchPhrase,
  shouldShowSuggestions,
} from '@/issues/duplicateSuggestion'

import {
  ESTIMATE_SCALE,
  PRIORITY_META,
  PRIORITY_ORDER,
  TYPE_META,
  TYPE_ORDER,
} from '@/issues/issueMeta'
import { replacingLosesWork } from '@/issues/templates'
import { MarkdownEditor } from '@/markdown/lazy'
import { SearchHitRow } from '@/search/SearchHitRow'
import { issueHref } from '@/search/issueHref'
import { useDebounced } from '@/search/useDebounced'
import { activeMembers } from '@/team/members'
import { invalidateProjects, pickableProjects } from '@/team/projects'
import { useTeamContext } from '@/team/useTeamContext'
import { Icon } from '@/ui/Icon'
import { Select } from '@/ui/Select'
import { useFocusTrap } from '@/ui/useFocusTrap'

const SEARCH_DEBOUNCE_MS = 400

export function NewIssueModal({
  onClose,
  issuePanelOpen,
}: {
  onClose: () => void
  issuePanelOpen: boolean
}) {
  const { t } = useTranslation(['issues', 'common'])
  const dialogRef = useFocusTrap<HTMLDivElement>()
  const titleId = useId()
  const { team, projects, labels, members, cycles, statuses } = useTeamContext()
  const queryClient = useQueryClient()
  const createIssue = useCreateIssueTeamsTeamIdIssuesPost()
  const templates = useListTemplatesTeamsTeamIdIssueTemplatesGet(team.id).data ?? []
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // The template in use, and the text it put there -- which is how choosing
  // another one knows whether anything typed since would be lost (#97).
  const [templateId, setTemplateId] = useState('')
  const [appliedBody, setAppliedBody] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>('')
  // Empty means "whatever the team's leftmost column is", which the API
  // decides. Seeding from `statuses[0]` here would race the query that
  // loads them.
  const [statusId, setStatusId] = useState<string>('')
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.no_priority)
  const [type, setType] = useState<IssueType>('task')
  const [estimate, setEstimate] = useState<(typeof ESTIMATE_SCALE)[number] | null>(null)
  const [cycleId, setCycleId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [labelIds, setLabelIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // Resets automatically each time the modal is remounted on open.
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)

  const debouncedTitle = useDebounced(title, SEARCH_DEBOUNCE_MS)
  const shouldSuggest = shouldShowSuggestions(debouncedTitle, suggestionsDismissed)

  const {
    data: searchData,
    isError: searchFailed,
    isFetching: searchFetching,
  } = useSearchSearchGet(
    { q: getSearchPhrase(debouncedTitle), team_id: team.id, limit: MAX_SUGGESTIONS },
    { query: { enabled: shouldSuggest, retry: false, placeholderData: keepPreviousData } },
  )

  const suggestions = searchFailed ? [] : (searchData?.items ?? [])

  const showSuggestions = shouldSuggest && !searchFetching && suggestions.length > 0
  const applyTemplate = (id: string) => {
    const template = templates.find((candidate) => String(candidate.id) === id)
    if (!template) {
      setTemplateId('')
      return
    }
    // A prefill, not a lock: it only ever writes the description, and asks
    // first when that would replace something the user wrote themselves.
    if (
      replacingLosesWork(description, appliedBody) &&
      !window.confirm(t('newIssue.replaceDescription', { name: template.name }))
    ) {
      return
    }
    setTemplateId(id)
    setDescription(template.body)
    setAppliedBody(template.body)
  }

  const toggleLabel = (id: number) => {
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
  }

  const openSuggestion = (teamKey: string, number: number, issueId: number) => {
    if (teamKey !== team.key) return
    setSelectedSuggestionIndex(-1)

    navigate(issueHref(teamKey, number), {
      state: { issueId },
    })
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setError(null)
    try {
      await createIssue.mutateAsync({
        teamId: team.id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          project_id: projectId ? Number(projectId) : undefined,
          status_id: statusId ? Number(statusId) : undefined,
          priority,
          type,
          estimate,
          cycle_id: cycleId ? Number(cycleId) : undefined,
          due_date: dueDate || undefined,
          assignee_id: assigneeId ? Number(assigneeId) : undefined,
          label_ids: labelIds,
        },
      })
      queryClient.invalidateQueries({ queryKey: [`/teams/${team.id}/issues`] })
      invalidateProjects(queryClient, team.id)
      onClose()
    } catch {
      setError(t('newIssue.errors.create'))
    }
  }

  return (
    <div
      className="scrim fixed inset-0 z-20 flex items-start justify-center px-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        ref={dialogRef}
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="pop-in glass-strong w-full max-w-xl rounded-panel"
      >
        <form onSubmit={onSubmit}>
          <h2 id={titleId} className="sr-only">
            {t('newIssue.title')}
          </h2>
          <div className="hairline border-b px-5 pb-4 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="identifier rounded-full bg-neutral-900/6 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                  {team.key}
                </span>
                {/* Only on teams that wrote some: an empty picker is a
                    question with no answers. */}
                {templates.length > 0 && (
                  <Select
                    dense
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    aria-label={t('newIssue.template')}
                  >
                    <option value="">{t('newIssue.noTemplate')}</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                )}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon btn-xs text-neutral-400"
                aria-label={t('common:close')}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSelectedSuggestionIndex(-1)
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || !showSuggestions || issuePanelOpen) return

                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedSuggestionIndex((current) =>
                    current < suggestions.length - 1 ? current + 1 : 0,
                  )
                  return
                }

                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedSuggestionIndex((current) =>
                    current > 0 ? current - 1 : suggestions.length - 1,
                  )
                  return
                }

                if (e.key === 'Enter') {
                  const hit = suggestions[selectedSuggestionIndex]

                  if (hit) {
                    e.preventDefault()
                    openSuggestion(hit.team_key, hit.number, hit.id)
                  }
                }
              }}
              placeholder={t('newIssue.issueTitle')}
              aria-label={t('newIssue.issueTitle')}
              role="combobox"
              aria-autocomplete="list"
              aria-controls="similar-issues-list"
              aria-expanded={showSuggestions}
              className="w-full border-none bg-transparent p-0 text-lg font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
            />

            {showSuggestions && (
              <div className="sr-only" aria-live="polite">
                {suggestions.length} similar issue
                {suggestions.length === 1 ? '' : 's'} found.
              </div>
            )}

            {showSuggestions && (
              <div className="glass mt-2 rounded-panel">
                <div className="hairline flex items-center justify-between border-b px-3 py-1.5">
                  <span className="text-[11px] font-medium text-neutral-500">
                    Possibly similar
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestionsDismissed(true)
                      setSelectedSuggestionIndex(-1)
                    }}
                    className="btn btn-ghost btn-icon btn-xs text-neutral-400"
                    aria-label="Dismiss similar issues"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
                <ul
                  id="similar-issues-list"
                  role="listbox"
                  aria-label="Similar issues"
                  className="divide-y divide-neutral-900/8"
                >
                  {suggestions.map((hit, index) => (
                    <li
                      key={hit.id}
                      role="option"
                      aria-selected={selectedSuggestionIndex === index}
                    >
                      <SearchHitRow
                        hit={hit}
                        selected={selectedSuggestionIndex === index}
                        onClick={() =>
                          openSuggestion(hit.team_key, hit.number, hit.id)
                        }
                        trailing={
                          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900/5 px-2 py-1 text-[11px] font-medium text-neutral-500">
                            <span
                              className="dot"
                              style={{ ['--dot' as string]: hit.status.color }}
                            />
                            {hit.status.name}
                          </span>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              people={activeMembers(members)}
              placeholder={t('newIssue.descriptionPlaceholder')}
              rows={4}
              className="mt-3"
            />
          </div>

          {error && (
            <div role="alert" className="px-5 pt-3 text-sm text-danger-600">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2 px-5 py-3">
            <Select
              dense
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              aria-label={t('newIssue.status')}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>

            <Select
              dense
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              aria-label={t('newIssue.type')}
            >
              {TYPE_ORDER.map((value) => (
                <option key={value} value={value}>
                  {TYPE_META[value].label}
                </option>
              ))}
            </Select>

            <Select
              dense
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              aria-label={t('newIssue.priority')}
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>

            <Select
              dense
              value={estimate ?? ''}
              onChange={(e) =>
                setEstimate(ESTIMATE_SCALE.find((p) => String(p) === e.target.value) ?? null)
              }
              aria-label={t('newIssue.estimate')}
            >
              <option value="">{t('newIssue.noEstimate')}</option>
              {ESTIMATE_SCALE.map((points) => (
                <option key={points} value={points}>
                  {t('card.points', { count: points })}
                </option>
              ))}
            </Select>

            <Select
              dense
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              aria-label={t('newIssue.cycle')}
            >
              <option value="">{t('newIssue.noCycle')}</option>
              {cycles
                .filter((c) => c.state !== 'completed')
                .map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.display_name}
                  </option>
                ))}
            </Select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label={t('newIssue.dueDate')}
              title={t('newIssue.dueDate')}
              className="field field-sm w-auto"
            />

            <Select
              dense
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label={t('newIssue.project')}
            >
              <option value="">{t('newIssue.noProject')}</option>
              {pickableProjects(projects).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              dense
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              aria-label={t('newIssue.assignee')}
            >
              <option value="">{t('newIssue.unassigned')}</option>
              {activeMembers(members).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </Select>
          </div>

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {labels.map((label) => {
                const active = labelIds.includes(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    data-active={active}
                    aria-pressed={active}
                    className="chip chip-toggle"
                    style={{ ['--chip' as string]: label.color }}
                  >
                    {label.name}
                  </button>
                )
              })}
            </div>
          )}

          <div className="hairline flex items-center justify-end gap-2 border-t px-5 py-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={createIssue.isPending || !title.trim()}
              className="btn btn-primary"
            >
              {createIssue.isPending ? t('newIssue.creating') : t('newIssue.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
