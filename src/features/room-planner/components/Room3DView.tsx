import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Edges, Line } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { RoomLayout, RoomFeature, WindowFeature, DoorSwingFeature, FurnitureItem } from '../types/room';
import type { UnitSystem } from '../../../utils/coordinates';
import { formatDim } from '../../../utils/coordinates';
import { effectiveW, effectiveH, safeColor } from '../utils/furnitureGeometry';

interface Props {
  layout: RoomLayout;
  furniture: FurnitureItem[];
  features: RoomFeature[];
  unitSystem: UnitSystem;
}

// Room X → Three.js X, Room Y (depth) → Three.js Z, Height → Three.js Y
const effectiveD = effectiveH;

// ---- door arc ----

function doorArcPoints(
  door: DoorSwingFeature,
  W: number,
  D: number,
  segments = 18,
): [number, number, number][] {
  const { wall, offsetIn, swingIn, hingeDirection: hinge, swingDirection: swing } = door;
  let hingeX = 0, hingeZ = 0, startAngle = 0, sweepAngle = 0;

  if (wall === 'bottom') {
    hingeZ = D;
    hingeX = hinge === 'left' ? offsetIn : offsetIn + swingIn;
    startAngle = hinge === 'left' ? 0 : Math.PI;
    sweepAngle = (hinge === 'left' ? -1 : 1) * (swing === 'in' ? 1 : -1) * Math.PI / 2;
  } else if (wall === 'top') {
    hingeZ = 0;
    hingeX = hinge === 'left' ? offsetIn : offsetIn + swingIn;
    startAngle = hinge === 'left' ? 0 : Math.PI;
    sweepAngle = (hinge === 'left' ? 1 : -1) * (swing === 'in' ? 1 : -1) * Math.PI / 2;
  } else if (wall === 'left') {
    hingeX = 0;
    hingeZ = hinge === 'left' ? offsetIn : offsetIn + swingIn;
    startAngle = hinge === 'left' ? Math.PI / 2 : -Math.PI / 2;
    sweepAngle = (hinge === 'left' ? -1 : 1) * (swing === 'in' ? 1 : -1) * Math.PI / 2;
  } else {
    hingeX = W;
    hingeZ = hinge === 'left' ? offsetIn : offsetIn + swingIn;
    startAngle = hinge === 'left' ? Math.PI / 2 : -Math.PI / 2;
    sweepAngle = (hinge === 'left' ? 1 : -1) * (swing === 'in' ? 1 : -1) * Math.PI / 2;
  }

  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = startAngle + sweepAngle * (i / segments);
    pts.push([hingeX + swingIn * Math.cos(a), 0.5, hingeZ + swingIn * Math.sin(a)]);
  }
  return pts;
}

// ---- sub-components ----

interface FurnitureMeshProps {
  item: FurnitureItem;
  selected: boolean;
  onClick: () => void;
  ceilingHeight: number;
}

