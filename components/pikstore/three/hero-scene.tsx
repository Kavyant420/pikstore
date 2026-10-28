'use client'

import { Environment, Float, Lightformer, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type TileMaterial = 'ceramic' | 'chrome' | 'porcelain'

const TILES: { angle: number; radius: number; y: number; scale: number; material: TileMaterial; speed: number }[] = [
  { angle: 0.2, radius: 3.1, y: 0.9, scale: 0.9, material: 'ceramic', speed: 1.2 },
  { angle: 0.95, radius: 3.4, y: -1.1, scale: 0.7, material: 'chrome', speed: 1.6 },
  { angle: 1.7, radius: 3.0, y: 1.4, scale: 0.6, material: 'porcelain', speed: 1.1 },
  { angle: 2.45, radius: 3.3, y: -0.4, scale: 0.85, material: 'ceramic', speed: 1.4 },
  { angle: 3.2, radius: 3.1, y: 1.1, scale: 0.7, material: 'chrome', speed: 1.8 },
  { angle: 3.95, radius: 3.5, y: -1.3, scale: 0.95, material: 'porcelain', speed: 1.3 },
  { angle: 4.7, radius: 3.0, y: 0.3, scale: 0.6, material: 'ceramic', speed: 1.5 },
  { angle: 5.45, radius: 3.3, y: -0.9, scale: 0.75, material: 'chrome', speed: 1.2 },
]

function TileSurface({ kind }: { kind: TileMaterial }) {
  if (kind === 'chrome') return <meshStandardMaterial color="#d4d4d4" metalness={1} roughness={0.18} />
  if (kind === 'porcelain') return <meshPhysicalMaterial color="#f2f2f2" roughness={0.35} clearcoat={1} clearcoatRoughness={0.2} />
  return <meshPhysicalMaterial color="#141414" roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
}

function DownloadArrow() {
  const geometry = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.16, 0.62)
    s.lineTo(0.16, 0.62)
    s.lineTo(0.16, -0.02)
    s.lineTo(0.42, -0.02)
    s.lineTo(0, -0.52)
    s.lineTo(-0.42, -0.02)
    s.lineTo(-0.16, -0.02)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 6,
    })
    g.center()
    return g
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.12} />
    </mesh>
  )
}

function Centerpiece() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.35
    ref.current.rotation.x = Math.cos(t * 0.3) * 0.12
  })

  return (
    <group ref={ref}>
      <RoundedBox args={[2.4, 2.4, 0.7]} radius={0.52} smoothness={8}>
        <MeshTransmissionMaterial
          backside
          samples={6}
          resolution={768}
          thickness={0.45}
          roughness={0.04}
          ior={1.3}
          chromaticAberration={0}
          anisotropy={0.1}
          distortion={0}
          temporalDistortion={0}
          clearcoat={1}
          color="#ffffff"
          background={new THREE.Color('#262626')}
        />
      </RoundedBox>
      <group scale={1.25}>
        <DownloadArrow />
      </group>
    </group>
  )
}

function ParticleField() {
  const points = useMemo(() => {
    const positions = new Float32Array(180 * 3)
    for (let i = 0; i < 180; i += 1) {
      const radius = 4 + Math.random() * 3.8
      const angle = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1
    }
    return positions
  }, [])
  const ref = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.018
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.025} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function OrbitalShell() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.08
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.18
  })

  return (
    <group ref={ref} rotation={[0.7, 0.2, 0]}>
      {[2.8, 3.25].map((radius, index) => (
        <mesh key={radius} rotation={[index * 0.8, index * 0.5, 0]}>
          <torusGeometry args={[radius, 0.012, 8, 180]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2 - index * 0.05} />
        </mesh>
      ))}
    </group>
  )
}

function Halo() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.z = t * 0.05
    ref.current.children.forEach((child, i) => {
      child.scale.setScalar(1 + Math.sin(t * 0.8 + i * 1.4) * 0.025)
    })
  })

  return (
    <group ref={ref} position={[0, 0, -1.6]}>
      {[2.05, 2.55, 3.15].map((r, i) => (
        <mesh key={r}>
          <torusGeometry args={[r, i === 0 ? 0.018 : 0.008, 12, 160]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={i === 0 ? 0.9 : 0.35 - i * 0.08} />
        </mesh>
      ))}
    </group>
  )
}

function Orbit() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.09
  })

  return (
    <group ref={ref} rotation={[0.22, 0, -0.08]}>
      {TILES.map((tile, i) => (
        <Float key={i} speed={tile.speed} rotationIntensity={0.8} floatIntensity={0.9}>
          <group
            position={[Math.cos(tile.angle) * tile.radius, tile.y, Math.sin(tile.angle) * tile.radius]}
            rotation={[0.3 * i, 0.6 * i, 0.15 * i]}
            scale={tile.scale}
          >
            <RoundedBox args={[1, 1, 0.24]} radius={0.22} smoothness={6}>
              <TileSurface kind={tile.material} />
            </RoundedBox>
          </group>
        </Float>
      ))}
    </group>
  )
}

function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const wide = viewport.aspect > 1.15
  const offsetX = wide ? Math.min(viewport.width * 0.27, 3.6) : 0
  const offsetY = wide ? 0 : viewport.height * 0.2
  const scale = wide ? 0.82 : Math.min(0.85, viewport.width / 9)

  useFrame((state, delta) => {
    if (!ref.current) return
    const { x, y } = state.pointer
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, x * 0.35, 3, delta)
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -y * 0.2, 3, delta)
  })

  return (
    <group ref={ref} position={[offsetX, offsetY, 0]} scale={scale}>
      {children}
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 32 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <Rig>
        <ParticleField />
        <OrbitalShell />
        <Halo />
        <Centerpiece />
        <Orbit />
      </Rig>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={5} position={[0, 6, -3]} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[10, 0.6, 1]} />
        <Lightformer form="ring" intensity={3} position={[0, 0, 8]} scale={4} />
      </Environment>
    </Canvas>
  )
}
