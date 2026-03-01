'use client'

import { useState, useEffect, useRef } from 'react'

export function useStickyTop(deps: any[] = []) {
  const stickyRef = useRef<HTMLDivElement>(null)
  const [theadTop, setTheadTop] = useState(0)

  useEffect(() => {
    const el = stickyRef.current
    if (!el) return
    function update() {
      const offset = window.innerWidth >= 1024 ? 0 : 64
      setTheadTop(offset + el!.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { stickyRef, theadTop }
}
