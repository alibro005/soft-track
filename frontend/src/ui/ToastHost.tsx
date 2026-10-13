import { useEffect, useState } from 'react'

import { Icon } from '@/ui/Icon'
import { TOAST_EVENT, TOAST_MS } from '@/ui/toast'

/**
 * The one toast on screen, at the bottom. A newer one replaces it and gets
 * its own full time. The live region is always mounted, so a screen reader
 * hears the message when it appears rather than missing a region that
 * arrived with it.
 */
export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail
      if (typeof detail !== 'string') return
      window.clearTimeout(timer)
      setMessage(detail)
      timer = window.setTimeout(() => setMessage(null), TOAST_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {message && (
        <div className="glass-menu pop-in flex items-center gap-2 rounded-card px-4 py-2.5 text-sm text-neutral-800">
          <Icon name="check" size={15} className="shrink-0 text-status-done" />
          {message}
        </div>
      )}
    </div>
  )
}
