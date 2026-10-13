import { useState } from 'react'

import type { TicketRead } from '@/api/generated/models'
import { useAuth } from '@/auth/useAuth'
import { useTranslation } from '@/i18n'
import { TicketActionsMenu } from '@/tickets/detail/TicketActionsMenu'
import { DeleteTicketDialog } from '@/tickets/DeleteTicketDialog'
import { MoveTicketModal } from '@/tickets/MoveTicketModal'
import { WatchToggle } from '@/notifications/WatchToggle'
import { activeTeams } from '@/team/archived'
import { mayDeleteTicket } from '@/team/members'
import { useCanWrite } from '@/team/useCanWrite'
import { useTeamContext } from '@/team/useTeamContext'

/**
 * Watch and the ⋯ menu: the actions every ticket surface's header carries,
 * whatever else it adds around them -- a close button on the panel, a
 * permalink on the page (#112).
 */
export function TicketHeaderActions({
  ticket,
  onDeleted,
}: {
  ticket: TicketRead
  onDeleted?: () => void
}) {
  const { t } = useTranslation('tickets')
  const { team, teams, members } = useTeamContext()
  const { user } = useAuth()
  // A guest (#104) sees the whole ticket and can change none of it -- except
  // whether they are watching it, which is theirs.
  const readOnly = !useCanWrite()
  const [moving, setMoving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Teams it could go to. Whether the user may write to each is the server's
  // call, and the move dialog says so if not. Not an archived one (#322),
  // which takes nothing.
  const elsewhere = activeTeams(teams).filter((other) => other.id !== ticket.team_id)
  // Deleting moves it to the trash (#323), which the team may leave to its
  // admins and the ticket's creator.
  const mayDelete = mayDeleteTicket(team, members, user?.id, ticket)

  return (
    <>
      <WatchToggle ticketId={ticket.id} />
      {!readOnly && (
        <TicketActionsMenu
          actions={[
            ...(elsewhere.length > 0
              ? [{ label: t('panel.actions.moveToTeam'), onSelect: () => setMoving(true) }]
              : []),
            ...(mayDelete
              ? [
                  {
                    label: t('panel.actions.delete'),
                    onSelect: () => setDeleting(true),
                    destructive: true,
                  },
                ]
              : []),
          ]}
        />
      )}
      {moving && (
        <MoveTicketModal ticket={ticket} teams={elsewhere} onClose={() => setMoving(false)} />
      )}
      {deleting && (
        <DeleteTicketDialog
          ticket={ticket}
          onClose={() => setDeleting(false)}
          onDeleted={() => {
            setDeleting(false)
            onDeleted?.()
          }}
        />
      )}
    </>
  )
}
