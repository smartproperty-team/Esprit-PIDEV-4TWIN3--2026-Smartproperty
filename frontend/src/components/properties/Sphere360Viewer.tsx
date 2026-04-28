// ===========================================
// SmartProperty - True 360° Spherical Viewer
// ===========================================
// Renders equirectangular panoramic images on an inverted sphere
// using Three.js via @react-three/fiber and @react-three/drei.

import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

// ── Types ──────────────────────────────────────────────────────

export interface Sphere360ViewerProps {
  /** URL of the equirectangular panorama image */
  src: string;
  /** Accessible label */
  altText?: string;
  /** Enable auto-rotation (default: true) */
  autoRotate?: boolean;
  /** Auto-rotation speed (default: 0.5) */
  autoRotateSpeed?: number;
  /** Container height CSS value (default: "100%") */
  height?: string;
}

// ── Inner scene rendered inside the Canvas ─────────────────────

function SphereScene({
  src,
  autoRotate,
  autoRotateSpeed,
}: {
  src: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
}) {
  const texture = useLoader(THREE.TextureLoader, src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <>
      <OrbitControls
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={-0.35}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
      />
      <mesh>
        <sphereGeometry args={[50, 64, 64]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

// ── Loading fallback inside Canvas ─────────────────────────────

function CanvasLoader() {
  return (
    <mesh>
      <sphereGeometry args={[50, 16, 16]} />
      <meshBasicMaterial color="#1a1a2e" side={THREE.BackSide} wireframe />
    </mesh>
  );
}

// ── Main exported component ────────────────────────────────────

export default function Sphere360Viewer({
  src,
  altText,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  height = "100%",
}: Sphere360ViewerProps) {
  const [loadError, setLoadError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setLoadError(false);
  }, [src]);

  if (loadError) {
    return (
      <div className="sphere360-error" role="alert">
        <p>Failed to load panorama image.</p>
      </div>
    );
  }

  return (
    <div
      className="sphere360-container"
      style={{ width: "100%", height }}
      aria-label={altText || "360° panoramic viewer"}
      role="img"
    >
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0.1], near: 0.1, far: 1000 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0a0e1a");
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <SphereScene
            key={src}
            src={src}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
          />
        </Suspense>
      </Canvas>

      <div className="sphere360-hint">
        Drag to look around &bull; Scroll to zoom
      </div>
    </div>
  );
}
