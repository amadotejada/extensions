import { MoreHorizontal } from "lucide-react";
import type { CommitNode } from "@/lib/git-graph";
import { ICON_SIZE, ICON_STROKE } from "@/lib/icons";
import { open_commit_diff } from "@/lib/git";
import {
  copy_hash,
  open_commit_on_github,
  cherry_pick_commit,
  revert_commit,
} from "@/lib/git-commit-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommitMenuProps {
  commit: CommitNode;
  onPrefillMessage: (message: string) => void;
  onRefresh: () => void;
}

export function CommitMenu({ commit, onPrefillMessage, onRefresh }: CommitMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="flex size-[18px] shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
          title="More actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={ICON_SIZE.row} strokeWidth={ICON_STROKE} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => void open_commit_diff(commit.hash, commit.shortHash)}>
          View diff
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy_hash(commit)}>Copy hash</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void open_commit_on_github(commit)}>
          Open on GitHub
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void cherry_pick_commit(commit, onRefresh)}>
          Cherry-pick
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void revert_commit(commit, onPrefillMessage, onRefresh)}>
          Revert
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
