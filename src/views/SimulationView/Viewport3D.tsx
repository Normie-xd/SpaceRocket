import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneManager, type CameraMode } from '../../scene/SceneManager';
import { createStarfield } from '../../scene/bodies/Starfield';
import { EarthMesh } from '../../scene/bodies/Earth';
import { createLaunchPad } from '../../scene/environment/LaunchPad';
import { buildProceduralRocketMesh, type RocketMeshResult } from '../../scene/rocket/ProceduralRocketMesh';
import type { RocketDesign } from '../../types/rocket';

interface Viewport3DProps {
  design: RocketDesign;
  rocketAltitude?: number; // meters above ground
  rocketPitchDeg?: number;
  rocketYawDeg?: number;
  rocketRollDeg?: number;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  design,
  rocketAltitude = 0,
  rocketPitchDeg = 0,
  rocketYawDeg = 0,
  rocketRollDeg = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const rocketMeshRef = useRef<RocketMeshResult | null>(null);
  const earthRef = useRef<EarthMesh | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Initialize SceneManager
    const sm = new SceneManager({
      canvas: canvasRef.current,
      width,
      height
    });
    sceneManagerRef.current = sm;

    // 2. Add Deep Space Starfield
    const starfield = createStarfield(6000, 100_000);
    sm.scene.add(starfield);

    // 3. Add Launch Pad at ground level (Y = 0)
    const launchPad = createLaunchPad();
    sm.scene.add(launchPad);

    // 4. Add Earth (positioned below the launch pad so surface is at Y = 0)
    // Scale Earth down visually for simulation rendering consistency
    const earthVisualRadius = 20_000;
    const earth = new EarthMesh({ radius: earthVisualRadius });
    earth.group.position.set(0, -earthVisualRadius, 0);
    sm.scene.add(earth.group);
    earthRef.current = earth;

    // 5. Build Procedural Rocket Mesh
    const rocket = buildProceduralRocketMesh(design);
    // Base of rocket on the launch pad table (Y = 4.0m)
    rocket.group.position.set(0, 4.0, 0);
    sm.scene.add(rocket.group);
    rocketMeshRef.current = rocket;

    // Set camera target to rocket center
    sm.setTargetPosition(new THREE.Vector3(0, rocket.totalHeight * 0.5 + 4.0, 0));
    sm.orbitRadius = rocket.totalHeight * 1.8;

    // Hook render loop
    sm.onRender((delta) => {
      earth.update(delta);
    });

    sm.startRenderLoop();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      sm.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sm.dispose();
    };
  }, [design]);

  // Handle dynamic simulation telemetry updates (Altitude, Pitch, Roll)
  useEffect(() => {
    if (!rocketMeshRef.current || !sceneManagerRef.current) return;
    const rocket = rocketMeshRef.current;
    const sm = sceneManagerRef.current;

    // Update rocket 3D position
    const yPos = 4.0 + rocketAltitude;
    rocket.group.position.y = yPos;

    // Update attitude rotation (Euler degrees)
    const rad = Math.PI / 180.0;
    rocket.group.rotation.x = rocketPitchDeg * rad;
    rocket.group.rotation.y = rocketYawDeg * rad;
    rocket.group.rotation.z = rocketRollDeg * rad;

    // Target camera at rocket
    sm.setTargetPosition(new THREE.Vector3(0, yPos + rocket.totalHeight * 0.5, 0));
  }, [rocketAltitude, rocketPitchDeg, rocketYawDeg, rocketRollDeg]);

  const handleCameraChange = (mode: CameraMode) => {
    setCameraMode(mode);
    sceneManagerRef.current?.setCameraMode(mode);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Floating 3D Camera Overlay Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 6,
          background: 'rgba(15, 15, 26, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '6px 8px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}
      >
        <button
          className={cameraMode === 'orbit' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => handleCameraChange('orbit')}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          Orbit 360°
        </button>
        <button
          className={cameraMode === 'follow' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => handleCameraChange('follow')}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          Follow Rocket
        </button>
        <button
          className={cameraMode === 'launchpad' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => handleCameraChange('launchpad')}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          Launch Pad
        </button>
      </div>
    </div>
  );
};
