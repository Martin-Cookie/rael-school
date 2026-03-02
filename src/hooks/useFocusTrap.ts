import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Zachytí fokus uvnitř modálního dialogu. Vrací ref pro kontejner. */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active || !ref.current) return

    const el = ref.current
    const prev = document.activeElement as HTMLElement | null

    // Focus first focusable element
    const first = el.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') return // handled by component
      if (e.key !== 'Tab') return

      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return

      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      prev?.focus()
    }
  }, [active])

  return ref
}
