import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';

import CanvasLoader from './Loader';

const Galaxy = () => {
  const galaxy = useGLTF('./milky_way_skybox/scene.gltf'); // Adjust path as needed

  return (
    <primitive
      object={galaxy.scene}
      scale={501}
      position-y={-28}
    />
  );
};

const GalaxyCanvas = () => {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        fov: 65,
        near: 0.1,
        position: [0, 500, 0],
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          autoRotate
          enableZoom={true}
          maxPolarAngle={Math.PI / 4}
          minPolarAngle={Math.PI / 1.8}
        />
        <Galaxy />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default GalaxyCanvas;
