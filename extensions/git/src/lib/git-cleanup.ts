import { exec_git, active_worktree_path, confirm_action, alert_error } from "@/lib/git";

interface CleanupTarget {
  branch: string | null;
  defaultBranch: string | null;
  dirty: boolean;
}

export async function active_worktree(): Promise<MuxyWorktree | undefined> {
  const worktrees = await muxy.worktrees.list().catch(() => [] as MuxyWorktree[]);
  return worktrees.find((w) => w.isActive) ?? worktrees.find((w) => w.isPrimary);
}

export async function is_on_worktree(): Promise<boolean> {
  const active = await active_worktree();
  return !!active && !active.isPrimary;
}

export async function remove_active_worktree(branch: string | null, force: boolean): Promise<void> {
  const worktrees = await muxy.worktrees.list().catch(() => [] as MuxyWorktree[]);
  const active = worktrees.find((w) => w.isActive) ?? worktrees.find((w) => w.isPrimary);
  if (!active || active.isPrimary) return;

  const replacement =
    worktrees.find((w) => w.isPrimary && w.id !== active.id) ??
    worktrees.find((w) => w.id !== active.id);
  if (replacement) {
    await muxy.git.worktree
      .switchTo({ identifier: replacement.path })
      .catch(() => muxy.worktrees.switchTo(replacement.path));
  }
  await muxy.git.worktree.remove({ path: active.path, force });
  if (branch) await muxy.git.branch.deleteRemote({ branch }).catch(() => undefined);
  await muxy.worktrees.refresh();
}

export async function cleanup_branch({ branch, defaultBranch, dirty }: CleanupTarget): Promise<boolean> {
  if (!branch) return false;

  const isWorktree = await is_on_worktree();

  const message = isWorktree
    ? `This removes the worktree and deletes branch "${branch}".${
        dirty ? " Uncommitted changes in this worktree will be lost permanently." : ""
      }`
    : `This switches to ${defaultBranch ?? "the default branch"} and deletes branch "${branch}".${
        dirty ? " Uncommitted changes on this branch will no longer belong to any branch." : ""
      }`;
  const ok = await confirm_action({
    title: `Clean up branch "${branch}"?`,
    message,
    confirmLabel: "Clean Up",
    critical: dirty,
  });
  if (!ok) return false;

  try {
    if (isWorktree) {
      await remove_active_worktree(branch, dirty);
    } else {
      if (defaultBranch && defaultBranch !== branch) {
        await muxy.git.branch.switchTo({ branch: defaultBranch });
      }
      await exec_git(await active_worktree_path(), ["branch", "-D", branch], "Could not delete branch");
      await muxy.git.branch.deleteRemote({ branch }).catch(() => undefined);
    }
    return true;
  } catch (err) {
    await alert_error("Cleanup failed", err);
    return false;
  }
}
