'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

function ScannedCore() {
  const core = useRef<THREE.Mesh>(null)
  const cage = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (core.current) {
      core.current.rotation.y += delta * 0.25
      core.current.rotation.x += delta * 0.1
    }
    if (cage.current) {
      cage.current.rotation.y -= delta * 0.12
      cage.current.rotation.z += delta * 0.05
    }
    if (ring.current) {
      ring.current.position.y = Math.sin(t * 1.1) * 1.55
      const s = Math.sqrt(Math.max(0.04, 1 - (ring.current.position.y / 2.1) ** 2)) * 2.15
      ring.current.scale.setScalar(s)
    }
  })

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#e5e5e5" metalness={1} roughness={0.2} flatShading />
      </mesh>
      <mesh ref={cage}>
        <icosahedronGeometry args={[2.05, 2]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.14} />
      </mesh>
      <group ref={ring}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[1, 0.008, 8, 128]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
        </mesh>
      </group>
    </group>
  )
}

export default function ShieldScene() {
  return (
    <Canvas camera={{ position: [0, 0.6, 6.4], fov: 38 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }} aria-hidden="true">
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <ScannedCore />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, -2]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 1, 1]} />
        <Lightformer form="ring" intensity={2} position={[3, 1, 5]} scale={3} />
      </Environment>
    </Canvas>
  )
}
