import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  GLOBAL_HUBS,
  GlobalHub,
  evaluateBilateralCorridor,
  BilateralVisaTelemetry,
  latLonToVector3
} from '../lib/mobility-data.js';
import { LocationDetectorButton } from './LocationDetectorButton.js';
import {
  Compass,
  Plane,
  Clock,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GLOBE_RADIUS = 5;

export const MobilityGlobe3D: React.FC<{
  initialOriginId?: string;
  initialDestId?: string;
  onSelectCorridor?: (telemetry: BilateralVisaTelemetry) => void;
}> = ({ initialOriginId = 'nyc', initialDestId = 'tyo', onSelectCorridor }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [originHub, setOriginHub] = useState<GlobalHub>(() => {
    return GLOBAL_HUBS.find((h) => h.id === initialOriginId) || GLOBAL_HUBS[0];
  });
  const [destHub, setDestHub] = useState<GlobalHub>(() => {
    return GLOBAL_HUBS.find((h) => h.id === initialDestId) || GLOBAL_HUBS[3];
  });

  const [hoveredHub, setHoveredHub] = useState<GlobalHub | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Compute telemetry
  const telemetry = useMemo(() => {
    const res = evaluateBilateralCorridor(originHub, destHub);
    if (onSelectCorridor) onSelectCorridor(res);
    return res;
  }, [originHub, destHub]);

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const arcMeshRef = useRef<THREE.Line | null>(null);
  const pulseMeshRef = useRef<THREE.Mesh | null>(null);
  const originMarkerRef = useRef<THREE.Mesh | null>(null);
  const destMarkerRef = useRef<THREE.Mesh | null>(null);

  // Screen-space projected hub labels
  const [hubScreenPositions, setHubScreenPositions] = useState<
    Array<{ hub: GlobalHub; x: number; y: number; visible: boolean }>
  >([]);

  // Procedural continental landmass canvas texture
  const createProceduralEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep luxury aerospace navy space ocean
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle coordinate lat/long lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Procedural continental landmass blobs (North America, South America, Eurasia, Africa, Australia)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;

    // Helper to draw smoothed land polygon
    const drawLand = (coords: Array<[number, number]>) => {
      ctx.beginPath();
      coords.forEach(([lon, lat], i) => {
        const px = ((lon + 180) / 360) * canvas.width;
        const py = ((90 - lat) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // North America
    drawLand([
      [-168, 65], [-140, 70], [-100, 75], [-60, 60], [-55, 45],
      [-75, 35], [-80, 25], [-97, 18], [-105, 23], [-120, 35],
      [-125, 48], [-160, 58], [-168, 65]
    ]);

    // South America
    drawLand([
      [-80, 10], [-60, 5], [-35, -5], [-38, -20], [-55, -40],
      [-68, -55], [-75, -45], [-72, -20], [-80, -2], [-80, 10]
    ]);

    // Europe & Russia/Asia
    drawLand([
      [-10, 36], [0, 43], [15, 38], [28, 41], [30, 30],
      [40, 30], [55, 25], [60, 25], [75, 10], [80, 15],
      [90, 22], [105, 10], [115, 20], [120, 32], [130, 42],
      [140, 50], [170, 65], [140, 72], [90, 75], [40, 70],
      [10, 60], [-5, 58], [-10, 36]
    ]);

    // Africa
    drawLand([
      [-15, 12], [-5, 36], [10, 37], [32, 31], [43, 12],
      [51, 10], [40, -10], [32, -28], [20, -34], [18, -34],
      [12, -15], [0, 5], [-15, 12]
    ]);

    // Australia
    drawLand([
      [114, -22], [125, -15], [135, -12], [148, -20], [153, -28],
      [150, -38], [140, -38], [130, -32], [115, -34], [114, -22]
    ]);

    // Japan archipelago
    drawLand([
      [130, 31], [136, 35], [141, 38], [145, 44], [140, 45],
      [135, 40], [130, 33], [130, 31]
    ]);

    // United Kingdom & Ireland
    drawLand([
      [-10, 52], [-5, 50], [2, 52], [0, 58], [-5, 59],
      [-6, 55], [-10, 52]
    ]);

    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.5);
    dirLight1.position.set(10, 10, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 1.8);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    // 5. Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 180;
      starPos[i + 1] = (Math.random() - 0.5) * 180;
      starPos[i + 2] = (Math.random() - 0.5) * 180;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.5,
      transparent: true,
      opacity: 0.6
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 6. Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Base Sphere with Procedural Continental Texture
    const earthTexture = createProceduralEarthTexture();
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x06b6d4),
      shininess: 15
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Outer Atmospheric Glowing Halo
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.05, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.02, 0.71, 0.83, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // City Hub Nodes (Glowing Spheres & Beacons)
    const hubMarkersGroup = new THREE.Group();
    GLOBAL_HUBS.forEach((hub) => {
      const [x, y, z] = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS);
      const dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, y, z);
      dot.userData = { hub };
      hubMarkersGroup.add(dot);

      // Vertical beacon line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x * 1.04, y * 1.04, z * 1.04)
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
      const beaconLine = new THREE.Line(lineGeo, lineMat);
      hubMarkersGroup.add(beaconLine);
    });
    globeGroup.add(hubMarkersGroup);

    // Origin and Destination Radar Pulse Rings
    const originRingGeo = new THREE.RingGeometry(0.12, 0.18, 32);
    const originRingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide });
    const originMarker = new THREE.Mesh(originRingGeo, originRingMat);
    originMarkerRef.current = originMarker;
    globeGroup.add(originMarker);

    const destRingGeo = new THREE.RingGeometry(0.12, 0.18, 32);
    const destRingMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
    const destMarker = new THREE.Mesh(destRingGeo, destRingMat);
    destMarkerRef.current = destMarker;
    globeGroup.add(destMarker);

    // Moving comet pulse travelling along arc
    const pulseGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMeshRef.current = pulseMesh;
    globeGroup.add(pulseMesh);

    // Interaction State
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let rotVelocity = { x: 0.0015, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsAutoRotating(false);
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      rotVelocity = { x: deltaX * 0.005, y: deltaY * 0.005 };
      globeGroup.rotation.y += rotVelocity.x;
      globeGroup.rotation.x += rotVelocity.y;

      // Clamp vertical rotation
      globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(8, Math.min(24, camera.position.z));
    };

    // Touch support for mobile devices
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsAutoRotating(false);
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;
        globeGroup.rotation.y += deltaX * 0.005;
        globeGroup.rotation.x += deltaY * 0.005;
        globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = touchStartDist - dist;
        camera.position.z += delta * 0.02;
        camera.position.z = Math.max(8, Math.min(24, camera.position.z));
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize handling
    const onResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    let arcProgress = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow idle rotation when user is not dragging
      if (!isDragging) {
        rotVelocity.x *= 0.95;
        rotVelocity.y *= 0.95;
        globeGroup.rotation.y += rotVelocity.x;
        globeGroup.rotation.x += rotVelocity.y;

        if (Math.abs(rotVelocity.x) < 0.0005 && isAutoRotating) {
          globeGroup.rotation.y += 0.0012;
        }
      }

      // Animate moving comet pulse along great-circle arc
      if (pulseMeshRef.current && arcMeshRef.current?.geometry) {
        arcProgress = (arcProgress + 0.008) % 1;
        const curve = arcMeshRef.current.userData.curve as THREE.CubicBezierCurve3;
        if (curve) {
          const point = curve.getPoint(arcProgress);
          pulseMeshRef.current.position.copy(point);
        }
      }

      // Rotate atmosphere halo slowly
      haloMesh.rotation.y += 0.0004;

      renderer.render(scene, camera);

      // Project hub labels into 2D screen space
      if (camera && container) {
        const positions: Array<{ hub: GlobalHub; x: number; y: number; visible: boolean }> = [];
        const camPos = camera.position.clone();

        GLOBAL_HUBS.forEach((hub) => {
          const [hx, hy, hz] = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS);
          const worldPoint = new THREE.Vector3(hx, hy, hz).applyMatrix4(globeGroup.matrixWorld);

          // Check if point is on the visible front hemisphere
          const normal = worldPoint.clone().sub(globeGroup.position).normalize();
          const viewDir = camPos.clone().sub(worldPoint).normalize();
          const dot = normal.dot(viewDir);

          if (dot > 0.15) {
            const projected = worldPoint.project(camera);
            const sx = ((projected.x + 1) / 2) * container.clientWidth;
            const sy = ((-projected.y + 1) / 2) * container.clientHeight;
            positions.push({ hub, x: sx, y: sy, visible: true });
          } else {
            positions.push({ hub, x: 0, y: 0, visible: false });
          }
        });
        setHubScreenPositions(positions);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, []);

  // Update 3D Great-Circle Flight Corridor Arc when Origin or Destination changes
  useEffect(() => {
    if (!globeGroupRef.current) return;
    const globe = globeGroupRef.current;

    // Remove old arc if present
    if (arcMeshRef.current) {
      globe.remove(arcMeshRef.current);
      arcMeshRef.current.geometry.dispose();
      arcMeshRef.current = null;
    }

    const [ox, oy, oz] = latLonToVector3(originHub.lat, originHub.lon, GLOBE_RADIUS);
    const [dx, dy, dz] = latLonToVector3(destHub.lat, destHub.lon, GLOBE_RADIUS);

    const vOrigin = new THREE.Vector3(ox, oy, oz);
    const vDest = new THREE.Vector3(dx, dy, dz);

    // Compute great-circle mid-point lifted off the surface proportional to distance
    const distance = vOrigin.distanceTo(vDest);
    const liftHeight = GLOBE_RADIUS + Math.min(distance * 0.45, 2.5);

    const vMid = vOrigin.clone().add(vDest).multiplyScalar(0.5).normalize().multiplyScalar(liftHeight);

    // Quadratic / Cubic curve points
    const curve = new THREE.QuadraticBezierCurve3(vOrigin, vMid, vDest);
    const points = curve.getPoints(60);

    // Build glowing neon arc line
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    arcLine.userData = { curve };
    arcMeshRef.current = arcLine;
    globe.add(arcLine);

    // Position origin marker ring
    if (originMarkerRef.current) {
      originMarkerRef.current.position.set(ox, oy, oz);
      originMarkerRef.current.lookAt(vOrigin.clone().multiplyScalar(2));
    }

    // Position destination marker ring
    if (destMarkerRef.current) {
      destMarkerRef.current.position.set(dx, dy, dz);
      destMarkerRef.current.lookAt(vDest.clone().multiplyScalar(2));
    }

    // Auto rotate globe to center the flight corridor
    const corridorCenter = vOrigin.clone().add(vDest).multiplyScalar(0.5).normalize();
    const targetAngleY = Math.atan2(corridorCenter.x, corridorCenter.z);
    globe.rotation.y = -targetAngleY;
  }, [originHub, destHub]);

  const handleResetCamera = () => {
    if (globeGroupRef.current && cameraRef.current) {
      globeGroupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 0, 15);
      setIsAutoRotating(true);
    }
  };

  return (
    <div className="relative w-full h-[620px] md:h-[750px] bg-radial-gradient from-navy-900 via-navy-950 to-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-0" />

      {/* Screen-Space Country & Hub Nomenclature Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {hubScreenPositions.map(({ hub, x, y, visible }) => {
          if (!visible) return null;
          const isOrigin = hub.id === originHub.id;
          const isDest = hub.id === destHub.id;
          const isSelected = isOrigin || isDest;

          return (
            <div
              key={hub.id}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0)`,
                opacity: isSelected ? 1 : 0.75
              }}
              className="absolute -translate-x-1/2 -translate-y-full mb-1 flex flex-col items-center pointer-events-auto transition-opacity"
              onMouseEnter={() => setHoveredHub(hub)}
              onMouseLeave={() => setHoveredHub(null)}
            >
              <button
                type="button"
                onClick={() => setDestHub(hub)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border shadow-lg transition-transform hover:scale-110 flex items-center gap-1 ${
                  isOrigin
                    ? 'bg-cyan-500 text-navy-950 border-cyan-300 shadow-glow-cyan'
                    : isDest
                    ? 'bg-purple-600 text-white border-purple-400 shadow-glow-indigo'
                    : 'bg-navy-950/80 backdrop-blur-sm text-slate-300 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{hub.name.split(' ')[0]}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Futuristic Floating Header Telemetry Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-navy-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            3D Global Mobility Radar
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Three.js WebGL
          </span>
        </div>

        {/* Action Controls (Reset View, Auto-rotate) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all ${
              isAutoRotating
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-navy-950/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAutoRotating ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF'}
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-navy-950/80 backdrop-blur-md text-slate-400 hover:text-white border border-slate-800 transition-all"
            title="Reset Globe Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Point-to-Point Corridor Selector & Bilateral Intelligence Floating Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto bg-navy-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4 pointer-events-auto">
          {/* Corridor Selectors Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            {/* Origin Hub Selector */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Origin / Passport
                </label>
                <LocationDetectorButton
                  variant="compact"
                  label="Detect GPS"
                  onLocationDetected={(_text, data) => {
                    const matched = GLOBAL_HUBS.find(
                      (h) =>
                        h.country.toLowerCase() === data.country.toLowerCase() ||
                        h.name.toLowerCase().includes(data.city.toLowerCase())
                    );
                    if (matched) setOriginHub(matched);
                  }}
                />
              </div>
              <select
                value={originHub.id}
                onChange={(e) => {
                  const found = GLOBAL_HUBS.find((h) => h.id === e.target.value);
                  if (found) setOriginHub(found);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                {GLOBAL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Interchange Arrow */}
            <div className="hidden md:flex items-center justify-center pb-2">
              <button
                type="button"
                onClick={() => {
                  const temp = originHub;
                  setOriginHub(destHub);
                  setDestHub(temp);
                }}
                className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all hover:rotate-180 duration-300"
                title="Swap Origin and Destination"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Hub Selector */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Destination Territory
              </label>
              <select
                value={destHub.id}
                onChange={(e) => {
                  const found = GLOBAL_HUBS.find((h) => h.id === e.target.value);
                  if (found) setDestHub(found);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {GLOBAL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Telemetry & Immigration Cross-Reference Grid */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Visa Policy Status */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Immigration Protocol</span>
              <span
                className={`font-bold inline-flex items-center gap-1 ${
                  telemetry.visaStatus === 'Visa Free'
                    ? 'text-emerald-400'
                    : telemetry.visaStatus === 'eVisa / ETA'
                    ? 'text-cyan-400'
                    : telemetry.visaStatus === 'Visa on Arrival'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{telemetry.visaStatus}</span>
              </span>
            </div>

            {/* Permitted Stay */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Permitted Window</span>
              <span className="font-bold text-white block truncate">{telemetry.allowedStay}</span>
            </div>

            {/* Great-Circle Flight Distance */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Great-Circle Arc</span>
              <span className="font-bold text-slate-200">
                {telemetry.distanceKm.toLocaleString()} km{' '}
                <span className="text-slate-500 text-[10px]">({telemetry.distanceNauticalMiles} nm)</span>
              </span>
            </div>

            {/* Flight Duration */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Est. Flight Duration</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>~{telemetry.estimatedFlightHours} Hours</span>
              </span>
            </div>
          </div>

          {/* Quick-Action Routing Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{telemetry.advisoryNote}</span>
            </p>
            <div className="flex items-center gap-2">
              <Link
                to={`/visa-checker?destination=${encodeURIComponent(destHub.country)}`}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1 transition-all"
              >
                <span>Visa Wizard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to={`/itinerary`}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-semibold flex items-center gap-1 transition-all"
              >
                <span>Plan Route</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
