const PREFIX = "muxy.git.pr-info.";

export interface CachedPrInfo {
  pr: MuxyGitPR;
  branch: string | null;
  defaultBranch: string | null;
  dirty: boolean;
}

async function cache_key(): Promise<string> {
  const [projects, worktrees] = await Promise.all([
    muxy.projects.list().catch(() => [] as MuxyProject[]),
    muxy.worktrees.list().catch(() => [] as MuxyWorktree[]),
  ]);
  const project = projects.find((p) => p.isActive)?.path ?? projects[0]?.path ?? "";
  const worktree =
    worktrees.find((w) => w.isActive)?.path ??
    worktrees.find((w) => w.isPrimary)?.path ??
    worktrees[0]?.path ??
    "";
  return `${PREFIX}${project}::${worktree}`;
}

export async function read_pr_cache(): Promise<CachedPrInfo | null> {
  try {
    const raw = localStorage.getItem(await cache_key());
    return raw ? (JSON.parse(raw) as CachedPrInfo) : null;
  } catch {
    return null;
  }
}

export async function write_pr_cache(value: CachedPrInfo | null): Promise<void> {
  try {
    const key = await cache_key();
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    void 0;
  }
}

export async function clear_pr_cache(): Promise<void> {
  await write_pr_cache(null);
}
