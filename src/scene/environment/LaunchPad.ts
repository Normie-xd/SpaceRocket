/**
 * Launch Complex 3D Environment & Ground Launch Pad
 * 
 * Generates an aerospace launch complex at scale:
 * - Reinforced concrete launch deck platform
 * - Flame trench exhaust deflector
 * - Umbilical service gantry tower with swing arms
 * - Launch mount support clamps
 * - Textured ground terrain around the launch site
 */

import * as THREE from 'three';

export function createLaunchPad(): THREE.Group {
  const padGroup = new THREE.Group();

  // 1. Terrain Ground Base (Concrete / Desert apron)
  const groundGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  padGroup.add(ground);

  // 2. Main Launch Mount Table (Circular concrete platform)
  const mountTableGeo = new THREE.CylinderGeometry(14, 18, 4, 32);
  const mountTableMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d45,
    roughness: 0.8,
    metalness: 0.2
  });
  const mountTable = new THREE.Mesh(mountTableGeo, mountTableMat);
  mountTable.position.y = 2.0;
  mountTable.castShadow = true;
  mountTable.receiveShadow = true;
  padGroup.add(mountTable);

  // Center flame exhaust opening
  const openingGeo = new THREE.CylinderGeometry(6, 6, 4.2, 24);
  const openingMat = new THREE.MeshStandardMaterial({
    color: 0x111115,
    roughness: 0.95
  });
  const opening = new THREE.Mesh(openingGeo, openingMat);
  opening.position.y = 2.0;
  padGroup.add(opening);

  // 3. Flame Deflector Trench (under the table)
  const trenchGeo = new THREE.BoxGeometry(10, 4, 30);
  const trenchMat = new THREE.MeshStandardMaterial({
    color: 0x1f2024,
    roughness: 0.9
  });
  const trench = new THREE.Mesh(trenchGeo, trenchMat);
  trench.position.set(0, 0.5, 12);
  trench.rotation.x = 0.1;
  padGroup.add(trench);

  // 4. Umbilical Service Tower (Steel lattice structure)
  const towerHeight = 70;
  const towerWidth = 5;
  const towerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerWidth);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x88929a,
    roughness: 0.5,
    metalness: 0.8,
    wireframe: false
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(-16, towerHeight / 2, 0);
  tower.castShadow = true;
  tower.receiveShadow = true;
  padGroup.add(tower);

  // Umbilical swing arms reaching to rocket
  const armGeo = new THREE.BoxGeometry(12, 1.2, 1.5);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0xcc5533, // High-visibility safety orange
    roughness: 0.6,
    metalness: 0.5
  });

  // Lower umbilical arm
  const arm1 = new THREE.Mesh(armGeo, armMat);
  arm1.position.set(-9, 18, 0);
  padGroup.add(arm1);

  // Upper stage crew / payload access arm
  const arm2 = new THREE.Mesh(armGeo, armMat);
  arm2.position.set(-9, 52, 0);
  padGroup.add(arm2);

  // 5. Four Hold-Down Support Clamps on the pad table
  const clampGeo = new THREE.BoxGeometry(1.2, 2.5, 1.8);
  const clampMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00, // Warning yellow
    roughness: 0.4,
    metalness: 0.6
  });

  const clampDist = 4.5;
  const clampPositions = [
    [clampDist, 4.5, 0],
    [-clampDist, 4.5, 0],
    [0, 4.5, clampDist],
    [0, 4.5, -clampDist]
  ];

  for (const pos of clampPositions) {
    const clamp = new THREE.Mesh(clampGeo, clampMat);
    clamp.position.set(pos[0], pos[1], pos[2]);
    clamp.castShadow = true;
    padGroup.add(clamp);
  }

  // 6. Perimeter floodlights
  const lightPoleGeo = new THREE.CylinderGeometry(0.2, 0.3, 16, 8);
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8 });

  const lightDist = 45;
  const lightCoords = [
    [lightDist, lightDist],
    [-lightDist, lightDist],
    [lightDist, -lightDist],
    [-lightDist, -lightDist]
  ];

  for (const [lx, lz] of lightCoords) {
    const pole = new THREE.Mesh(lightPoleGeo, lightPoleMat);
    pole.position.set(lx, 8, lz);
    padGroup.add(pole);

    const floodlight = new THREE.SpotLight(0xffeedd, 5.0, 120, Math.PI / 4, 0.4);
    floodlight.position.set(lx, 16, lz);
    floodlight.target = mountTable;
    padGroup.add(floodlight);
  }

  return padGroup;
}
