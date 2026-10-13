import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, RotateCw, Plane, ShieldCheck, Sparkles } from 'lucide-react';

interface FlightHub {
  name: string;
  lat: number;
  lng: number;
  country: string;
  status: string;
}

const HUBS: FlightHub[] = [
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan', status: 'Visa Free / eVisa' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom', status: 'ETA Clearance' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'United States', status: 'ESTA Protocol' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France (Schengen)', status: 'Schengen 90/180' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore', status: 'SG Arrival Card' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'UAE', status: 'VoA / 30-Day Entry' },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, country: 'India', status: 'Consular Origin' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia', status: 'eVisitor Stream' }
];

const FLIGHT_PAIRS: [number, number][] = [
  [0, 1], // Tokyo - London
  [1, 2], // London - New York
  [3, 5], // Paris - Dubai
  [6, 4], // New Delhi - Singapore
  [4, 7], // Singapore - Sydney
  [2, 3], // New York - Paris
  [6, 0]  // New Delhi - Tokyo
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const ThreeGlobe: React.FC<{
  onSelectHub?: (hub: FlightHub) => void;
  className?: string;
}> = ({ onSelectHub, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHub, setActiveHub] = useState<FlightHub>(HUBS[0]);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeRadius = 75;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 2. Base Dark Sphere
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x050b18,
      transparent: true,
      opacity: 0.92
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // 3. Glowing Atmosphere Shell
    const glowGeo = new THREE.SphereGeometry(globeRadius * 1.08, 40, 40);
    const glowMat = new THREE.ShaderMaterial({
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.06, 0.72, 0.95, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    globeGroup.add(glowMesh);

    // 4. Dot Grid / Continent Matrix Particles
    const dotCount = 1400;
    const dotPositions: number[] = [];
    const dotColors: number[] = [];
    const colorCyan = new THREE.Color(0x38bdf8);
    const colorIndigo = new THREE.Color(0x818cf8);

    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / dotCount);
      const theta = Math.sqrt(dotCount * Math.PI) * phi;
      const x = globeRadius * Math.cos(theta) * Math.sin(phi);
      const y = globeRadius * Math.sin(theta) * Math.sin(phi);
      const z = globeRadius * Math.cos(phi);

      // Procedural continents noise filtering
      const n = Math.sin(x * 0.08) * Math.cos(y * 0.08) + Math.sin(z * 0.08);
      if (n > -0.2) {
        dotPositions.push(x, y, z);
        const col = Math.random() > 0.4 ? colorCyan : colorIndigo;
        dotColors.push(col.r, col.g, col.b);
      }
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));
    const dotMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const dotsMesh = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotsMesh);

    // 5. Latitude & Longitude Thin Wireframe Rings
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.25
    });
    for (let lat = -60; lat <= 60; lat += 30) {
      const ringRadius = globeRadius * Math.cos((lat * Math.PI) / 180);
      const ringY = globeRadius * Math.sin((lat * Math.PI) / 180);
      const ringGeo = new THREE.BufferGeometry();
      const ringPoints: THREE.Vector3[] = [];
      for (let a = 0; a <= 64; a++) {
        const rad = (a / 64) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(rad) * ringRadius, ringY, Math.sin(rad) * ringRadius));
      }
      ringGeo.setFromPoints(ringPoints);
      const ring = new THREE.Line(ringGeo, ringMat);
      globeGroup.add(ring);
    }

    // 6. Hub Pins & Beacons
    const hubPositions = HUBS.map((h) => latLngToVector3(h.lat, h.lng, globeRadius));
    const pinGeo = new THREE.SphereGeometry(1.6, 12, 12);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beaconRings: THREE.Mesh[] = [];

    hubPositions.forEach((pos) => {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      globeGroup.add(pin);

      const beaconGeo = new THREE.RingGeometry(1.2, 2.8, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos.clone().multiplyScalar(1.01));
      beacon.lookAt(pos.clone().multiplyScalar(2));
      globeGroup.add(beacon);
      beaconRings.push(beacon);
    });

    // 7. 3D Flight Arcs
    const arcLines: THREE.Line[] = [];
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.7,
      linewidth: 1
    });

    FLIGHT_PAIRS.forEach(([fromIdx, toIdx]) => {
      const start = hubPositions[fromIdx];
      const end = hubPositions[toIdx];

      // Calculate 3D mid-point lifted above globe
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      const altitude = globeRadius * 1.25 + dist * 0.18;
      mid.normalize().multiplyScalar(altitude);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(45);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arc = new THREE.Line(curveGeo, arcMaterial);
      globeGroup.add(arc);
      arcLines.push(arc);
    });

    // Interactive Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      rotationVelocityY = deltaX * 0.005;
      rotationVelocityX = deltaY * 0.005;
      targetRotationY += rotationVelocityY;
      targetRotationX += rotationVelocityX;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    domElement.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    domElement.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous rotation when idle
      if (!isDragging && isRotating) {
        targetRotationY += 0.0025;
      }

      // Smooth dampening
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;
      targetRotationX = Math.max(-1.2, Math.min(1.2, targetRotationX));

      // Pulse beacon rings
      beaconRings.forEach((b, i) => {
        const scale = 1 + Math.sin(elapsed * 3 + i) * 0.3;
        b.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('touchstart', onPointerDown);
      domElement.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  const handleSelectHub = (hub: FlightHub) => {
    setActiveHub(hub);
    if (onSelectHub) {
      onSelectHub(hub);
    }
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-navy-900/90 via-navy-950/95 to-navy-950 border border-slate-800/80 shadow-2xl backdrop-blur-xl ${className}`}>
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[440px] sm:h-[500px] cursor-grab active:cursor-grabbing relative select-none"
      />

      {/* Top Floating Holographic Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass-card px-3.5 py-1.5 border-cyan-500/30 flex items-center gap-2 pointer-events-auto bg-navy-950/70 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-semibold text-cyan-300">
            3D Global Mobility Matrix
          </span>
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className="glass-card p-2 border-slate-700/60 text-slate-300 hover:text-cyan-300 pointer-events-auto transition-colors flex items-center gap-1.5 text-xs bg-navy-950/70"
          title="Toggle Auto Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '6s' }} />
          <span className="hidden sm:inline font-mono text-[11px]">{isRotating ? 'Rotating' : 'Paused'}</span>
        </button>
      </div>

      {/* Floating Active Hub Telemetry Card */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xs pointer-events-auto">
        <div className="glass-card p-4 border-cyan-500/30 bg-navy-950/85 shadow-2xl space-y-2.5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} /> Active Destination Hub
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold font-mono">
              Live Verified
            </span>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <span>{activeHub.name}</span>
              <span className="text-xs font-normal text-slate-400">({activeHub.country})</span>
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeHub.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Quick-Target Hub Selector */}
      <div className="absolute bottom-4 right-4 hidden md:flex flex-wrap max-w-sm gap-1.5 justify-end pointer-events-auto">
        {HUBS.slice(0, 5).map((hub) => (
          <button
            key={hub.name}
            onClick={() => handleSelectHub(hub)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
              activeHub.name === hub.name
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-glow-cyan'
                : 'bg-navy-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {hub.name}
          </button>
        ))}
      </div>
    </div>
  );
};
