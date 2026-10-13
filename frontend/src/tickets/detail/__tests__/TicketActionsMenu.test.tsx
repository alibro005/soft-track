// @vitest-environment jsdom
/** The ⋯ menu's divider: above a destructive action that follows others, and only there. */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type TicketAction, TicketActionsMenu } from '@/tickets/detail/TicketActionsMenu'

afterEach(cleanup)

async function open(actions: TicketAction[]) {
  render(<TicketActionsMenu actions={actions} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'More actions' }))
  return screen.getByRole('menu')
}

const move: TicketAction = { label: 'Move to another team…', onSelect: vi.fn() }
const remove: TicketAction = { label: 'Delete ticket…', onSelect: vi.fn(), destructive: true }

describe('TicketActionsMenu', () => {
  it('draws a divider above Delete when something comes before it', async () => {
    const menu = await open([move, remove])

    expect([...menu.children].map((child) => child.textContent || child.getAttribute('role'))).toEqual([
      'Move to another team…',
      'separator',
      'Delete ticket…',
    ])
  })

  it('draws none when Delete is the only action', async () => {
    await open([remove])

    expect(screen.queryByRole('separator')).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Delete ticket…' })).toBeTruthy()
  })
})
