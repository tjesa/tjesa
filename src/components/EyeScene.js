'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';

const GOLD = {
  color: '#C9A84C',
  metalness: 0.92,
  roughness: 0.16,
  emissive: '#7A5210',
  emissiveIntensity: 0.3,
};

function EyeMesh() {
  const outerRef = useRef();   // animation group
  const irisRef  = useRef();   // iris glow pulse

  // ── Geometry (memoised — built once) ──────────────────────────────────────
  const { eyeGeo, browGeo } = useMemo(() => {
    // Almond eye outline with pupil hole
    const shape = new THREE.Shape();
    shape.moveTo(0.82, 0);
    shape.bezierCurveTo( 0.42,  0.50, -0.45,  0.66, -1.82, 0);
    shape.bezierCurveTo(-0.45, -0.50,  0.42, -0.46,  0.82, 0);

    const pupilHole = new THREE.Path();
    pupilHole.absarc(-0.26, 0.02, 0.32, 0, Math.PI * 2, false);
    shape.holes.push(pupilHole);

    const eyeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 4,
    });

    // Eyebrow — TubeGeometry along a quadratic bezier
    const browCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3( 0.70,  0.80, 0),
      new THREE.Vector3(-0.40,  1.14, 0),
      new THREE.Vector3(-1.60,  0.72, 0),
    );
    const browGeo = new THREE.TubeGeometry(browCurve, 24, 0.07, 8, false);

    return { eyeGeo, browGeo };
  }, []);

  // ── Animation ──────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.36;
      outerRef.current.position.y = Math.sin(t * 0.62) * 0.1;
    }
    // Iris glow pulse
    if (irisRef.current) {
      irisRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 1.8) * 0.3;
    }
  });

  // Outer group offset centres the whole symbol (eye + tail) at the origin
  // eye body: x -1.82→+0.82, tail extends to x -3.29 → true centre ≈ +1.24
  return (
    <group position={[1.24, 0, 0]}>
      <group ref={outerRef} scale={[1.15, 1.15, 1.15]}>

        {/* ── EYE OUTLINE ── */}
        <mesh geometry={eyeGeo} position={[0, 0, -0.11]}>
          <meshStandardMaterial {...GOLD} />
        </mesh>

        {/* ── IRIS ── */}
        <mesh ref={irisRef} position={[-0.26, 0.02, 0.13]}>
          <circleGeometry args={[0.32, 40]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.75}
            roughness={0.2}
            emissive="#D4A010"
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Pupil */}
        <mesh position={[-0.26, 0.02, 0.15]}>
          <circleGeometry args={[0.14, 28]} />
          <meshStandardMaterial color="#0B0B09" roughness={0.9} metalness={0} />
        </mesh>

        {/* Iris glow ring */}
        <mesh position={[-0.26, 0.02, 0.12]}>
          <ringGeometry args={[0.32, 0.42, 40]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.7}
            transparent
            opacity={0.45}
          />
        </mesh>

        {/* ── EYEBROW ARC ── */}
        <mesh geometry={browGeo}>
          <meshStandardMaterial {...GOLD} />
        </mesh>

        {/* ── TAIL ─────────────────────────────────────────────────────────── */}
        {/* Horizontal bar from outer corner going left */}
        <mesh position={[-2.52, 0, 0]}>
          <boxGeometry args={[1.40, 0.13, 0.15]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>

        {/* Vertical drop */}
        <mesh position={[-3.22, -0.32, 0]}>
          <boxGeometry args={[0.13, 0.64, 0.15]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>

        {/* Hook curl at bottom — half-torus opening upward */}
        <mesh position={[-3.01, -0.64, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.21, 0.065, 10, 24, Math.PI]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>

      </group>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} color="#FFF8E0" />
      <pointLight position={[4, 5, 3]}   intensity={16} color="#FFD700" />
      <pointLight position={[-3, -2, 3]} intensity={5}  color="#4050CC" />
      <pointLight position={[0, -4, 2]}  intensity={4}  color="#C9A84C" />
      <Suspense fallback={null}>
        <Environment preset="sunset" />
      </Suspense>
      <EyeMesh />
      <Sparkles
        count={45}
        scale={[5, 4, 4]}
        size={1.5}
        speed={0.20}
        color="#D4AF37"
        opacity={0.45}
      />
    </>
  );
}

export default function EyeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 44 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}
