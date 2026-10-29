"use client";

import { createContext, use, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { isTypingTarget } from "@/lib/hotkeys";
import type { LeadFormOptions } from "@/lib/lead-form-options";
import { type FormLead, LeadFormDialog } from "./lead-form-dialog";

const DialogState = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

/**
 * Holds the lead form's open state and its keyboard shortcut. It wraps the page outside any Suspense boundary,
 * so the shortcut works as soon as the page loads, even before the button (which needs data) has streamed in.
 */
export function LeadDialogShortcut({ shortcut, children }: { shortcut: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== shortcut || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target) || document.querySelector("[role='dialog']")) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    // Lets e2e tests wait until the shortcut is live; this part of the page can hydrate after the shell.
    document.documentElement.dataset.leadShortcut = shortcut;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      delete document.documentElement.dataset.leadShortcut;
    };
  }, [shortcut]);
  return <DialogState value={{ open, setOpen }}>{children}</DialogState>;
}

export function AddLeadButton({ options, defaultListId }: { options: LeadFormOptions; defaultListId?: string }) {
  const { open, setOpen } = use(DialogState);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add lead
        <Kbd className="bg-primary-foreground/15 text-primary-foreground max-md:hidden">A</Kbd>
      </Button>
      <LeadFormDialog open={open} onOpenChange={setOpen} options={options} defaultListId={defaultListId} />
    </>
  );
}

export function EditLeadButton({ options, lead }: { options: LeadFormOptions; lead: FormLead }) {
  const { open, setOpen } = use(DialogState);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil aria-hidden="true" />
        Edit
        <Kbd className="max-md:hidden">E</Kbd>
      </Button>
      <LeadFormDialog open={open} onOpenChange={setOpen} options={options} lead={lead} />
    </>
  );
}
