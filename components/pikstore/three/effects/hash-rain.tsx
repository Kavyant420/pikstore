// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
"use client"

/** Thin lazy wrapper so pages can dynamic-import heavy WebGL scenes. */
import { Suspense, lazy } from 'react'

const Inner = lazy(() => import('../../../../lib/three/effects/hash-trail'))

export default function HashRain({ className = '' }: { className?: string }) {
  return (
    <div className={`${className} pointer-events-none absolute inset-0`} aria-hidden>
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </div>
  )
}
