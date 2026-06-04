import { useCallback, useEffect, useRef, useState } from "react";
import { active_worktree_path } from "@/lib/git";
import { compute_lanes, to_commit_node, type CommitNode, type GraphRow } from "@/lib/git-graph";

const PAGE = 50;

interface GraphState {
  rows: GraphRow[];
  hasMore: boolean;
  loading: boolean;
}

interface CachedGraph {
  commits: CommitNode[];
  hasMore: boolean;
}

const empty: GraphState = { rows: [], hasMore: false, loading: true };

export function use_git_graph() {
  const [state, set_state] = useState<GraphState>(empty);
  const commits = useRef<CommitNode[]>([]);
  const load_id = useRef(0);
  const cache = useRef(new Map<string, CachedGraph>());

  const publish = useCallback((next: CommitNode[], hasMore: boolean, loading: boolean) => {
    set_state({ rows: compute_lanes(next), hasMore, loading });
  }, []);

  const fetch_page = useCallback(
    async (skip: number, fresh: boolean): Promise<CommitNode[]> => {
      const batch = await muxy.git.log({ maxCount: PAGE, skip, fresh });
      return batch.map(to_commit_node);
    },
    [],
  );

  const reset = useCallback(
    async (fresh: boolean) => {
      const id = ++load_id.current;
      const key = await active_worktree_path();

      const cached = key ? cache.current.get(key) : undefined;
      if (cached) publish(cached.commits, cached.hasMore, true);
      else {
        commits.current = [];
        publish([], false, true);
      }

      try {
        const batch = await fetch_page(0, fresh);
        if (load_id.current !== id) return;
        commits.current = batch;
        const hasMore = batch.length === PAGE;
        if (key) cache.current.set(key, { commits: batch, hasMore });
        publish(batch, hasMore, false);
      } catch {
        if (load_id.current !== id) return;
        commits.current = [];
        publish([], false, false);
      }
    },
    [fetch_page, publish],
  );

  const load_more = useCallback(async () => {
    const id = load_id.current;
    const skip = commits.current.length;
    set_state((s) => ({ ...s, loading: true }));
    try {
      const batch = await fetch_page(skip, false);
      if (load_id.current !== id) return;
      const next = [...commits.current, ...batch];
      commits.current = next;
      const hasMore = batch.length === PAGE;
      const key = await active_worktree_path();
      if (key) cache.current.set(key, { commits: next, hasMore });
      publish(next, hasMore, false);
    } catch {
      if (load_id.current !== id) return;
      publish(commits.current, false, false);
    }
  }, [fetch_page, publish]);

  const refresh = useCallback(() => void reset(true), [reset]);

  useEffect(() => {
    void reset(false);
    const off_project = muxy.events.subscribe("project.switched", () => void reset(false));
    const off_worktree = muxy.events.subscribe("worktree.switched", () => void reset(false));
    return () => {
      off_project?.();
      off_worktree?.();
    };
  }, [reset]);

  return { ...state, load_more, refresh };
}
