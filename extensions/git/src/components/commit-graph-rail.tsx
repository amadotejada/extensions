import type { CommitLane } from "@/lib/git-graph";
import { MAX_LANES } from "@/lib/git-graph";

const COLUMN_WIDTH = 12;
const ROW_HEIGHT = 34;
const DOT_RADIUS = 4;

function lane_color(column: number): string {
  return `var(--lane-${column % MAX_LANES})`;
}

function column_x(column: number): number {
  return COLUMN_WIDTH / 2 + Math.min(column, MAX_LANES - 1) * COLUMN_WIDTH;
}

interface CommitGraphRailProps {
  lane: CommitLane;
}

export function CommitGraphRail({ lane }: CommitGraphRailProps) {
  const columns = Math.min(MAX_LANES, Math.max(lane.width, lane.column + 1));
  const width = columns * COLUMN_WIDTH;
  const mid = ROW_HEIGHT / 2;
  const x = column_x(lane.column);

  return (
    <svg
      className="shrink-0"
      width={width}
      height={ROW_HEIGHT}
      viewBox={`0 0 ${width} ${ROW_HEIGHT}`}
      aria-hidden="true"
    >
      {lane.passthrough.map((column) => (
        <line
          key={`pass-${column}`}
          x1={column_x(column)}
          y1={0}
          x2={column_x(column)}
          y2={ROW_HEIGHT}
          stroke={lane_color(column)}
          strokeWidth={1.5}
        />
      ))}
      <line x1={x} y1={0} x2={x} y2={mid} stroke={lane_color(lane.column)} strokeWidth={1.5} />
      {lane.edges.map((edge, i) => {
        const tx = column_x(edge.toColumn);
        return (
          <path
            key={`edge-${i}`}
            d={`M ${x} ${mid} C ${x} ${ROW_HEIGHT} ${tx} ${mid} ${tx} ${ROW_HEIGHT}`}
            fill="none"
            stroke={lane_color(edge.toColumn)}
            strokeWidth={1.5}
          />
        );
      })}
      <circle
        cx={x}
        cy={mid}
        r={DOT_RADIUS}
        fill="var(--muxy-background)"
        stroke={lane_color(lane.column)}
        strokeWidth={1.5}
      />
    </svg>
  );
}
