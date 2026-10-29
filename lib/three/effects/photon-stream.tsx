// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
'use client'

/**
 * components-free Three.js effect module: Additive-blended photon streaks for download physics.
 * Pure react-three-fiber; zero runtime deps beyond three/@react-three/fiber.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

export type PhotonStreamSceneProps = {
  /** 0..1 intensity driven by app state (trust score, verdict, progress). */
  intensity?: number
  colorA?: string
  colorB?: string
  count?: number
}

function Scene({ intensity = 0.5, colorA = '#7dd3fc', colorB = '#a78bfa', count = 512 }: PhotonStreamSceneProps) {
  const group = useRef<THREE.Group>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2
      const r = 1.4 + 0.6 * Math.sin(t * 3.1)
      arr[i * 3] = Math.cos(t) * r
      arr[i * 3 + 1] = Math.sin(i * 0.37) * 0.9
      arr[i * 3 + 2] = Math.sin(t) * r
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * (0.12 + intensity * 0.9)
    const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04 * (1 + intensity)
    group.current.scale.setScalar(s)
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035 + intensity * 0.03} color={colorA} transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial color={colorB} wireframe transparent opacity={0.25 + intensity * 0.4} />
      </mesh>
    </group>
  )
}

export default function PhotonStreamScene({ intensity, colorA, colorB, count }: PhotonStreamSceneProps) {
  return (
    <Canvas dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ position: [0, 0.6, 4], fov: 42 }}>
      <Scene intensity={intensity} colorA={colorA} colorB={colorB} count={count} />
    </Canvas>
  )
}
