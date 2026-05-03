import * as THREE from 'three';
import { TableParameters } from '../store/useTableStore';
import { hslToHex, roundedRectShape } from '../components/ThreeViewer/TableModel';

export function createTableObject(parameters: TableParameters): THREE.Group {
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

  // Re-use logic from TableModel
  const tL = ((tableLength - 1200) / 1200) * 100;
  const tW = ((tableWidth - 600) / 600) * 100;
  const cR = (cornerRadius / 150) * 100;
  const lH = ((legHeight - 700) / 350) * 100;
  const lW = ((legWidth - 40) / 80) * 100;
  const lF = (legFlare / 15) * 100;
  const lI = (legInset / 200) * 100;
  const aH = ((apronHeight - 40) / 80) * 100;

  const L   = 0.85 + (tL / 100) * 1.50;
  const W   = 0.65 + (tW / 100) * 1.10;
  const LH  = 0.38 + (lH / 100) * 0.58;
  const LW  = 0.018 + (lW / 100) * 0.052;
  const INS = LW * 0.5 + (lI / 100) * 0.14;
  const FLARE = (lF / 100) * 0.13;
  const AH  = 0.038 + (aH / 100) * 0.105;
  const CR  = (cR / 100) * Math.min(L, W) * 0.14;
  const TT  = 0.030;

  let colorValue: number;
  if (materialCategory === 'wood') {
    colorValue = hslToHex(25, 40, 25 + (colorHue / 360) * 30);
  } else if (materialCategory === 'slate') {
    colorValue = hslToHex(colorHue, 5, 20);
  } else {
    colorValue = hslToHex(colorHue, 70, 50);
  }

  let m = 0, r = 0.5;
  if (materialCategory === 'anodized') {
    m = 0.85 + (metalness) * 0.15;
    r = 0.1 + (roughness) * 0.3;
  } else if (materialCategory === 'wood') {
    m = 0;
    r = 0.6 + (roughness) * 0.4;
  } else if (materialCategory === 'slate') {
    m = 0.1;
    r = 0.8 + (roughness) * 0.2;
  }

  const material = new THREE.MeshStandardMaterial({
    color: colorValue,
    metalness: m,
    roughness: r,
  });

  const group = new THREE.Group();
  group.position.y = LH;

  // Table Top
  const topShape = roundedRectShape(L, W, CR);
  const topGeo = new THREE.ExtrudeGeometry(topShape, {
    depth: TT,
    bevelEnabled: CR > 0.004,
    bevelSize: 0.006,
    bevelThickness: 0.005,
    bevelSegments: 3,
    steps: 1,
  });
  const topMesh = new THREE.Mesh(topGeo, material);
  topMesh.rotation.x = -Math.PI / 2;
  group.add(topMesh);

  // Legs
  const legX = L / 2 - INS;
  const legZ = W / 2 - INS;
  const corners: [number, number][] = [
    [ legX,  legZ],
    [-legX,  legZ],
    [-legX, -legZ],
    [ legX, -legZ],
  ];

  corners.forEach(([cx, cz]) => {
    const legGeo = new THREE.BoxGeometry(LW, LH, LW);
    const legMesh = new THREE.Mesh(legGeo, material);
    legMesh.position.set(cx, -LH / 2, cz);
    if (FLARE > 0.001) {
      legMesh.rotation.x = Math.sign(cz) * FLARE;
      legMesh.rotation.z = -Math.sign(cx) * FLARE;
    }
    group.add(legMesh);
  });

  // Apron rails
  const apronY = -(AH / 2 + 0.004);
  const apronT = Math.max(LW * 0.75, 0.012);
  const fbLen = Math.max(0.01, L - 2 * INS);
  const lrLen = Math.max(0.01, W - 2 * INS);

  const apronRails = [
    { pos: [0, apronY, legZ], args: [fbLen, AH, apronT] },
    { pos: [0, apronY, -legZ], args: [fbLen, AH, apronT] },
    { pos: [legX, apronY, 0], args: [apronT, AH, lrLen] },
    { pos: [-legX, apronY, 0], args: [apronT, AH, lrLen] },
  ];

  apronRails.forEach(rail => {
    const railGeo = new THREE.BoxGeometry(rail.args[0], rail.args[1], rail.args[2]);
    const railMesh = new THREE.Mesh(railGeo, material);
    railMesh.position.set(rail.pos[0], rail.pos[1], rail.pos[2]);
    group.add(railMesh);
  });

  return group;
}
