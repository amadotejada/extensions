import { useState } from "react";
import { ChevronDown, ChevronRight, GitPullRequest, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { branch_name_from_title } from "@/lib/branch-name";
import type { CreatePrInput } from "@/hooks/use-create-pr";

interface CreatePrFormProps {
  baseBranch: string | null;
  onSubmit: (input: CreatePrInput) => Promise<boolean>;
}

export function CreatePrForm({ baseBranch, onSubmit }: CreatePrFormProps) {
  const [title, set_title] = useState("");
  const [body, set_body] = useState("");
  const [newBranch, set_new_branch] = useState("");
  const [branchEdited, set_branch_edited] = useState(false);
  const [draft, set_draft] = useState(false);
  const [advanced, set_advanced] = useState(false);
  const [busy, set_busy] = useState(false);

  const disabled = busy || title.trim() === "";

  function on_title_change(value: string) {
    set_title(value);
    if (!branchEdited) set_new_branch(value.trim() ? branch_name_from_title(value) : "");
  }

  function on_branch_change(value: string) {
    set_branch_edited(true);
    set_new_branch(value);
  }

  async function submit() {
    if (disabled) return;
    set_busy(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        baseBranch: baseBranch ?? undefined,
        newBranch: newBranch.trim() || undefined,
        draft,
      });
    } finally {
      set_busy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        rows={1}
        placeholder={baseBranch ? `Pull request title (→ ${baseBranch})` : "Pull request title"}
        value={title}
        onChange={(e) => on_title_change(e.target.value)}
        className="min-h-[32px] text-[12px]"
      />
      <Textarea
        rows={2}
        placeholder="Summary (optional)"
        value={body}
        onChange={(e) => set_body(e.target.value)}
        className="min-h-[48px] text-[12px]"
      />

      <button
        type="button"
        onClick={() => set_advanced((v) => !v)}
        className="flex items-center gap-1 self-start text-[11px] text-muted-foreground outline-none hover:text-foreground"
      >
        {advanced ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
        Advanced
      </button>
      {advanced && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="New branch name (optional)"
            value={newBranch}
            onChange={(e) => on_branch_change(e.target.value)}
            className="font-mono text-[12px]"
          />
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => set_draft(e.target.checked)}
              className="accent-primary"
            />
            Create as draft
          </label>
        </div>
      )}

      <Button
        variant={disabled ? "secondary" : "default"}
        className="h-7 gap-1 rounded-md text-[11px] font-medium"
        disabled={disabled}
        onClick={() => void submit()}
      >
        {busy ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <GitPullRequest size={11} strokeWidth={2.5} />
        )}
        Create pull request
      </Button>
    </div>
  );
}
