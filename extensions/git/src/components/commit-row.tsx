import type { GraphRow } from "@/lib/git-graph";
import { relative_time } from "@/lib/git-graph";
import { open_commit_diff } from "@/lib/git";
import { CommitGraphRail } from "./commit-graph-rail";
import { CommitRefs } from "./commit-refs";
import { CommitMenu } from "./commit-menu";

interface CommitRowProps {
  row: GraphRow;
  onPrefillMessage: (message: string) => void;
  onRefresh: () => void;
}

export function CommitRow({ row, onPrefillMessage, onRefresh }: CommitRowProps) {
  const { commit, lane } = row;
  return (
    <li
      className="group flex h-[34px] cursor-pointer items-center gap-2 pl-2.5 pr-2.5 hover:bg-accent"
      onClick={() => void open_commit_diff(commit.hash, commit.shortHash)}
    >
      <CommitGraphRail lane={lane} />
      <span
        className="min-w-[60px] flex-1 truncate text-left text-[12px] font-medium text-foreground"
        title={commit.subject}
      >
        {commit.subject}
      </span>
      <span className="flex min-w-0 max-w-[45%] shrink justify-end">
        <CommitRefs refs={commit.refs} />
      </span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground" title={commit.hash}>
        {commit.shortHash}
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground" title={commit.authorName}>
        {relative_time(commit.authorDate)}
      </span>
      <CommitMenu commit={commit} onPrefillMessage={onPrefillMessage} onRefresh={onRefresh} />
    </li>
  );
}
