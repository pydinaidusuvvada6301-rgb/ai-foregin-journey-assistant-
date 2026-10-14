import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  CountryDirectoryItem,
  COUNTRIES,
  getCountryByCode,
  getCountryByName
} from '../lib/country-directory.js';
import {
  calculateGreatCircleDistance,
  BilateralVisaTelemetry
} from '../lib/mobility-data.js';
import {
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Compass,
  Sparkles,
  MapPin,
  ShieldCheck,
  Plane,
  AlertTriangle,
  Info
} from 'lucide-react';

const GLOBE_RADIUS = 5;
const ATMOSPHERE_FACTOR = 1.07;
const SAFETY_MARGIN = 1.28; // 28% padding ensures sphere + glow + markers never clip

/**
 * Calculates responsive camera distance so the complete Earth sphere fits horizontally and vertically
 */
export function calculateFitCameraDistance(
  width: number,
  height: number,
  vFovDegrees: number = 45
): number {
  if (width <= 0 || height <= 0) return 18;
  const aspect = width / height;
  const vFovRad = (vFovDegrees * Math.PI) / 180;
  const effectiveRadius = GLOBE_RADIUS * SAFETY_MARGIN;

  // Vertical fitting distance
  const distV = effectiveRadius / Math.tan(vFovRad / 2);

  // Horizontal fitting distance:
  // When aspect < 1 (mobile portrait), horizontal FOV is narrower than vertical FOV!
  // Visible horizontal span = 2 * dist * tan(vFov / 2) * aspect
  // To fit 2 * effectiveRadius horizontally: dist >= effectiveRadius / (aspect * tan(vFov / 2)) = distV / aspect
  const distH = distV / aspect;

  // Safe distance is maximum of vertical and horizontal requirements
  return Math.max(distV, distH);
}

/**
 * Converts spherical coordinates (lat, lon) to 3D Cartesian Vector3
 */
export function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

interface InteractiveEarthGlobe3DProps {
  selectedDestination?: CountryDirectoryItem | null;
  selectedOrigin?: CountryDirectoryItem | null;
  onSelectCountry?: (country: CountryDirectoryItem, role: 'destination' | 'origin') => void;
  className?: string;
}

