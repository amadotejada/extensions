async function git(args: string[]): Promise<string | null> {
  try {
    const res = await muxy.exec(["git", ...args]);
    if (res.exitCode !== 0) return null;
    return res.stdout.trim();
  } catch {
    return null;
  }
}

async function current_branch(): Promise<string | null> {
  const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
  return branch && branch !== "HEAD" ? branch : null;
}

async function pr_number(): Promise<string | null> {
  try {
    const res = await muxy.exec(["gh", "pr", "view", "--json", "number", "-q", ".number"]);
    if (res.exitCode !== 0) return null;
    return res.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function sync_items(): Promise<void> {
  const branch = await current_branch();
  if (!branch) {
    muxy.statusbar.hide("branch");
    muxy.statusbar.hide("pr-info");
    return;
  }

  muxy.statusbar.set({ id: "branch", text: branch, visible: true });

  const pr = await pr_number();
  if (pr) muxy.statusbar.set({ id: "pr-info", text: `#${pr}`, visible: true });
  else muxy.statusbar.hide("pr-info");
}

void sync_items();
muxy.events.subscribe("project.switched", () => void sync_items());
muxy.events.subscribe("worktree.switched", () => void sync_items());
muxy.events.subscribe("file.changed", () => void sync_items());
