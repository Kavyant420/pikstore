'use client'

import { useCallback, useRef } from 'react'

/** Pointer-driven 3D tilt + specular sheen. Pair with the `.tilt` and `.sheen` classes. */
export function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null)

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const el = ref.current
      if (!el || event.pointerType !== 'mouse') return
      const rect = el.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      el.dataset.active = 'true'
      el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    },
    [max],
  )

  const onPointerLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.dataset.active = 'false'
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
