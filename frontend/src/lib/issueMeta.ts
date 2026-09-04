import { IssuePriority, IssueStatus } from '../api/generated/models'

export const STATUS_ORDER: IssueStatus[] = [
  IssueStatus.backlog,
  IssueStatus.todo,
  IssueStatus.in_progress,
  IssueStatus.in_review,
  IssueStatus.done,
  IssueStatus.cancelled,
]

export const STATUS_META: Record<IssueStatus, { label: string; dot: string }> = {
  backlog: { label: 'Backlog', dot: 'bg-gray-400' },
  todo: { label: 'Todo', dot: 'bg-gray-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500' },
  in_review: { label: 'In Review', dot: 'bg-violet-500' },
  done: { label: 'Done', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-400' },
}

export const PRIORITY_ORDER: IssuePriority[] = [
  IssuePriority.urgent,
  IssuePriority.high,
  IssuePriority.medium,
  IssuePriority.low,
  IssuePriority.no_priority,
]

export const PRIORITY_META: Record<IssuePriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600' },
  high: { label: 'High', color: 'text-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  low: { label: 'Low', color: 'text-blue-500' },
  no_priority: { label: 'No priority', color: 'text-gray-400' },
}
