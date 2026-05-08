import { useState } from 'react';
import type { RoomLayout, RoomFeature, WallSide, WindowFeature, DoorSwingFeature, FurnitureItem } from '../types/room';
import { effectiveW, effectiveH } from '../utils/furnitureGeometry';

interface Props {
  layout: RoomLayout;
  furniture: FurnitureItem[];
  features: RoomFeature[];
}

type ElevDir = 'bottom' | 'top' | 'left' | 'right';

const DIR_LABELS: Record<ElevDir, string> = {
  bottom: 'From Bottom',
  top: 'From Top',
  left: 'From Left',
  right: 'From Right',
};

const ELEV_SCALE = 3;
const PAD = 24;


function getFloorPos(item: FurnitureItem, dir: ElevDir, roomW: number, roomD: number): { x: number; w: number } {
  const ew = effectiveW(item);
  const eh = effectiveH(item);
  switch (dir) {
    case 'bottom': return { x: item.x, w: ew };
    case 'top':    return { x: roomW - item.x - ew, w: ew };
    case 'left':   return { x: item.y, w: eh };
    case 'right':  return { x: roomD - item.y - eh, w: eh };
  }
}

function roomWidth(dir: ElevDir, layout: RoomLayout): number {
  return dir === 'left' || dir === 'right' ? layout.heightIn : layout.widthIn;
}

export default function ElevationView({ layout, furniture, features }: Props) {
  const [dir, setDir] = useState<ElevDir>('bottom');

  const ceilH = layout.ceilingHeightIn;
  const rw = roomWidth(dir, layout);
  const svgW = rw * ELEV_SCALE + PAD * 2;
  const svgH = ceilH * ELEV_SCALE + PAD * 2;

  function toSx(xIn: number): number { return PAD + xIn * ELEV_SCALE; }
  function toSy(zIn: number): number { return PAD + (ceilH - zIn) * ELEV_SCALE; }

  const wallForDir: WallSide = dir;
  const wallFeatures = features.filter(f => f.wall === wallForDir);

  const sortedFurniture = [...furniture].sort((a, b) => {
    const depthA = dir === 'bottom' ? a.y : dir === 'top' ? (layout.heightIn - a.y - effectiveH(a)) : dir === 'left' ? a.x : (layout.widthIn - a.x - effectiveW(a));
    const depthB = dir === 'bottom' ? b.y : dir === 'top' ? (layout.heightIn - b.y - effectiveH(b)) : dir === 'left' ? b.x : (layout.widthIn - b.x - effectiveW(b));
    return depthB - depthA;
  });

  return (
    <div className="viz-container">
      <div className="viz-toolbar">
        <div className="btn-toggle-group" role="group" aria-label="Elevation direction">
          {(Object.keys(DIR_LABELS) as ElevDir[]).map(d => (
            <button
              key={d}
              className={`btn-toggle${dir === d ? ' btn-toggle--active' : ''}`}
              onClick={() => setDir(d)}
            >
              {DIR_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="viz-scroll">
        <svg
          width={svgW}
          height={svgH}
          style={{ display: 'block', background: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
          aria-label={`Elevation view from ${dir} wall`}
        >
          {/* Floor */}
          <rect
            x={toSx(0)} y={toSy(0)}
            width={rw * ELEV_SCALE} height={4}
            fill="var(--text-primary)"
          />
          {/* Ceiling */}
          <rect
            x={toSx(0)} y={toSy(ceilH) - 4}
            width={rw * ELEV_SCALE} height={4}
            fill="var(--text-primary)"
          />
          {/* Left wall line */}
          <line x1={toSx(0)} y1={toSy(0)} x2={toSx(0)} y2={toSy(ceilH)} stroke="var(--border-strong)" strokeWidth={1.5} />
          {/* Right wall line */}
          <line x1={toSx(rw)} y1={toSy(0)} x2={toSx(rw)} y2={toSy(ceilH)} stroke="var(--border-strong)" strokeWidth={1.5} />

          {/* Wall features on this wall */}
          {wallFeatures.map(feat => {
            if (feat.type === 'window') {
              const wf = feat as WindowFeature;
              const wx = toSx(wf.offsetIn);
              const wy = toSy(wf.sillHeightIn + wf.openingHeightIn);
              const ww = wf.lengthIn * ELEV_SCALE;
              const wh = wf.openingHeightIn * ELEV_SCALE;
              return (
                <g key={feat.id}>
                  <rect x={wx} y={wy} width={ww} height={wh} fill="#87CEEB" stroke="var(--border-strong)" strokeWidth={1} />
                  <text x={wx + ww / 2} y={wy + wh / 2 + 4} textAnchor="middle" fontSize={9} fill="var(--text-primary)">W</text>
                </g>
              );
            }
            if (feat.type === 'door-swing') {
              const df = feat as DoorSwingFeature;
              const dx = toSx(df.offsetIn);
              const dy = toSy(df.doorHeightIn);
              const dw = df.swingIn * ELEV_SCALE;
              const dh = df.doorHeightIn * ELEV_SCALE;
              return (
                <g key={feat.id}>
                  <rect x={dx} y={dy} width={dw} height={dh} fill="oklch(93% 0.01 44)" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="4 2" />
                  <text x={dx + dw / 2} y={dy + dh / 2 + 4} textAnchor="middle" fontSize={9} fill="var(--text-primary)">D</text>
                </g>
              );
            }
            return null;
          })}

          {/* Furniture */}
          {sortedFurniture.map(item => {
            const { x: fx, w: fw } = getFloorPos(item, dir, layout.widthIn, layout.heightIn);
            const top = item.zOffsetIn + item.heightIn;
            const clipsThrough = top > ceilH;
            const clampedTop = Math.min(top, ceilH);
            const rx = toSx(fx);
            const ry = toSy(clampedTop);
            const rw2 = fw * ELEV_SCALE;
            const rh = (clampedTop - item.zOffsetIn) * ELEV_SCALE;
            return (
              <g key={item.id}>
                <rect
                  x={rx} y={ry}
                  width={rw2} height={rh}
                  fill={item.color}
                  stroke={clipsThrough ? '#e53e3e' : 'var(--border-strong)'}
                  strokeWidth={clipsThrough ? 2 : 1}
                  opacity={0.85}
                />
                <text
                  x={rx + rw2 / 2}
                  y={ry + Math.min(rh / 2 + 4, rh - 2)}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--text-primary)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.name}
                </text>
              </g>
            );
          })}

          {/* Height labels */}
          <text x={PAD - 4} y={toSy(0)} textAnchor="end" fontSize={8} fill="var(--text-tertiary)" dominantBaseline="middle">0"</text>
          <text x={PAD - 4} y={toSy(ceilH)} textAnchor="end" fontSize={8} fill="var(--text-tertiary)" dominantBaseline="middle">{ceilH}"</text>
        </svg>
      </div>
    </div>
  );
}
