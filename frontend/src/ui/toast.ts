/**
 * Toasts: `showToast` from anywhere, `ToastHost` (mounted once, in App)
 * shows them. Apart from the component for Fast Refresh, as with useAuth.
 */
export const TOAST_EVENT = 'softtrack:toast'

/** Long enough to read a sentence; a newer toast replaces it sooner. */
export const TOAST_MS = 4000

/** Confirm something that just happened: "ENG-42 moved to the trash." */
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }))
}
