import { useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'

import { errorDetail } from '@/api/errors'
import { getListTicketAttachmentsTicketsTicketIdAttachmentsGetQueryKey } from '@/api/generated/endpoints/attachments/attachments'
import { getListCommentsTicketsTicketIdCommentsGetQueryKey } from '@/api/generated/endpoints/comments/comments'
import {
  getListTicketLinksTicketsTicketIdLinksGetQueryKey,
  useDeleteTicketTicketsTicketIdDelete,
} from '@/api/generated/endpoints/tickets/tickets'
import type {
  AttachmentRead,
  PageCommentRead,
  TicketLinks,
  TicketRead,
} from '@/api/generated/models'
import { useTranslation } from '@/i18n'
import { invalidateTrashedTickets } from '@/tickets/invalidateTickets'
import { TicketTypeIcon } from '@/tickets/TicketTypeIcon'
import { Icon } from '@/ui/Icon'
import { showToast } from '@/ui/toast'
import { useFocusTrap } from '@/ui/useFocusTrap'

/**
 * Deleting one ticket (#158): it moves to the team's trash (#323), with
 * everything it has, until it is restored or purged.
 *
 * The counts come from what the ticket's panel or page has already loaded --
 * nothing is fetched to fill them in -- and a line with nothing to count, or
 * nothing loaded to count, is left out.
 */
export function DeleteTicketDialog({
  ticket,
  onDeleted,
  onClose,
}: {
  ticket: TicketRead
  onDeleted: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('tickets')
  const queryClient = useQueryClient()
  const dialogRef = useFocusTrap<HTMLFormElement>()
  const titleId = useId()
  const remove = useDeleteTicketTicketsTicketIdDelete()
  const [error, setError] = useState<string | null>(null)

  const comments = queryClient.getQueryData<PageCommentRead>(
    getListCommentsTicketsTicketIdCommentsGetQueryKey(ticket.id),
  )?.total
  const attachments = queryClient.getQueryData<AttachmentRead[]>(
    getListTicketAttachmentsTicketsTicketIdAttachmentsGetQueryKey(ticket.id),
  )?.length
  const linkGroups = queryClient.getQueryData<TicketLinks>(
    getListTicketLinksTicketsTicketIdLinksGetQueryKey(ticket.id),
  )
  const links = linkGroups
    ? Object.values(linkGroups).reduce((total, group) => total + (group?.length ?? 0), 0)
    : 0
  const lines: string[] = [
    comments ? t('panel.delete.comments', { count: comments }) : null,
    attachments ? t('panel.delete.attachments', { count: attachments }) : null,
    links ? t('panel.delete.links', { count: links }) : null,
    ticket.child_count > 0 ? t('panel.delete.subTickets', { count: ticket.child_count }) : null,
  ].flatMap((line) => (line === null ? [] : [line]))

  const submit = async () => {
    if (remove.isPending) return
    setError(null)
    try {
      await remove.mutateAsync({ ticketId: ticket.id })
    } catch (err: unknown) {
      setError(errorDetail(err, t('panel.delete.failed')))
      return
    }
    invalidateTrashedTickets(queryClient, ticket.team_id)
    showToast(
      ticket.child_count > 0
        ? t('panel.delete.successSubTickets', {
            identifier: ticket.identifier,
            count: ticket.child_count,
          })
        : t('panel.delete.success', { identifier: ticket.identifier }),
    )
    onDeleted()
  }

  return createPortal(
    <div className="scrim fixed inset-0 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !remove.isPending) {
            event.stopPropagation()
            onClose()
          }
        }}
        className="glass-strong pop-in w-full max-w-md rounded-panel p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-neutral-900">
          {t('panel.delete.title', { identifier: ticket.identifier })}
        </h2>

        <div className="well mt-4 flex items-center gap-2 rounded-control px-3 py-2.5">
          <TicketTypeIcon type={ticket.type} size={13} />
          <span className="identifier shrink-0 text-xs text-neutral-500">{ticket.identifier}</span>
          <span className="truncate text-sm text-neutral-800">{ticket.title}</span>
        </div>

        <p className="mt-3 text-sm text-neutral-600">{t('panel.delete.trash')}</p>
        {lines.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-control bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}

        <div className="hairline mt-5 flex justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={remove.isPending}
            className="btn btn-secondary btn-sm"
          >
            {t('panel.delete.cancel')}
          </button>
          <button type="submit" disabled={remove.isPending} className="btn btn-danger btn-sm">
            <Icon name="trash" size={14} className="shrink-0" />
            {remove.isPending ? t('panel.delete.deleting') : t('panel.delete.confirm')}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
