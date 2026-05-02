import type { MeasurementArrow } from '../utils/measurements';

const ARROW_COLOR = 'oklch(50% 0.105 44)';
const OVERLAP_COLOR = '#c0392b';
const MARKER_ID = 'meas-arrow';
const OVERLAP_MARKER_ID = 'meas-arrow-overlap';

interface Props {
  arrows: MeasurementArrow[];
  widthPx: number;
  heightPx: number;
}

export default function MeasurementOverlay({ arrows, widthPx, heightPx }: Props) {
  if (arrows.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: widthPx,
        height: heightPx,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 20,
      }}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
    >
      <defs>
        <marker
          id={MARKER_ID}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={ARROW_COLOR} />
        </marker>
        <marker
          id={`${MARKER_ID}-start`}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={ARROW_COLOR} />
        </marker>
        <marker
          id={OVERLAP_MARKER_ID}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={OVERLAP_COLOR} />
        </marker>
        <marker
          id={`${OVERLAP_MARKER_ID}-start`}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={OVERLAP_COLOR} />
        </marker>
      </defs>

      {arrows.map((arrow, i) => (
        <ArrowAnnotation key={i} arrow={arrow} />
      ))}
    </svg>
  );
}

function ArrowAnnotation({ arrow }: { arrow: MeasurementArrow }) {
  const { fromX, fromY, toX, toY, midX, midY, isOverlap, label } = arrow;
  const color = isOverlap ? OVERLAP_COLOR : ARROW_COLOR;
  const endMarker = isOverlap ? OVERLAP_MARKER_ID : MARKER_ID;
  const startMarker = isOverlap ? `${OVERLAP_MARKER_ID}-start` : `${MARKER_ID}-start`;

  const labelW = Math.max(36, label.length * 7 + 10);
  const labelH = 18;
  const rx = 4;

  const isTiny = Math.abs(toX - fromX) < 4 && Math.abs(toY - fromY) < 4;

  return (
    <g>
      {!isTiny && (
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={color}
          strokeWidth="1.5"
          markerEnd={`url(#${endMarker})`}
          markerStart={`url(#${startMarker})`}
        />
      )}
      <rect
        x={midX - labelW / 2}
        y={midY - labelH / 2}
        width={labelW}
        height={labelH}
        rx={rx}
        fill="var(--bg-surface, #fff)"
        stroke={color}
        strokeWidth="1"
      />
      <text
        x={midX}
        y={midY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontFamily="var(--font, system-ui)"
        fontWeight="600"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}
