import { ChevronDown } from "lucide-react";
import type { GraphRow } from "@/lib/git-graph";
import { use_persistent_toggle } from "@/hooks/use-persistent-toggle";
import { ICON_SIZE, ICON_STROKE } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommitRow } from "./commit-row";

interface GitGraphSectionProps {
  rows: GraphRow[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onPrefillMessage: (message: string) => void;
  onRefresh: () => void;
}

export function GitGraphSection({
  rows,
  hasMore,
  loading,
  onLoadMore,
  onPrefillMessage,
  onRefresh,
}: GitGraphSectionProps) {
  const [open, toggle] = use_persistent_toggle("graph", true);

  if (rows.length === 0) return null;

  return (
    <section className="flex shrink-0 flex-col">
      <header className="group sticky top-0 z-10 flex h-[26px] shrink-0 items-center bg-background pl-2 pr-2">
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <span className="flex w-4 shrink-0 justify-center">
            <ChevronDown
              className={cn("transition-transform", !open && "-rotate-90")}
              size={ICON_SIZE.caret}
              strokeWidth={ICON_STROKE}
            />
          </span>
          <span className="truncate text-[12px] font-semibold">Git Graph</span>
        </button>
        <span className="ml-1.5 rounded-full bg-muted-foreground px-1.5 py-px text-[10px] font-bold leading-none text-background">
          {rows.length}
        </span>
      </header>
      {open && (
        <>
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <CommitRow
                key={row.commit.hash}
                row={row}
                onPrefillMessage={onPrefillMessage}
                onRefresh={onRefresh}
              />
            ))}
          </ul>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="m-1 h-7 justify-center text-[12px]"
              disabled={loading}
              onClick={onLoadMore}
            >
              {loading ? "Loading…" : "Load more"}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
