import { active_worktree_path, alert_error, open_url } from "@/lib/git";
import type { CommitNode } from "@/lib/git-graph";

export async function copy_hash(commit: CommitNode): Promise<void> {
  try {
    await navigator.clipboard.writeText(commit.hash);
  } catch {
    const ok = await muxy
      .exec({ shell: `printf %s ${JSON.stringify(commit.hash)} | pbcopy` })
      .then((r) => r.exitCode === 0)
      .catch(() => false);
    if (!ok) {
      await alert_error("Copy failed", "Could not copy commit hash");
      return;
    }
  }
  await muxy.toast({ body: `Copied ${commit.shortHash}`, variant: "success" }).catch(() => undefined);
}

function github_commit_url(remote: string, hash: string): string | null {
  const url = remote.trim();
  const ssh = url.match(/git@([^:]+):(.+?)(?:\.git)?$/);
  const https = url.match(/^https?:\/\/(?:[^@]+@)?([^/]+)\/(.+?)(?:\.git)?$/);
  const match = ssh ?? https;
  if (!match) return null;
  return `https://${match[1]}/${match[2]}/commit/${hash}`;
}

export async function open_commit_on_github(commit: CommitNode): Promise<void> {
  try {
    const cwd = await active_worktree_path();
    const res = await muxy.exec(["git", "remote", "get-url", "origin"], { cwd });
    if (res.exitCode !== 0) throw new Error(res.stderr.trim() || "No remote found");
    const url = github_commit_url(res.stdout, commit.hash);
    if (!url) throw new Error("Could not parse remote URL");
    open_url(url);
  } catch (err) {
    await alert_error("Open on GitHub failed", err);
  }
}

export async function cherry_pick_commit(commit: CommitNode, onDone: () => void): Promise<void> {
  try {
    await muxy.git.cherryPick({ hash: commit.hash });
    await muxy.toast({ body: `Cherry-picked ${commit.shortHash}`, variant: "success" }).catch(() => undefined);
    onDone();
  } catch (err) {
    await alert_error("Cherry-pick failed", err);
  }
}

export async function revert_commit(
  commit: CommitNode,
  prefill: (message: string) => void,
  onDone: () => void,
): Promise<void> {
  try {
    const cwd = await active_worktree_path();
    const res = await muxy.exec(["git", "revert", "--no-commit", commit.hash], { cwd });
    if (res.exitCode !== 0) throw new Error(res.stderr.trim() || "Revert failed");
    prefill(`Revert: ${commit.subject}`);
    onDone();
  } catch (err) {
    await alert_error("Revert failed", err);
  }
}
