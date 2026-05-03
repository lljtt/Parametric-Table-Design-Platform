import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Grid } from '@react-three/drei';
import { TableModel } from './TableModel';
import { useTableStore } from '../../store/useTableStore';

export const Scene: React.FC = () => {
  const parameters = useTableStore((state) => state.parameters);
  const isCapturing = useTableStore((state) => state.isCapturing);

  return (
    <div className="w-full h-full bg-transparent relative">
      {/* Linear depth gradient: Light at bottom, darker/hazy at top */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/40 via-white/5 to-transparent z-10" />
      
      <Canvas
        shadows
        camera={{ position: [2, 2, 2], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, alpha: true }} // Required for screenshots and transparency
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.4} />
          
          <TableModel parameters={parameters} />
          
          {!isCapturing && (
            <>
              <ContactShadows 
                position={[0, -0.01, 0]} 
                opacity={0.35} 
                scale={10} 
                blur={2.8} 
                far={4.5} 
              />
              
              <Grid 
                infiniteGrid 
                fadeDistance={10} 
                fadeStrength={5} 
                sectionSize={1} 
                sectionThickness={1.5} 
                cellThickness={1}
                sectionColor="#475569" 
                cellColor="#94a3b8"
                position={[0, 0, 0]}
              />
            </>
          )}
          
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
      </Canvas>
      
      {!isCapturing && (
        <div className="absolute bottom-4 left-4 pointer-events-none z-20">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            交互式 3D 预览
          </div>
        </div>
      )}
    </div>
  );
};
