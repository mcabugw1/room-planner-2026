import type { RoomLayout, RoomFeature, WindowFeature, FurnitureItem } from '../types/room';
import { effectiveW, effectiveH } from '../utils/furnitureGeometry';

interface Props {
  layout: RoomLayout;
  furniture: FurnitureItem[];
  features: RoomFeature[];
}

const ISO_SCALE = 2;
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
const PAD = 24;

function project(x: number, y: number, z: number): [number, number] {
  const sx = (x - y) * COS30 * ISO_SCALE;
  const sy = (x + y) * SIN30 * ISO_SCALE - z * ISO_SCALE;
  return [sx, sy];
}

function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function hexOrFallback(color: string): string {
  return color.startsWith('#') && color.length === 7 ? color : '#cccccc';
}

function polyPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}


export default function IsometricView({ layout, furniture, features }: Props) {
  const W = layout.widthIn;
  const D = layout.heightIn;
  const H = layout.ceilingHeightIn;

  // Offset so all projected points are non-negative
  const [ox] = project(0, D, 0);
  const offsetX = -ox + PAD;
  const [, topY] = project(0, 0, H);
  const offsetY = -topY + PAD;

  function px(x: number, y: number, z: number): [number, number] {
    const [sx, sy] = project(x, y, z);
    return [sx + offsetX, sy + offsetY];
  }

  const [, floorBR_y] = project(W, D, 0);
  const svgW = (W + D) * COS30 * ISO_SCALE + PAD * 2;
  const svgH = floorBR_y + offsetY + PAD;

  // Floor corners
  const A = px(0, 0, 0), B = px(W, 0, 0), C = px(W, D, 0), Dp = px(0, D, 0);
  // Ceiling corners
  const E = px(0, 0, H), F = px(W, 0, H);

  const wallColor = 'oklch(93% 0.008 52)';
  const floorColor = 'oklch(88% 0.010 52)';

  // Sort furniture by depth (x+y center, descending = far from viewer first)
  const sortedFurniture = [...furniture].sort((a, b) => {
    const da = a.x + effectiveW(a) / 2 + a.y + effectiveH(a) / 2;
    const db = b.x + effectiveW(b) / 2 + b.y + effectiveH(b) / 2;
    return db - da;
  });

  const windows = features.filter(f => f.type === 'window') as WindowFeature[];

  return (
    <div className="viz-container">
      <div className="viz-scroll">
        <svg
          width={svgW}
          height={svgH}
          style={{ display: 'block', background: 'var(--bg-page)' }}
          aria-label="Isometric room view"
        >
          {/* Floor */}
          <polygon points={polyPoints([A, B, C, Dp])} fill={floorColor} stroke="var(--border-strong)" strokeWidth={1} />

          {/* Left wall (x=0, y: 0→D, z: 0→H) */}
          <polygon
            points={polyPoints([A, Dp, px(0, D, H), E])}
            fill={wallColor}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />

          {/* Back wall (y=0, x: 0→W, z: 0→H) */}
          <polygon
            points={polyPoints([A, B, F, E])}
            fill="oklch(90% 0.008 52)"
            stroke="var(--border-strong)"
            strokeWidth={1}
          />

          {/* Windows on left wall (wall='left', x=0) */}
          {windows.filter(w => w.wall === 'left').map(win => {
            // On left wall: offset goes along y-axis, z is height
            const wy1 = win.offsetIn;
            const wy2 = wy1 + win.lengthIn;
            const wz1 = win.sillHeightIn;
            const wz2 = wz1 + win.openingHeightIn;
            const w1 = px(0, wy1, wz1);
            const w2 = px(0, wy2, wz1);
            const w3 = px(0, wy2, wz2);
            const w4 = px(0, wy1, wz2);
            return (
              <polygon key={win.id} points={polyPoints([w1, w2, w3, w4])} fill="#87CEEB" stroke="var(--border-strong)" strokeWidth={1} opacity={0.85} />
            );
          })}

          {/* Windows on back wall (wall='top', y=0) */}
          {windows.filter(w => w.wall === 'top').map(win => {
            const wx1 = win.offsetIn;
            const wx2 = wx1 + win.lengthIn;
            const wz1 = win.sillHeightIn;
            const wz2 = wz1 + win.openingHeightIn;
            const w1 = px(wx1, 0, wz1);
            const w2 = px(wx2, 0, wz1);
            const w3 = px(wx2, 0, wz2);
            const w4 = px(wx1, 0, wz2);
            return (
              <polygon key={win.id} points={polyPoints([w1, w2, w3, w4])} fill="#87CEEB" stroke="var(--border-strong)" strokeWidth={1} opacity={0.85} />
            );
          })}

          {/* Furniture boxes */}
          {sortedFurniture.map(item => {
            const ew = effectiveW(item);
            const eh = effectiveH(item);
            const x0 = item.x, y0 = item.y;
            const x1 = x0 + ew, y1 = y0 + eh;
            const z0 = item.zOffsetIn;
            const z1 = Math.min(z0 + item.heightIn, H);
            const clipsThrough = z0 + item.heightIn > H;
            const baseColor = hexOrFallback(item.color);
            const sideColorL = darken(baseColor, 0.25);
            const sideColorF = darken(baseColor, 0.15);
            const strokeColor = clipsThrough ? '#e53e3e' : 'var(--border-strong)';
            const strokeW = clipsThrough ? 2 : 0.5;

            // 8 corners of the box
            const a = px(x0, y0, z0), b = px(x1, y0, z0);
            const d = px(x0, y1, z0);
            const e2 = px(x0, y0, z1), f2 = px(x1, y0, z1);
            const g = px(x1, y1, z1), h = px(x0, y1, z1);

            return (
              <g key={item.id}>
                {/* West face (x=x0): a-d-h-e2 */}
                <polygon points={polyPoints([a, d, h, e2])} fill={sideColorL} stroke={strokeColor} strokeWidth={strokeW} />
                {/* North face (y=y0): a-b-f2-e2 */}
                <polygon points={polyPoints([a, b, f2, e2])} fill={sideColorF} stroke={strokeColor} strokeWidth={strokeW} />
                {/* Top face: e2-f2-g-h */}
                <polygon points={polyPoints([e2, f2, g, h])} fill={baseColor} stroke={strokeColor} strokeWidth={strokeW} />
                {/* Label on top */}
                {item.heightIn >= 6 && (() => {
                  const [cx, cy] = [
                    (e2[0] + f2[0] + g[0] + h[0]) / 4,
                    (e2[1] + f2[1] + g[1] + h[1]) / 4,
                  ];
                  return (
                    <text x={cx} y={cy + 3} textAnchor="middle" fontSize={8} fill="var(--text-primary)" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {item.name}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Ceiling outline */}
          <polygon
            points={polyPoints([E, F, px(W, 0, H), px(0, 0, H)])}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        </svg>
      </div>
    </div>
  );
}
