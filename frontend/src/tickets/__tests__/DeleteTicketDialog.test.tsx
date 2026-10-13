// @vitest-environment jsdom
/**
 * Deleting a ticket (#158) moves it to the team's trash (#323): the dialog
 * says so, counts what goes with it from what is already loaded, refreshes
 * every place the ticket was shown, and a toast confirms it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TicketRead } from '@/api/generated/models'
import { DeleteTicketDialog } from '@/tickets/DeleteTicketDialog'
import { ToastHost } from '@/ui/ToastHost'

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock('@/api/generated/endpoints/tickets/tickets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/generated/endpoints/tickets/tickets')>()),
  useDeleteTicketTicketsTicketIdDelete: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}))

const ticket = {
  id: 42,
  identifier: 'ENG-42',
  title: 'Safari drag ghost offset on scrolled columns',
  team_id: 1,
  type: 'bug',
  child_count: 3,
  parent: { id: 9 },
} as unknown as TicketRead

/** A ticket whose panel has loaded its comments, files and links. */
function loaded(client: QueryClient, comments: number, attachments: number, links: number) {
  client.setQueryData(['/tickets/42/comments'], { items: [], total: comments })
  client.setQueryData(
    ['/tickets/42/attachments'],
    Array.from({ length: attachments }, (_, id) => ({ id })),
  )
  client.setQueryData(['/tickets/42/links'], {
    blocks: Array.from({ length: links }, (_, id) => ({ id })),
    relates_to: [],
  })
}

function renderDialog({
  client = new QueryClient(),
  onDeleted = vi.fn(),
  onClose = vi.fn(),
  of = ticket,
}: {
  client?: QueryClient
  onDeleted?: () => void
  onClose?: () => void
  of?: TicketRead
} = {}) {
  render(
    <QueryClientProvider client={client}>
      <ToastHost />
      <DeleteTicketDialog ticket={of} onDeleted={onDeleted} onClose={onClose} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.mutateAsync.mockResolvedValue(undefined)
})

afterEach(cleanup)

describe('DeleteTicketDialog', () => {
  it('names the ticket and says it moves to the trash, where it can be restored', () => {
    renderDialog()

    expect(screen.getByRole('heading', { name: 'Delete ENG-42?' })).toBeTruthy()
    expect(screen.getByText('ENG-42')).toBeTruthy()
    expect(screen.getByText('Safari drag ghost offset on scrolled columns')).toBeTruthy()
    const dialog = screen.getByRole('dialog').textContent ?? ''
    expect(dialog).toContain('It moves to the team’s trash with its history')
    expect(dialog).toContain('can be restored from the trash, as it was, until it is purged')
    // What the mockup said before there was a trash is no longer true.
    expect(dialog).not.toMatch(/cannot be undone|top level|removed/i)
  })

  it('counts what goes with it from what is already loaded', () => {
    const client = new QueryClient()
    loaded(client, 4, 2, 2)
    renderDialog({ client })

    expect(screen.getByText('Its 4 comments go with it.')).toBeTruthy()
    expect(screen.getByText('Its 2 attachments go with it, files and all.')).toBeTruthy()
    expect(screen.getByText('Its 2 links to other tickets go with it.')).toBeTruthy()
    expect(screen.getByText('Its 3 sub-tickets stay on the board.')).toBeTruthy()
  })

  it('says one of each in the singular', () => {
    const client = new QueryClient()
    loaded(client, 1, 1, 1)
    renderDialog({ client, of: { ...ticket, child_count: 1 } })

    expect(screen.getByText('Its comment goes with it.')).toBeTruthy()
    expect(screen.getByText('Its attachment goes with it, file and all.')).toBeTruthy()
    expect(screen.getByText('Its link to another ticket goes with it.')).toBeTruthy()
    expect(screen.getByText('Its sub-ticket stays on the board.')).toBeTruthy()
  })

  it('leaves out a line with nothing to count, or nothing loaded to count it from', () => {
    const client = new QueryClient()
    loaded(client, 0, 0, 0)
    renderDialog({ client, of: { ...ticket, child_count: 0 } })

    expect(screen.queryByRole('list')).toBeNull()
    cleanup()

    renderDialog({ of: { ...ticket, child_count: 0 } })
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('has Cancel focused, which closes without deleting', async () => {
    const onClose = vi.fn()
    const user = renderDialog({ onClose })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mocks.mutateAsync).not.toHaveBeenCalled()
  })

  it('deletes by id, then closes and confirms with a toast from the catalog', async () => {
    const onDeleted = vi.fn()
    const user = renderDialog({ onDeleted })

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }))

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ ticketId: 42 })
    expect(screen.getByRole('status').textContent).toBe(
      'ENG-42 moved to the trash. Its 3 sub-tickets stay on the board.',
    )
  })

  it.each([
    [1, 'ENG-42 moved to the trash. Its sub-ticket stays on the board.'],
    [0, 'ENG-42 moved to the trash.'],
  ])('words the toast for %i sub-tickets', async (children, toast) => {
    const user = renderDialog({ of: { ...ticket, child_count: children } })

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }))

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(toast))
  })

  it('refreshes every place the ticket was shown, and the trash it went to', async () => {
    const client = new QueryClient()
    const keys = {
      board: ['/teams/1/tickets', { limit: 200 }],
      parentsSubTickets: ['/teams/1/tickets', { parent_id: 9 }],
      itself: ['/tickets/42'],
      parent: ['/tickets/9'],
      linkedTicketsLinks: ['/tickets/77/links'],
      myWork: ['/me/work', { tab: 'assigned' }],
      search: ['/search', { q: 'safari' }],
      trash: ['/teams/1/trash'],
      otherTeam: ['/teams/2/tickets'],
    }
    for (const key of Object.values(keys)) client.setQueryData(key, {})
    const user = renderDialog({ client })

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }))

    await waitFor(() => expect(client.getQueryState(keys.trash)?.isInvalidated).toBe(true))
    const { otherTeam, ...refreshed } = keys
    for (const [name, key] of Object.entries(refreshed)) {
      expect([name, client.getQueryState(key)?.isInvalidated]).toEqual([name, true])
    }
    expect(client.getQueryState(otherTeam)?.isInvalidated).toBe(false)
  })

  it('shows an error and stays open when deletion fails', async () => {
    mocks.mutateAsync.mockRejectedValueOnce(new Error('delete failed'))
    const onDeleted = vi.fn()
    const user = renderDialog({ onDeleted })

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Could not delete this ticket.')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toBe('')
  })
})