function FurnitureMesh({ item, selected, onClick, ceilingHeight }: FurnitureMeshProps) {
  const ew = effectiveW(item);
  const ed = effectiveD(item);
  const clampedH = Math.max(1, Math.min(item.heightIn, ceilingHeight - item.zOffsetIn));
  const clipsThrough = item.zOffsetIn + item.heightIn > ceilingHeight;
  const edgeColor = clipsThrough ? '#e53e3e' : selected ? '#2563eb' : '#1a1a1a';
  const edgeWidth = selected ? 2 : 0.5;

  return (
    <mesh
      position={[item.x + ew / 2, item.zOffsetIn + clampedH / 2, item.y + ed / 2]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <boxGeometry args={[ew, clampedH, ed]} />
      <meshLambertMaterial color={safeColor(item.color)} flatShading />
      <Edges color={edgeColor} lineWidth={edgeWidth} threshold={1} />
    </mesh>
  );
}

const FADE_START = 100;
const FADE_END = 260;
const MIN_SIZE_FOR_LABEL = 18;

function FurnitureLabel({ item, ceilingHeight }: { item: FurnitureItem; ceilingHeight: number }) {
  const ew = effectiveW(item);
  const ed = effectiveD(item);
  const textRef = useRef<{ fillOpacity: number; strokeOpacity: number } | null>(null);
  const { camera } = useThree();
  const topY = Math.min(item.zOffsetIn + item.heightIn, ceilingHeight) + 5;
  const pos = useMemo(
    () => new THREE.Vector3(item.x + ew / 2, topY, item.y + ed / 2),
    [item.x, item.y, ew, ed, topY],
  );

  useFrame(() => {
    if (!textRef.current) return;
    const dist = camera.position.distanceTo(pos);
    const opacity = 1 - THREE.MathUtils.clamp((dist - FADE_START) / (FADE_END - FADE_START), 0, 1);
    textRef.current.fillOpacity = opacity;
    textRef.current.strokeOpacity = opacity;
  });

  if (Math.max(ew, ed) < MIN_SIZE_FOR_LABEL) return null;

  return (
    <Billboard position={pos}>
      <Text
        ref={textRef as React.Ref<{ fillOpacity: number; strokeOpacity: number }>}
        fontSize={7}
        color="#111111"
        outlineColor="#ffffff"
        outlineWidth={0.8}
        anchorX="center"
        anchorY="middle"
      >
        {item.name}
      </Text>
    </Billboard>
  );
}

function WindowPanel({ win, layout }: { win: WindowFeature; layout: RoomLayout }) {
  const { widthIn: W, heightIn: D } = layout;
  const { wall, offsetIn, lengthIn, sillHeightIn, openingHeightIn } = win;
  const cy = sillHeightIn + openingHeightIn / 2;
  const halfLen = lengthIn / 2;

  let pos: [number, number, number];
  let rot: [number, number, number] = [0, 0, 0];

  switch (wall) {
    case 'bottom': pos = [offsetIn + halfLen, cy, D]; break;
    case 'top':    pos = [offsetIn + halfLen, cy, 0]; rot = [0, Math.PI, 0]; break;
    case 'left':   pos = [0, cy, offsetIn + halfLen]; rot = [0, Math.PI / 2, 0]; break;
    case 'right':  pos = [W, cy, offsetIn + halfLen]; rot = [0, -Math.PI / 2, 0]; break;
    default:       pos = [0, 0, 0];
  }

  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={[lengthIn, openingHeightIn]} />
      <meshBasicMaterial color="#87CEEB" transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
      <Edges color="#4499bb" lineWidth={1} />
    </mesh>
  );
}

function DoorPanel({ door, layout }: { door: DoorSwingFeature; layout: RoomLayout }) {
  const { widthIn: W, heightIn: D } = layout;
  const { wall, offsetIn, swingIn, doorHeightIn, hingeDirection: hinge } = door;
  const cy = doorHeightIn / 2;
  const halfSwing = swingIn / 2;

  let pos: [number, number, number];
  let rot: [number, number, number] = [0, 0, 0];

  switch (wall) {
    case 'bottom': pos = [offsetIn + halfSwing, cy, D]; break;
    case 'top':    pos = [offsetIn + halfSwing, cy, 0]; rot = [0, Math.PI, 0]; break;
    case 'left':   pos = [0, cy, offsetIn + halfSwing]; rot = [0, Math.PI / 2, 0]; break;
    case 'right':  pos = [W, cy, offsetIn + halfSwing]; rot = [0, -Math.PI / 2, 0]; break;
    default:       pos = [0, 0, 0];
  }

  const arcPts = doorArcPoints(door, W, D);

  let hingeX: number, hingeZ: number;
  if (wall === 'bottom' || wall === 'top') {
    hingeX = hinge === 'left' ? offsetIn : offsetIn + swingIn;
    hingeZ = wall === 'bottom' ? D : 0;
  } else {
    hingeX = wall === 'left' ? 0 : W;
    hingeZ = hinge === 'left' ? offsetIn : offsetIn + swingIn;
  }
  const openEnd = arcPts[arcPts.length - 1];
  const openLine: [number, number, number][] = [[hingeX, 0.5, hingeZ], openEnd];

  return (
    <group>
      <mesh position={pos} rotation={rot}>
        <planeGeometry args={[swingIn, doorHeightIn]} />
        <meshBasicMaterial color="#d4a96a" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        <Edges color="#aa7733" lineWidth={1} />
      </mesh>
      <Line points={arcPts} color="#aa7733" lineWidth={1} />
      <Line points={openLine} color="#aa7733" lineWidth={0.8} dashed dashSize={4} gapSize={4} />
    </group>
  );
}

