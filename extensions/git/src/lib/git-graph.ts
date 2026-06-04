export interface CommitRef {
  name: string;
  kind: string;
}

export interface CommitNode {
  hash: string;
  shortHash: string;
  subject: string;
  authorName: string;
  authorDate: string;
  isMerge: boolean;
  parentHashes: string[];
  refs: CommitRef[];
}

export interface GraphEdge {
  fromColumn: number;
  toColumn: number;
}

export interface CommitLane {
  column: number;
  passthrough: number[];
  edges: GraphEdge[];
  width: number;
}

export interface GraphRow {
  commit: CommitNode;
  lane: CommitLane;
}

export const MAX_LANES = 6;

export function to_commit_node(c: MuxyGitCommit): CommitNode {
  return {
    hash: c.hash,
    shortHash: c.shortHash,
    subject: c.subject,
    authorName: c.authorName,
    authorDate: c.authorDate,
    isMerge: c.isMerge,
    parentHashes: c.parentHashes ?? [],
    refs: c.refs ?? [],
  };
}

function claim_lane(lanes: (string | null)[], hash: string): number {
  const existing = lanes.indexOf(hash);
  if (existing !== -1) return existing;
  const free = lanes.indexOf(null);
  if (free !== -1) {
    lanes[free] = hash;
    return free;
  }
  lanes.push(hash);
  return lanes.length - 1;
}

export function compute_lanes(commits: CommitNode[]): GraphRow[] {
  const lanes: (string | null)[] = [];
  const rows: GraphRow[] = [];

  for (const commit of commits) {
    const column = claim_lane(lanes, commit.hash);
    const before = lanes.map((l) => l);

    const first = commit.parentHashes[0] ?? null;
    lanes[column] = first;

    const edges: GraphEdge[] = [];
    if (first) edges.push({ fromColumn: column, toColumn: column });

    for (let i = 1; i < commit.parentHashes.length; i++) {
      const parent = commit.parentHashes[i];
      const target = claim_lane(lanes, parent);
      edges.push({ fromColumn: column, toColumn: target });
    }

    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop();

    const passthrough: number[] = [];
    for (let i = 0; i < before.length; i++) {
      if (i !== column && before[i] !== null) passthrough.push(i);
    }

    const width = Math.min(MAX_LANES, Math.max(before.length, lanes.length, column + 1));
    rows.push({ commit, lane: { column, passthrough, edges, width } });
  }

  return rows;
}

export function relative_time(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
