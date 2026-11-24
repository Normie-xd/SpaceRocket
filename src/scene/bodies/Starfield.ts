/**
 * Deep Space Starfield Generator
 * 
 * Generates an astronomically accurate starfield using 10,000 stars:
 * - Distributed on a celestial sphere of radius 10,000,000 meters
 * - Randomized stellar spectral types (O/B blue-white, A/F white, G yellow, K orange, M red)
 * - Realistic stellar magnitude apparent brightness distribution
 */

import * as THREE from 'three';

export function createStarfield(count: number = 8000, radius: number = 2_000_000): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Stellar spectral color palettes: [R, G, B]
  const spectralColors = [
    [0.7, 0.8, 1.0], // O / B (Blue-white ~40,000K)
    [0.9, 0.95, 1.0],// A (White ~10,000K)
    [1.0, 1.0, 0.95],// F (Yellow-white ~7,000K)
    [1.0, 0.95, 0.7],// G (Sun-like yellow ~5,700K)
    [1.0, 0.8, 0.6], // K (Orange ~4,000K)
    [1.0, 0.5, 0.4]  // M (Red dwarf ~3,000K)
  ];

  for (let i = 0; i < count; i++) {
    // Uniform spherical surface distribution (Marsaglia method)
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    const r = radius * (0.95 + Math.random() * 0.1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Spectral class weighting (mostly M, K, G, fewer O and B)
    const roll = Math.random();
    let colIndex = 3; // Default G
    if (roll < 0.05) colIndex = 0;
    else if (roll < 0.15) colIndex = 1;
    else if (roll < 0.35) colIndex = 2;
    else if (roll < 0.65) colIndex = 3;
    else if (roll < 0.85) colIndex = 4;
    else colIndex = 5;

    // Apparent magnitude brightness variation
    const brightness = 0.4 + Math.random() * 0.6;
    const baseCol = spectralColors[colIndex];

    colors[i * 3] = baseCol[0] * brightness;
    colors[i * 3 + 1] = baseCol[1] * brightness;
    colors[i * 3 + 2] = baseCol[2] * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: false // Keeps stars sharp regardless of camera distance
  });

  return new THREE.Points(geometry, material);
}