function RoomBox({ layout }: { layout: RoomLayout }) {
  const { widthIn: W, heightIn: D, ceilingHeightIn: CH } = layout;

  const minorGrid = useMemo(() => {
    const size = Math.max(W, D) * 1.4;
    const divs = Math.max(1, Math.round(size / 12));
    return new THREE.GridHelper(size, divs, '#c2c2b4', '#c2c2b4');
  }, [W, D]);

  const majorGrid = useMemo(() => {
    const size = Math.max(W, D) * 1.4;
    const divs = Math.max(1, Math.round(size / 48));
    return new THREE.GridHelper(size, divs, '#8e8e80', '#8e8e80');
  }, [W, D]);

  const wallMat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#f0ede5',
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    [],
  );

  return (
    <group>
      {/* Floor */}
      <mesh position={[W / 2, 0, D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshLambertMaterial color="#e6e3db" />
      </mesh>

      {/* Minor grid (12" / 1ft) */}
      <primitive object={minorGrid} position={[W / 2, 0.3, D / 2]} />
      {/* Major grid (48" / 4ft) */}
      <primitive object={majorGrid} position={[W / 2, 0.6, D / 2]} />

      {/* Left wall x=0 */}
      <mesh position={[0, CH / 2, D / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, CH]} />
        <primitive object={wallMat} attach="material" />
        <Edges color="#444444" lineWidth={0.8} />
      </mesh>

      {/* Right wall x=W */}
      <mesh position={[W, CH / 2, D / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, CH]} />
        <primitive object={wallMat} attach="material" />
        <Edges color="#444444" lineWidth={0.8} />
      </mesh>

      {/* Back wall z=0 */}
      <mesh position={[W / 2, CH / 2, 0]}>
        <planeGeometry args={[W, CH]} />
        <primitive object={wallMat} attach="material" />
        <Edges color="#444444" lineWidth={0.8} />
      </mesh>

      {/* Front wall z=D */}
      <mesh position={[W / 2, CH / 2, D]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, CH]} />
        <primitive object={wallMat} attach="material" />
        <Edges color="#444444" lineWidth={0.8} />
      </mesh>
    </group>
  );
}

// ---- selection overlay (DOM) ----

function SelectionOverlay({
  item,
  unitSystem,
  onClose,
}: {
  item: FurnitureItem;
  unitSystem: UnitSystem;
  onClose: () => void;
}) {
  const ew = effectiveW(item);
  const ed = effectiveD(item);
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 150,
        fontFamily: 'var(--font)',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: 'var(--text-secondary)', padding: '0 0 0 8px', lineHeight: 1,
          }}
          aria-label="Close"
        >×</button>
      </div>
      <table style={{ fontSize: 12, color: 'var(--text-secondary)', borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {[
            ['Width',  formatDim(ew, unitSystem)],
            ['Depth',  formatDim(ed, unitSystem)],
            ['Height', formatDim(item.heightIn, unitSystem)],
            ...(item.zOffsetIn > 0 ? [['Offset', formatDim(item.zOffsetIn, unitSystem)]] : []),
          ].map(([label, val]) => (
            <tr key={label}>
              <td style={{ paddingRight: 10, paddingBottom: 2, color: 'var(--text-tertiary)' }}>{label}</td>
              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- main export ----

export default function Room3DView({ layout, furniture, features, unitSystem }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = furniture.find(f => f.id === selectedId) ?? null;
  const { widthIn: W, heightIn: D, ceilingHeightIn: CH } = layout;

  const camPos = useMemo<[number, number, number]>(
    () => [W * 1.3, CH * 1.4, D * 1.9],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const target = useMemo<[number, number, number]>(
    () => [W / 2, CH / 8, D / 2],
    [W, D, CH],
  );

  const windows = features.filter((f): f is WindowFeature => f.type === 'window');
  const doors = features.filter((f): f is DoorSwingFeature => f.type === 'door-swing');

  return (
    <div
      className="viz-container viz-container--3d"
      style={{ position: 'relative' }}
    >
      <Canvas
        camera={{ position: camPos, fov: 45, near: 1, far: 10000 }}
        style={{ background: '#f1ede3', width: '100%', height: '100%', display: 'block' }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <ambientLight intensity={0.88} />
        <directionalLight position={[W * 0.8, CH * 2.5, D * 0.4]} intensity={0.32} />

        <OrbitControls target={target} makeDefault enableDamping dampingFactor={0.06} />

        <RoomBox layout={layout} />

        {windows.map(w => <WindowPanel key={w.id} win={w} layout={layout} />)}
        {doors.map(d => <DoorPanel key={d.id} door={d} layout={layout} />)}

        {furniture.map(item => (
          <FurnitureMesh
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}
            ceilingHeight={CH}
          />
        ))}

        {furniture.map(item => (
          <FurnitureLabel key={item.id} item={item} ceilingHeight={CH} />
        ))}
      </Canvas>

      {selected && (
        <SelectionOverlay item={selected} unitSystem={unitSystem} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