export const InteractiveEarthGlobe3D: React.FC<InteractiveEarthGlobe3DProps> = ({
  selectedDestination,
  selectedOrigin,
  onSelectCountry,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // Default origin (e.g. USA or Australia) and destination (e.g. Australia or Japan)
  const defaultOrigin = useMemo(() => getCountryByCode('US') || COUNTRIES[0], []);
  const defaultDest = useMemo(() => getCountryByCode('AU') || COUNTRIES[10], []);

  const originCountry = selectedOrigin || defaultOrigin;
  const destCountry = selectedDestination || defaultDest;

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const arcMeshRef = useRef<THREE.Line | null>(null);
  const cometMeshRef = useRef<THREE.Mesh | null>(null);
  const originMarkerRef = useRef<THREE.Mesh | null>(null);
  const destMarkerRef = useRef<THREE.Mesh | null>(null);
  const arcPointsRef = useRef<THREE.Vector3[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Interactive camera & controls state
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isManualInteracting, setIsManualInteracting] = useState(false);
  const [webGLError, setWebGLError] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  // Calculate Great-Circle flight distance & hours
  const flightTelemetry = useMemo(() => {
    if (!originCountry || !destCountry) return null;
    const distanceKm = calculateGreatCircleDistance(
      originCountry.lat,
      originCountry.lon,
      destCountry.lat,
      destCountry.lon
    );
    const distanceNm = Math.round(distanceKm * 0.539957);
    const flightHours = parseFloat((distanceKm / 850 + 0.5).toFixed(1));

    return {
      distanceKm,
      distanceNm,
      flightHours
    };
  }, [originCountry, destCountry]);

  // Procedural Satellite Earth Texture with realistic blue oceans, green/brown continents & borders
  const createRealisticEarthTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Deep Ocean Base with Bathymetric Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#040b19'); // Polar deep
    oceanGrad.addColorStop(0.3, '#071739'); // Mid-latitude deep ocean
    oceanGrad.addColorStop(0.5, '#0a2558'); // Tropical azure
    oceanGrad.addColorStop(0.7, '#071739');
    oceanGrad.addColorStop(1, '#040b19');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Coordinate Latitude/Longitude Grid Lines
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

    // Equator and Tropics Highlight
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Helper: Draw continent with natural biome coloring (vegetation, arid desert, mountains)
    const drawBiomeLandmass = (
      coords: Array<[number, number]>,
      biomeType: 'temperate' | 'arid' | 'tropical' | 'polar' = 'temperate'
    ) => {
      ctx.beginPath();
      coords.forEach(([lon, lat], i) => {
        const px = ((lon + 180) / 360) * canvas.width;
        const py = ((90 - lat) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();

      // Biome-specific realistic gradient
      let fillCol = '#1e3a29'; // Default lush vegetation
      let strokeCol = 'rgba(52, 211, 153, 0.6)';

      if (biomeType === 'arid') {
        fillCol = '#453216'; // Saharan / Outback desert earth
        strokeCol = 'rgba(251, 191, 36, 0.6)';
      } else if (biomeType === 'tropical') {
        fillCol = '#144127'; // Amazon / Congo rainforest
        strokeCol = 'rgba(16, 185, 129, 0.7)';
      } else if (biomeType === 'polar') {
        fillCol = '#c7d2fe'; // Arctic / Antarctic ice
        strokeCol = 'rgba(224, 231, 255, 0.8)';
      }

      ctx.fillStyle = fillCol;
      ctx.fill();

      // Visible country / coastal borders
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // North America (Temperate & Arctic)
    drawBiomeLandmass([
      [-168, 65], [-140, 70], [-100, 75], [-60, 60], [-55, 45],
      [-75, 35], [-80, 25], [-97, 18], [-105, 23], [-120, 35],
      [-125, 48], [-160, 58], [-168, 65]
    ], 'temperate');

    // Greenland (Polar Ice Sheet)
    drawBiomeLandmass([
      [-50, 60], [-30, 65], [-20, 75], [-35, 83], [-55, 80], [-50, 60]
    ], 'polar');

    // South America (Tropical Amazon & Andes)
    drawBiomeLandmass([
      [-80, 10], [-60, 5], [-35, -5], [-38, -20], [-55, -40],
      [-68, -55], [-75, -45], [-72, -20], [-80, -2], [-80, 10]
    ], 'tropical');

    // Europe (Temperate plains & Scandinavia)
    drawBiomeLandmass([
      [-10, 36], [0, 43], [15, 38], [28, 41], [30, 30],
      [40, 30], [55, 25], [60, 25], [40, 70], [10, 60],
      [-5, 58], [-10, 36]
    ], 'temperate');

    // Scandinavia / Nordic
    drawBiomeLandmass([
      [5, 58], [15, 56], [22, 60], [28, 70], [18, 71], [10, 64], [5, 58]
    ], 'polar');

    // Northern & Central Asia (Siberia, Steppes, China)
    drawBiomeLandmass([
      [60, 25], [75, 10], [80, 15], [90, 22], [105, 10],
      [115, 20], [120, 32], [130, 42], [140, 50], [170, 65],
      [140, 72], [90, 75], [60, 70], [60, 25]
    ], 'temperate');

    // Africa (Sahara Desert & Savannas)
    drawBiomeLandmass([
      [-15, 12], [-5, 36], [10, 37], [32, 31], [43, 12],
      [51, 10], [40, -10], [32, -28], [20, -34], [18, -34],
      [12, -15], [0, 5], [-15, 12]
    ], 'arid');

    // India & South Asia
    drawBiomeLandmass([
      [68, 24], [77, 8], [88, 22], [92, 21], [80, 28], [68, 24]
    ], 'tropical');

    // Australia (Lush coastlines & Arid red outback center)
    drawBiomeLandmass([
      [113, -24], [130, -12], [142, -10], [153, -28],
      [150, -38], [138, -35], [130, -32], [115, -35], [113, -24]
    ], 'arid');

    // Japan Archipelago
    drawBiomeLandmass([
      [130, 31], [136, 35], [141, 38], [144, 44], [140, 42], [132, 34], [130, 31]
    ], 'temperate');

    // United Kingdom & Ireland
    drawBiomeLandmass([
      [-6, 50], [1.5, 51], [0, 58], [-4, 58], [-6, 54], [-6, 50]
    ], 'temperate');

    // New Zealand
    drawBiomeLandmass([
      [166, -46], [174, -41], [178, -38], [173, -35], [170, -43], [166, -46]
    ], 'temperate');

    // Antarctica (South Polar Sheet)
    drawBiomeLandmass([
      [-180, -70], [-90, -68], [0, -66], [90, -67], [180, -70],
      [180, -90], [-180, -90], [-180, -70]
    ], 'polar');

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  // Update Flight Geodesic Arc between Origin and Destination
  const updateFlightArc = useCallback((origin: CountryDirectoryItem, dest: CountryDirectoryItem) => {
    if (!globeGroupRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Remove existing arc and comet
    if (arcMeshRef.current) {
      globeGroup.remove(arcMeshRef.current);
      arcMeshRef.current.geometry.dispose();
      (arcMeshRef.current.material as THREE.Material).dispose();
      arcMeshRef.current = null;
    }

    const [ox, oy, oz] = latLonToVector3(origin.lat, origin.lon, GLOBE_RADIUS);
    const [dx, dy, dz] = latLonToVector3(dest.lat, dest.lon, GLOBE_RADIUS);

    const vOrigin = new THREE.Vector3(ox, oy, oz);
    const vDest = new THREE.Vector3(dx, dy, dz);

    // Update markers position
    if (originMarkerRef.current) {
      originMarkerRef.current.position.set(ox, oy, oz);
      originMarkerRef.current.lookAt(vOrigin.clone().multiplyScalar(2));
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.position.set(dx, dy, dz);
      destMarkerRef.current.lookAt(vDest.clone().multiplyScalar(2));
    }

    // Great-Circle Arc Geodesic Points
    const points: THREE.Vector3[] = [];
    const segments = 60;
    const distance = vOrigin.distanceTo(vDest);
    const maxAltitude = Math.min(2.5, distance * 0.28); // Arch into upper atmosphere

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Spherical linear interpolation between points
      const p = new THREE.Vector3().copy(vOrigin).lerp(vDest, t).normalize();
      const altitude = GLOBE_RADIUS + Math.sin(t * Math.PI) * maxAltitude;
      p.multiplyScalar(altitude);
      points.push(p);
    }

    arcPointsRef.current = points;

    // Glowing Arc Line
    const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
    const curveMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const arcMesh = new THREE.Line(curveGeo, curveMat);
    arcMeshRef.current = arcMesh;
    globeGroup.add(arcMesh);
  }, []);

  // Smoothly swing globe to focus target country coordinates
  const focusCountry = useCallback((targetCountry: CountryDirectoryItem) => {
    if (!globeGroupRef.current || !cameraRef.current) return;
    const globe = globeGroupRef.current;
    const camera = cameraRef.current;

    // Convert lat/lon to sphere rotation angle facing camera (+Z)
    const targetRotX = (targetCountry.lat * Math.PI) / 180;
    const targetRotY = -((targetCountry.lon + 90) * Math.PI) / 180;

    const startRotX = globe.rotation.x;
    const startRotY = globe.rotation.y;

    const startTime = performance.now();
    const duration = 1000; // 1s smooth transition

    const animateFocus = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      globe.rotation.x = startRotX + (targetRotX - startRotX) * ease;
      globe.rotation.y = startRotY + (targetRotY - startRotY) * ease;

      if (progress < 1) {
        requestAnimationFrame(animateFocus);
      }
    };

    requestAnimationFrame(animateFocus);
  }, []);

  // Initialize Three.js Scene, Camera, WebGL Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;
    setContainerDimensions({ width, height });

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: dynamically calculated safe distance for mobile and desktop
    const safeDistance = calculateFitCameraDistance(width, height, 45);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, safeDistance);
    cameraRef.current = camera;

    // 3. Renderer with high performance & WebGL fallback guard
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.error('[3D Earth Globe] WebGL context creation failed:', e);
      setWebGLError(true);
      return;
    }

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    sunLight.position.set(12, 10, 15);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.6);
    rimLight.position.set(-15, -10, -10);
    scene.add(rimLight);

    // 5. Starfield Dust
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 160;
      starPos[i + 1] = (Math.random() - 0.5) * 160;
      starPos[i + 2] = (Math.random() - 0.5) * 160;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.5,
      transparent: true,
      opacity: 0.5
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // 6. Earth Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Realistic Earth Sphere
    const earthTexture = createRealisticEarthTexture();
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 0.08,
      specular: new THREE.Color(0x0284c7),
      shininess: 25
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Atmospheric Glowing Halo Shell (Fresnel Shader)
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * ATMOSPHERE_FACTOR, 48, 48);
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
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.06, 0.75, 0.95, 1.0) * intensity * 0.92;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    scene.add(new THREE.Mesh(haloGeo, haloMat));

    // Origin Beacon Ring (Cyan)
    const originRingGeo = new THREE.RingGeometry(0.12, 0.22, 32);
    const originRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const originMarker = new THREE.Mesh(originRingGeo, originRingMat);
    originMarkerRef.current = originMarker;
    globeGroup.add(originMarker);

    // Destination Beacon Ring (Purple)
    const destRingGeo = new THREE.RingGeometry(0.12, 0.22, 32);
    const destRingMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
    const destMarker = new THREE.Mesh(destRingGeo, destRingMat);
    destMarkerRef.current = destMarker;
    globeGroup.add(destMarker);

    // Traveling Comet Pulse travelling along arc
    const cometGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const cometMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cometMesh = new THREE.Mesh(cometGeo, cometMat);
    cometMeshRef.current = cometMesh;
    globeGroup.add(cometMesh);

    // Draw initial corridor arc
    updateFlightArc(originCountry, destCountry);

    // 7. Touch & Mouse Gesture Interactions
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let touchStartDist = 0;

    const stopAutoMode = () => {
      setIsAutoRotating(false);
      setIsManualInteracting(true);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      stopAutoMode();
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !globeGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x += deltaY * 0.005;
      globeGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroupRef.current.rotation.x));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAutoMode();
      if (!cameraRef.current) return;
      const safeFit = calculateFitCameraDistance(container.clientWidth, container.clientHeight, 45);
      cameraRef.current.position.z += e.deltaY * 0.012;
      // Clamp between 55% fitDist and 220% fitDist
      cameraRef.current.position.z = Math.max(safeFit * 0.55, Math.min(safeFit * 2.2, cameraRef.current.position.z));
    };

    // Mobile 1-finger drag & 2-finger pinch gestures
    const onTouchStart = (e: TouchEvent) => {
      stopAutoMode();
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!globeGroupRef.current || !cameraRef.current) return;
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;

        globeGroupRef.current.rotation.y += deltaX * 0.005;
        globeGroupRef.current.rotation.x += deltaY * 0.005;
        globeGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroupRef.current.rotation.x));

        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = touchStartDist - currentDist;
        const safeFit = calculateFitCameraDistance(container.clientWidth, container.clientHeight, 45);
        cameraRef.current.position.z += delta * 0.02;
        cameraRef.current.position.z = Math.max(safeFit * 0.55, Math.min(safeFit * 2.2, cameraRef.current.position.z));
        touchStartDist = currentDist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'none'; // Prevent page scroll while dragging globe
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 8. Responsive Camera & Renderer Resize Handling with ResizeObserver
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      setContainerDimensions({ width: w, height: h });
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 9. Animation Rendering Loop
    let cometStep = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Smooth auto-rotation if enabled and user is not manually dragging
      if (isAutoRotating && globeGroup) {
        globeGroup.rotation.y += 0.0015;
      }

      // Animate travelling comet pulse along flight geodesic arc
      if (cometMesh && arcPointsRef.current.length > 0) {
        cometStep = (cometStep + 0.008) % 1;
        const total = arcPointsRef.current.length - 1;
        const idx = Math.min(total, Math.floor(cometStep * total));
        const pos = arcPointsRef.current[idx];
        if (pos) cometMesh.position.copy(pos);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup resources on unmount
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      earthTexture.dispose();
      haloGeo.dispose();
      haloMat.dispose();
    };
  }, [createRealisticEarthTexture, updateFlightArc]);

  // Update flight arc when origin or destination changes
  useEffect(() => {
    if (originCountry && destCountry) {
      updateFlightArc(originCountry, destCountry);
      // Center the destination country smoothly
      focusCountry(destCountry);
    }
  }, [originCountry, destCountry, updateFlightArc, focusCountry]);

  // Zoom In Control
  const handleZoomIn = () => {
    if (!cameraRef.current || !mountRef.current) return;
    setIsAutoRotating(false);
    setIsManualInteracting(true);
    const safeFit = calculateFitCameraDistance(mountRef.current.clientWidth, mountRef.current.clientHeight, 45);
    cameraRef.current.position.z = Math.max(safeFit * 0.55, cameraRef.current.position.z - 2.5);
  };

  // Zoom Out Control
  const handleZoomOut = () => {
    if (!cameraRef.current || !mountRef.current) return;
    setIsAutoRotating(false);
    setIsManualInteracting(true);
    const safeFit = calculateFitCameraDistance(mountRef.current.clientWidth, mountRef.current.clientHeight, 45);
    cameraRef.current.position.z = Math.min(safeFit * 2.2, cameraRef.current.position.z + 2.5);
  };

  // Fit Globe: recalculates exact camera distance and restores complete visibility
  const handleFitGlobe = () => {
    if (!cameraRef.current || !mountRef.current) return;
    const safeFit = calculateFitCameraDistance(mountRef.current.clientWidth, mountRef.current.clientHeight, 45);

    const startZ = cameraRef.current.position.z;
    const startTime = performance.now();
    const duration = 600;

    const animateZ = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      if (cameraRef.current) {
        cameraRef.current.position.z = startZ + (safeFit - startZ) * ease;
      }
      if (progress < 1) {
        requestAnimationFrame(animateZ);
      }
    };
    requestAnimationFrame(animateZ);
  };

  // Reset View: restores default orientation and safe fit distance
  const handleResetView = () => {
    if (!globeGroupRef.current || !cameraRef.current || !mountRef.current) return;
    const safeFit = calculateFitCameraDistance(mountRef.current.clientWidth, mountRef.current.clientHeight, 45);

    globeGroupRef.current.rotation.set(0, 0, 0);
    cameraRef.current.position.set(0, 0, safeFit);
    setIsAutoRotating(true);
    setIsManualInteracting(false);
  };

  // Toggle Auto-Rotation Mode
  const handleToggleAuto = () => {
    setIsAutoRotating((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-radial-gradient from-navy-900 via-navy-950 to-slate-950 border border-slate-800 shadow-2xl ${className}`}
    >
      {/* 3D WebGL Canvas Mount Viewport */}
      {/* Responsive Height: 380px on narrow mobile, 480px on tablet, 620px on desktop */}
      <div
        ref={mountRef}
        className="w-full h-[380px] sm:h-[480px] md:h-[620px] cursor-grab active:cursor-grabbing relative select-none"
      />

      {/* WebGL Failure Fallback */}
      {webGLError && (
        <div className="absolute inset-0 bg-navy-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">WebGL 3D Earth Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Your browser or device does not have WebGL hardware acceleration enabled. You can still explore all sovereign country visa rules and currency tools below.
          </p>
          <div className="text-xs font-mono text-cyan-400">
            {destCountry.flag} {destCountry.name} ➔ Coordinates: {destCountry.lat}°, {destCountry.lon}°
          </div>
        </div>
      )}

      {/* Floating Status & Telemetry Pill (Top Left) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-navy-950/85 backdrop-blur-md border border-slate-800 shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-bold text-white tracking-wide uppercase font-sans">
            3D Planetary Mobility Radar
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hidden sm:inline">
            Three.js WebGL
          </span>
        </div>
      </div>

      {/* Floating Active Corridor Badge (Top Right) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-navy-950/85 backdrop-blur-md border border-slate-800 shadow-lg flex items-center gap-2 pointer-events-auto text-xs">
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <span>{originCountry.flag}</span>
            <span className="hidden sm:inline">{originCountry.name}</span>
            <span className="sm:hidden font-mono">{originCountry.cca2}</span>
          </span>
          <span className="text-slate-500 font-mono">➔</span>
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <span>{destCountry.flag}</span>
            <span className="hidden sm:inline">{destCountry.name}</span>
            <span className="sm:hidden font-mono">{destCountry.cca2}</span>
          </span>
        </div>
      </div>

      {/* Interactive Camera & Control Panel (Bottom Right Floating Pills) */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Auto Mode Toggle Button */}
        <button
          type="button"
          onClick={handleToggleAuto}
          className={`px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-lg ${
            isAutoRotating
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
              : 'bg-navy-950/90 text-slate-400 hover:text-white border-slate-800'
          }`}
          title={isAutoRotating ? 'Click to Stop Auto Rotation' : 'Click to Resume Auto Rotation'}
          aria-label={isAutoRotating ? 'Stop Auto Mode' : 'Resume Auto Mode'}
        >
          {isAutoRotating ? (
            <>
              <Pause className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Auto: ON</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Auto: OFF</span>
            </>
          )}
        </button>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-navy-950/90 hover:bg-slate-800 backdrop-blur-md text-slate-300 hover:text-white border border-slate-800 transition-all shadow-lg"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-navy-950/90 hover:bg-slate-800 backdrop-blur-md text-slate-300 hover:text-white border border-slate-800 transition-all shadow-lg"
          title="Zoom Out (−)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Fit Globe Button (Calculates perfect responsive camera fitting) */}
        <button
          type="button"
          onClick={handleFitGlobe}
          className="px-2.5 py-2 rounded-xl bg-navy-950/90 hover:bg-slate-800 backdrop-blur-md text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-all shadow-lg flex items-center gap-1 text-xs font-bold"
          title="Fit Globe into Container"
          aria-label="Fit Globe"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Fit Globe</span>
        </button>

        {/* Reset View Button */}
        <button
          type="button"
          onClick={handleResetView}
          className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-navy-950/90 hover:bg-slate-800 backdrop-blur-md text-slate-300 hover:text-white border border-slate-800 transition-all shadow-lg"
          title="Reset Globe View"
          aria-label="Reset Globe View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Great-Circle Flight Geodesic HUD Strip (Bottom Left Floating) */}
      {flightTelemetry && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-none hidden sm:block">
          <div className="px-3.5 py-2 rounded-2xl bg-navy-950/85 backdrop-blur-md border border-slate-800 shadow-lg flex items-center gap-3 text-xs pointer-events-auto">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Plane className="w-3.5 h-3.5 text-cyan-400" />
              <span>Great-Circle:</span>
              <strong className="text-white font-mono">{flightTelemetry.distanceKm.toLocaleString()} km</strong>
              <span className="text-slate-500 text-[10px]">({flightTelemetry.distanceNm} nm)</span>
            </span>
            <span>•</span>
            <span className="text-slate-300">
              Est. Flight: <strong className="text-purple-300">~{flightTelemetry.flightHours}h</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
