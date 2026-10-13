// @vitest-environment jsdom
/**
 * Who is offered "Delete ticket…" (#158): whoever the server lets move it to
 * the trash (#323) -- the team's admins and the ticket's creator, or any
 * member on a team with `any_member_may_delete`.
 */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TeamRole, TeamRead, TicketRead } from '@/api/generated/models'
import { TicketHeaderActions } from '@/tickets/TicketHeaderActions'

const ME = { id: 1, email: 'me@x.dev', username: 'me', full_name: 'Me', avatar_color: '#123', is_active: true }
const PRIYA = { ...ME, id: 2, username: 'priya', full_name: 'Priya' }

const mocks = vi.hoisted(() => ({
  role: 'member' as string,
  anyMemberMayDelete: false,
  teams: 1,
}))

vi.mock('@/team/useTeamContext', () => ({
  useTeamContext: () => {
    const team = {
      id: 5,
      key: 'ENG',
      name: 'Engineering',
      any_member_may_delete: mocks.anyMemberMayDelete,
    } as TeamRead
    const other = { id: 6, key: 'OPS', name: 'Ops' } as TeamRead
    return {
      team,
      teams: mocks.teams > 1 ? [team, other] : [team],
      members: [{ role: mocks.role as TeamRole, user: ME }],
    }
  },
}))
vi.mock('@/auth/useAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/auth/useAuth')>()),
  useAuth: () => ({ user: ME }),
}))
vi.mock('@/notifications/WatchToggle', () => ({ WatchToggle: () => null }))

const ticket = { id: 42, team_id: 5, identifier: 'ENG-42', creator: PRIYA } as unknown as TicketRead

async function menuItems(of: TicketRead = ticket) {
  render(<TicketHeaderActions ticket={of} />)
  const more = screen.queryByRole('button', { name: 'More actions' })
  if (!more) return []
  await userEvent.setup().click(more)
  return screen.getAllByRole('menuitem').map((item) => item.textContent)
}

beforeEach(() => {
  mocks.role = 'member'
  mocks.anyMemberMayDelete = false
  mocks.teams = 2
})

afterEach(cleanup)

describe('TicketHeaderActions', () => {
  it('leaves Delete out for a member when the team keeps deleting to its creator and admins', async () => {
    expect(await menuItems()).toEqual(['Move to another team…'])
  })

  it('offers it to the ticket’s creator', async () => {
    expect(await menuItems({ ...ticket, creator: ME } as TicketRead)).toEqual([
      'Move to another team…',
      'Delete ticket…',
    ])
  })

  it('offers it to a team admin', async () => {
    mocks.role = 'admin'
    expect(await menuItems()).toContain('Delete ticket…')
  })

  it('offers it to any member when the team lets any member delete', async () => {
    mocks.anyMemberMayDelete = true
    expect(await menuItems()).toContain('Delete ticket…')
  })

  it('shows no ⋯ menu when there is nothing in it', async () => {
    mocks.teams = 1
    expect(await menuItems()).toEqual([])
  })

  it('shows a guest no ⋯ menu, even on their own ticket', async () => {
    mocks.role = 'guest'
    mocks.anyMemberMayDelete = true
    expect(await menuItems({ ...ticket, creator: ME } as TicketRead)).toEqual([])
  })
})
