import { useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useId, useState } from 'react'

import { useCreateIssueTeamsTeamIdIssuesPost } from '@/api/generated/endpoints/issues/issues'
import { useListTemplatesTeamsTeamIdIssueTemplatesGet } from '@/api/generated/endpoints/templates/templates'
import { useSearchSearchGet } from '@/api/generated/endpoints/search/search'
import { useOpenIssue } from '@/issues/surface'
import { IssuePriority, type IssueType } from '@/api/generated/models'
import { useTranslation } from '@/i18n'
import {
  ESTIMATE_SCALE,
  PRIORITY_META,
  PRIORITY_ORDER,
  TYPE_META,
  TYPE_ORDER,
} from '@/issues/issueMeta'
import { replacingLosesWork } from '@/issues/templates'
import { MarkdownEditor } from '@/markdown/lazy'
import { activeMembers } from '@/team/members'
import { invalidateProjects, pickableProjects } from '@/team/projects'
import { useTeamContext } from '@/team/useTeamContext'
import { Icon } from '@/ui/Icon'
import { Select } from '@/ui/Select'
import { useFocusTrap } from '@/ui/useFocusTrap'
import { useDebounced } from '@/search/useDebounced'

const CJK_RE =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/

function getSearchPhrase(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ''

  if (CJK_RE.test(trimmed)) {
    const compact = trimmed.replace(/\s+/g, '')
    return Array.from(compact).length >= 3 ? trimmed : ''
  }

  return trimmed.split(/\s+/).filter(Boolean).length >= 3 ? trimmed : ''
}

export function NewIssueModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['issues', 'common'])
  const dialogRef = useFocusTrap<HTMLDivElement>()
  const titleId = useId()
  const { team, projects, labels, members, cycles, statuses } = useTeamContext()
  const queryClient = useQueryClient()
  const createIssue = useCreateIssueTeamsTeamIdIssuesPost()
  const templates = useListTemplatesTeamsTeamIdIssueTemplatesGet(team.id).data ?? []

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)

  const openIssue = useOpenIssue()
  const searchPhrase = useDebounced(getSearchPhrase(title), 400)

  const searchResults = useSearchSearchGet(
    {
      q: searchPhrase || 'x',
      team_id: team.id,
      limit: 3,
    },
    {
      query: {
        enabled: searchPhrase.length > 0 && !suggestionsDismissed,
      },
    },
  )

  const suggestions =
    !suggestionsDismissed && !searchResults.isFetching
      ? (searchResults.data?.items ?? [])
      : []

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
                setSelectedSuggestion(-1)
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return

                if (suggestions.length === 0) return

                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setSelectedSuggestion((current) =>
                    current < suggestions.length - 1 ? current + 1 : 0,
                  )
                  return
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setSelectedSuggestion((current) =>
                    current > 0 ? current - 1 : suggestions.length - 1,
                  )
                  return
                }

                if (event.key === 'Enter' && selectedSuggestion >= 0) {
                  event.preventDefault()
                  openIssue(suggestions[selectedSuggestion], 'panel')
                }
              }}
              placeholder={t('newIssue.issueTitle')}
              aria-label={t('newIssue.issueTitle')}
              className="w-full border-none bg-transparent p-0 text-lg font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
            />
            {suggestions.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-md border border-neutral-900/8 bg-neutral-900/2">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    {t('newIssue.similarIssues')}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSuggestionsDismissed(true)}
                    className="btn btn-ghost btn-icon btn-xs text-neutral-400"
                    aria-label={t('newIssue.dismissSimilarIssues')}
                  >
                    <Icon name="close" size={11} />
                  </button>
                </div>

                <ul className="divide-y divide-neutral-900/6">
                  {suggestions.map((issue, index) => (
                    <li key={issue.id}>
                      <button
                        type="button"
                        onClick={() => openIssue(issue, 'panel')}
                        className={`w-full px-3 py-2 text-left transition-colors focus:outline-none ${
                          index === selectedSuggestion
                            ? 'bg-brand-500/10'
                            : 'hover:bg-neutral-900/4'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="identifier shrink-0 text-[11px] font-medium text-neutral-400">
                            {issue.identifier}
                          </span>

                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800">
                            {issue.title}
                          </span>

                          <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-neutral-400">
                          <span
                            className="dot"
                            style={{ ['--dot' as string]: issue.status.color }}
                          />
                            {issue.status.name}
                          </span>
                        </div>
                      </button>
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
