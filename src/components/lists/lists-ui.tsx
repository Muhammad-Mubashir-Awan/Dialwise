"use client";

import { createContext, startTransition, use, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteListAction, type ListFormState, saveList } from "@/lib/actions/lists";
import type { ListSummary } from "@/lib/data/lists";
import { queueHref } from "@/lib/queue";

// The header's "New list" button opens the form in the page body.
const NewListContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function ListsPageProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <NewListContext value={{ open, setOpen }}>{children}</NewListContext>;
}

export function NewListButton() {
  const { setOpen } = use(NewListContext);
  return (
    <Button onClick={() => setOpen(true)}>
      <Plus aria-hidden="true" />
      New list
    </Button>
  );
}

const INITIAL: ListFormState = { submittedAt: 0 };

/** Name field with Save and Cancel, for creating (no id) or renaming a list. */
function ListNameForm({
  id,
  name = "",
  submitLabel,
  onDone,
  className,
}: {
  id?: string;
  name?: string;
  submitLabel: string;
  onDone: () => void;
  className?: string;
}) {
  const inputId = id ? `list-name-${id}` : "new-list-name";
  const [state, formAction, pending] = useActionState(async (prev: ListFormState, data: FormData) => {
    const next = await saveList(prev, data);
    if (next.savedName) {
      toast.success(id ? `Renamed to ${next.savedName}` : `Created ${next.savedName}`);
      onDone();
    }
    return next;
  }, INITIAL);

  return (
    <form
      noValidate
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onDone();
      }}
    >
      {id && <input type="hidden" name="id" value={id} />}
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
        <label htmlFor={inputId} className={id ? "sr-only" : "text-xs font-medium text-muted-foreground"}>
          List name
        </label>
        <Input
          id={inputId}
          name="name"
          defaultValue={name}
          placeholder="e.g. Accountants in Leeds"
          autoComplete="off"
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? `${inputId}-error` : undefined}
        />
        {state.error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}

export function NewListForm() {
  const { open, setOpen } = use(NewListContext);
  if (!open) return null;
  return (
    <ListNameForm
      submitLabel="Create list"
      onDone={() => setOpen(false)}
      className="mb-3 flex max-w-250 flex-wrap items-end gap-2 rounded-lg border bg-card p-3"
    />
  );
}

/** `ready` maps a list id to how many of its leads can be called now. */
export function ListsTable({ lists, ready }: { lists: ListSummary[]; ready: Record<string, number> }) {
  const { setOpen } = use(NewListContext);
  if (lists.length === 0) {
    return (
      <div className="max-w-250 rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
        <strong className="mb-1 block text-base font-medium text-foreground">No lists yet</strong>
        Lists group leads into campaigns, so you can work one at a time.{" "}
        <button type="button" onClick={() => setOpen(true)} className="text-primary hover:underline">
          Create a list
        </button>
      </div>
    );
  }
  return (
    <div className="relative max-w-250 overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="[&>th]:h-8.5 [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground [&>th.num]:text-right">
            <th>List</th>
            <th className="num">Leads</th>
            <th className="num">Never called</th>
            <th className="num">Calls</th>
            <th className="num">Conversation rate</th>
            <th className="num">Interested or booked</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => (
            <ListRow key={list.id} list={list} ready={ready[list.id] ?? 0} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRow({ list, ready }: { list: ListSummary; ready: number }) {
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [pending, startDelete] = useTransition();
  const rate = list.calls ? Math.round((list.conversations / list.calls) * 100) : 0;
  const cell = "h-11 border-b px-3 py-1 whitespace-nowrap";
  const num = `${cell} text-right font-mono tabular-nums`;

  if (mode === "rename") {
    return (
      <tr className="[&:last-child>td]:border-b-0">
        <td colSpan={7} className={cell}>
          <ListNameForm
            id={list.id}
            name={list.name}
            submitLabel="Save"
            onDone={() => setMode("view")}
            className="flex flex-wrap items-center gap-2 py-1"
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="[&:last-child>td]:border-b-0">
      <td className={cell}>
        <Link href={`/leads?list=${list.id}`} className="font-medium hover:underline">
          {list.name}
        </Link>
      </td>
      <td className={num}>{list.leads}</td>
      <td className={num}>{list.neverCalled}</td>
      <td className={num}>{list.calls}</td>
      <td className={num}>{rate}%</td>
      <td className={num}>{list.interestedOrBooked}</td>
      <td className={`${cell} text-right`}>
        {mode === "delete" ? (
          <div
            className="flex items-center justify-end gap-2"
            role="group"
            aria-label={`Confirm deleting ${list.name}`}
          >
            <span className="text-[13px] whitespace-normal">
              Delete this list? {list.leads === 1 ? "Its lead stays" : `Its ${list.leads} leads stay`}, with no list.
            </span>
            <Button
              variant="destructive"
              autoFocus
              disabled={pending}
              onClick={() =>
                startDelete(async () => {
                  const result = await deleteListAction(list.id);
                  if (result.ok) toast.success(`Deleted ${result.name}`);
                  else toast.error(result.error);
                })
              }
            >
              {pending ? "Deleting…" : "Delete list"}
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => setMode("view")}>
              Keep
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {ready > 0 ? (
              <Button variant="outline" asChild>
                <Link href={queueHref(list.id)} aria-label={`Work ${list.name}: ${ready} ready`}>
                  Work list · {ready}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled aria-label={`Nobody in ${list.name} to call now`}>
                Work list
              </Button>
            )}
            <Button variant="ghost" onClick={() => setMode("rename")} aria-label={`Rename ${list.name}`}>
              Rename
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setMode("delete")}
              aria-label={`Delete ${list.name}`}
            >
              Delete
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
