// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
"use client"

/** Pause r3f frameloop / animations when tab hidden — big battery/CPU win. */
import { useEffect, useState } from 'react'

export function useVisibilityPause(): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    on()
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}
