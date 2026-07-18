import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = () => {
  const mesh = useRef();
  const particlesCount = 500; // Reduced from 5000 to make it lighter

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.02;
      mesh.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={mesh}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPosition.length / 3}
            array={particlesPosition}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#3b82f6"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

const Scene3D = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <color attach="background" args={['#020617']} />
        <Particles />
      </Canvas>
    </div>
  );
};

export default Scene3D;
