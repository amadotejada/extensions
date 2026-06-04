import type { CommitRef } from "@/lib/git-graph";
import { cn } from "@/lib/utils";

interface CommitRefsProps {
  refs: CommitRef[];
}

type RefStyle = "head" | "tag" | "remote" | "branch";

function classify(ref: CommitRef): RefStyle {
  const kind = ref.kind.toLowerCase();
  const name = ref.name.toLowerCase();
  if (kind.includes("tag")) return "tag";
  if (kind.includes("remote") || name.startsWith("origin/") || name.includes("/")) return "remote";
  if (kind.includes("head") || name === "head") return "head";
  return "branch";
}

const STYLES: Record<RefStyle, string> = {
  head: "bg-primary/15 text-primary",
  branch: "bg-primary/10 text-primary",
  remote: "bg-muted text-muted-foreground",
  tag: "bg-diff-add/15 text-diff-add",
};

const MAX_VISIBLE = 2;

export function CommitRefs({ refs }: CommitRefsProps) {
  if (refs.length === 0) return null;
  const visible = refs.slice(0, MAX_VISIBLE);
  const hidden = refs.length - visible.length;

  return (
    <span className="flex min-w-0 shrink items-center gap-1">
      {visible.map((ref) => (
        <span
          key={`${ref.kind}-${ref.name}`}
          className={cn(
            "max-w-[88px] shrink truncate rounded px-1.5 py-px text-[10px] font-medium leading-tight",
            STYLES[classify(ref)],
          )}
          title={ref.name}
        >
          {ref.name}
        </span>
      ))}
      {hidden > 0 && (
        <span
          className="shrink-0 rounded bg-muted px-1 py-px text-[10px] font-medium leading-tight text-muted-foreground"
          title={refs.slice(MAX_VISIBLE).map((r) => r.name).join(", ")}
        >
          +{hidden}
        </span>
      )}
    </span>
  );
}
