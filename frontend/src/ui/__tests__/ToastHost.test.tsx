// @vitest-environment jsdom
/** The toast: announced, replaced by a newer one, gone after its time. */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ToastHost } from '@/ui/ToastHost'
import { TOAST_MS, showToast } from '@/ui/toast'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('ToastHost', () => {
  it('is a polite live region that is there before any toast is', () => {
    render(<ToastHost />)

    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.textContent).toBe('')

    act(() => showToast('ENG-42 moved to the trash.'))
    expect(screen.getByRole('status')).toBe(region)
    expect(region.textContent).toBe('ENG-42 moved to the trash.')

    act(() => vi.advanceTimersByTime(TOAST_MS))
    expect(region.textContent).toBe('')
  })

  it('gives a newer toast its own full time, not what was left of the old one', () => {
    render(<ToastHost />)

    act(() => showToast('ENG-42 moved to the trash.'))
    act(() => vi.advanceTimersByTime(TOAST_MS - 500))
    act(() => showToast('ENG-43 moved to the trash.'))
    // The first toast's timer would have hidden the second one here.
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole('status').textContent).toBe('ENG-43 moved to the trash.')

    act(() => vi.advanceTimersByTime(TOAST_MS))
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('leaves no timer behind when it unmounts', () => {
    const { unmount } = render(<ToastHost />)
    act(() => showToast('ENG-42 moved to the trash.'))

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
