'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment } from '@react-three/drei';

const GOLD_MAT = {
  color: '#C9A84C',
  metalness: 0.92,
  roughness: 0.16,
  emissive: '#7A5210',
  emissiveIntensity: 0.28,
};

function AnkhMesh() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.44;
    groupRef.current.position.y = Math.sin(t * 0.65) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Oval loop */}
      <mesh position={[0, 1.05, 0]} scale={[1, 1.3, 1]}>
        <torusGeometry args={[0.46, 0.1, 20, 64]} />
        <meshStandardMaterial {...GOLD_MAT} />
      </mesh>

      {/* Vertical shaft */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.8, 20]} />
        <meshStandardMaterial {...GOLD_MAT} />
      </mesh>

      {/* Horizontal crossbar */}
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.44, 20]} />
        <meshStandardMaterial {...GOLD_MAT} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} color="#FFF8E0" />
      <pointLight position={[4, 5, 3]} intensity={16} color="#FFD700" />
      <pointLight position={[-3, -2, 3]} intensity={5} color="#4050CC" />
      <pointLight position={[0, -4, 2]} intensity={4} color="#C9A84C" />
      <Suspense fallback={null}>
        <Environment preset="sunset" />
      </Suspense>
      <AnkhMesh />
      <Sparkles
        count={55}
        scale={[4, 5, 4]}
        size={1.7}
        speed={0.22}
        color="#D4AF37"
        opacity={0.5}
      />
    </>
  );
}

export default function AnkhScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 36 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}
