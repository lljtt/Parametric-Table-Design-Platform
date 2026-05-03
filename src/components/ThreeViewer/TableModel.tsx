import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { TableParameters, useTableStore } from '../../store/useTableStore';
import { Outlines } from '@react-three/drei';

interface TableModelProps {
  parameters: TableParameters;
}

export function hslToHex(h: number, s: number, l: number): number {
  const hN = h / 360, sN = s / 100, lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => { const k = (n + hN * 12) % 12; return lN - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

export function roundedRectShape(w: number, d: number, r: number): THREE.Shape {
  r = Math.max(0, Math.min(r, w / 2 * 0.92, d / 2 * 0.92));
  const hw = w / 2, hd = d / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

export const TableModel: React.FC<TableModelProps> = ({ parameters }) => {
  const {
    tableLength,
    tableWidth,
    cornerRadius,
    legHeight,
    legWidth,
    legFlare,
    legInset,
    apronHeight,
    colorHue,
    metalness,
    roughness,
    materialCategory,
  } = parameters;

  const [hovered, setHovered] = useState(false);

  // Normalize absolute units back to 0-100 range for the original model scaling logic
  const tL = ((tableLength - 1200) / 1200) * 100;
  const tW = ((tableWidth - 600) / 600) * 100;
  const cR = (cornerRadius / 150) * 100;
  const lH = ((legHeight - 700) / 350) * 100;
  const lW = ((legWidth - 40) / 80) * 100;
  const lF = (legFlare / 15) * 100;
  const lI = (legInset / 200) * 100;
  const aH = ((apronHeight - 40) / 80) * 100;
  const met = metalness * 100;
  const rou = roughness * 100;

  // ── Original Dimension mapping (re-normalized 0-100 → scene units) ──
  const L   = 0.85 + (tL / 100) * 1.50;  // 0.85 … 2.35  tabletop length (X)
  const W   = 0.65 + (tW / 100) * 1.10;  // 0.65 … 1.75  tabletop width  (Z)
  const LH  = 0.38 + (lH / 100) * 0.58;  // 0.38 … 0.96  leg height
  const LW  = 0.018 + (lW / 100) * 0.052; // 0.018 … 0.07 leg cross-section
  const INS = LW * 0.5 + (lI / 100) * 0.14; // inset from table edge
  const FLARE = (lF / 100) * 0.13;          // 0 … 0.13 rad outward tilt
  const AH  = 0.038 + (aH / 100) * 0.105; // 0.038 … 0.143 apron height
  const CR  = (cR / 100) * Math.min(L, W) * 0.14; // 0 … ~0.13 corner R
  const TT  = 0.030; // table-top thickness (fixed)

  const color = useMemo(() => {
    if (materialCategory === 'wood') {
      return hslToHex(25, 40, 25 + (colorHue / 360) * 30); // Brownish range
    }
    if (materialCategory === 'slate') {
      return hslToHex(colorHue, 5, 20); // Darker, desaturated
    }
    return hslToHex(colorHue, 70, 50);
  }, [colorHue, materialCategory]);
  
  const material = useMemo(() => {
    let m = 0, r = 0.5;
    if (materialCategory === 'anodized') {
      m = 0.85 + (met / 100) * 0.15;
      r = 0.1 + (rou / 100) * 0.3;
    } else if (materialCategory === 'wood') {
      m = 0;
      r = 0.6 + (rou / 100) * 0.4;
    } else if (materialCategory === 'slate') {
      m = 0.1;
      r = 0.8 + (rou / 100) * 0.2;
    }

    return new THREE.MeshStandardMaterial({
      color,
      metalness: m,
      roughness: r,
    });
  }, [color, materialCategory, met, rou]);

  const topShape = useMemo(() => roundedRectShape(L, W, CR), [L, W, CR]);
  const topGeo = useMemo(() => new THREE.ExtrudeGeometry(topShape, {
    depth: TT,
    bevelEnabled: CR > 0.004,
    bevelSize: 0.006,
    bevelThickness: 0.005,
    bevelSegments: 3,
    steps: 1,
  }), [topShape, TT, CR]);

  const legX = L / 2 - INS;
  const legZ = W / 2 - INS;
  const corners: [number, number][] = [
    [ legX,  legZ],
    [-legX,  legZ],
    [-legX, -legZ],
    [ legX, -legZ],
  ];

  const apronY   = -(AH / 2 + 0.004);
  const apronT   = Math.max(LW * 0.75, 0.012);  // apron face thickness
  const fbLen    = Math.max(0.01, L - 2 * INS);  // front/back rail length
  const lrLen    = Math.max(0.01, W - 2 * INS);  // left/right rail length

  return (
    <group 
      position={[0, LH, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Table Top */}
      <mesh 
        geometry={topGeo} 
        material={material} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        castShadow 
        receiveShadow 
      >
        {hovered && <Outlines thickness={0.01} color="white" />}
      </mesh>

      {/* Legs */}
      {corners.map(([cx, cz], i) => (
        <mesh 
          key={i} 
          position={[cx, -LH / 2, cz]} 
          rotation={[
            FLARE > 0.001 ? Math.sign(cz) * FLARE : 0,
            0,
            FLARE > 0.001 ? -Math.sign(cx) * FLARE : 0
          ]}
          material={material}
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[LW, LH, LW]} />
          {hovered && <Outlines thickness={0.01} color="white" />}
        </mesh>
      ))}

      {/* Apron rails */}
      <mesh position={[0, apronY, legZ]} material={material} castShadow receiveShadow>
        <boxGeometry args={[fbLen, AH, apronT]} />
        {hovered && <Outlines thickness={0.01} color="white" />}
      </mesh>
      <mesh position={[0, apronY, -legZ]} material={material} castShadow receiveShadow>
        <boxGeometry args={[fbLen, AH, apronT]} />
        {hovered && <Outlines thickness={0.01} color="white" />}
      </mesh>

      <mesh position={[legX, apronY, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[apronT, AH, lrLen]} />
        {hovered && <Outlines thickness={0.01} color="white" />}
      </mesh>
      <mesh position={[-legX, apronY, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[apronT, AH, lrLen]} />
        {hovered && <Outlines thickness={0.01} color="white" />}
      </mesh>
    </group>
  );
};
