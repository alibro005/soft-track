import type { TeamMemberRead, TeamRead, TicketRead, UserPublic } from '@/api/generated/models'

/**
 * The people a picker should offer.
 *
 * Deactivated accounts keep their memberships -- their tickets, comments and
 * history all still point at them -- but nobody should be able to assign new
 * work to someone who cannot sign in. `keepId` makes the exception that
 * matters: a ticket already assigned to a deactivated colleague has to keep
 * showing them in its own dropdown, or opening the ticket would silently offer
 * to unassign it.
 */
export function activeMembers(
  members: TeamMemberRead[],
  keepId?: number | null,
): UserPublic[] {
  return members
    .map((member) => member.user)
    .filter((user) => user.is_active || user.id === keepId)
}

/**
 * Who an assignee picker offers (#316): the people who may hold the team's
 * tickets, and its guests apart from them. A guest reads the team and holds
 * none of its work, and the API refuses one as an assignee, so a picker lists
 * guests where they can be seen but not chosen.
 *
 * Deactivated accounts are left out as in `activeMembers`, and `keepId` is
 * the same exception: whoever holds the ticket already stays listed, among
 * the guests if that is what they are now.
 */
export function assigneeChoices(
  members: TeamMemberRead[],
  keepId?: number | null,
): { assignable: UserPublic[]; guests: UserPublic[] } {
  const listed = members.filter((member) => member.user.is_active || member.user.id === keepId)
  return {
    assignable: listed.filter((member) => member.role !== 'guest').map((member) => member.user),
    guests: listed.filter((member) => member.role === 'guest').map((member) => member.user),
  }
}

/**
 * Whether someone may change anything on this team (#104).
 *
 * Only a guest may not. Someone missing from the roster -- still loading, or
 * a test that never listed them -- counts as able to: this decides what the
 * UI offers, and the server refuses a guest whatever the UI shows, so the
 * cheap mistake is offering a button that will 403, not hiding the board's
 * controls from its own members while a query is in flight.
 */
export function canWriteIn(members: TeamMemberRead[], userId: number | undefined): boolean {
  return members.find((member) => member.user.id === userId)?.role !== 'guest'
}

/**
 * Whether someone may move a ticket to the trash (#323), as
 * `lib_softtrack/deleting.py` decides it: the team's admins and the ticket's
 * creator, or anybody but a guest on a team with `any_member_may_delete`.
 *
 * A site admin gets no exception there, so none here. Someone missing from
 * the roster counts as a member, as in `canWriteIn`: the server has the last
 * word, and a guest has no ⋯ menu to offer this in.
 */
export function mayDeleteTicket(
  team: Pick<TeamRead, 'any_member_may_delete'>,
  members: TeamMemberRead[],
  userId: number | undefined,
  ticket: Pick<TicketRead, 'creator'>,
): boolean {
  if (userId === undefined) return false
  const role = members.find((member) => member.user.id === userId)?.role
  if (role === 'guest') return false
  return role === 'admin' || ticket.creator.id === userId || Boolean(team.any_member_may_delete)
}
