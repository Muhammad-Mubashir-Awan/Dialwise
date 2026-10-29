"use client";

import { Fragment } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

const SECTIONS: { title: string; keys: [string, string[]][] }[] = [
  {
    title: "Everywhere",
    keys: [
      ["Search and commands", ["Ctrl", "K"]],
      ["Go to queue / follow-ups / leads / lists", ["G", "Q / F / L / T"]],
      ["Go to import / stats / settings", ["G", "I / S / P"]],
      ["Show shortcuts", ["?"]],
    ],
  },
  {
    title: "Queue",
    keys: [
      ["Log an outcome", ["1–9"]],
      ["Write a note", ["N"]],
      ["Leave the note field", ["Esc"]],
      ["Confirm a follow-up and go to the next lead", ["Enter"]],
      ["Skip this lead", ["S"]],
      ["Copy phone number", ["C"]],
      ["Undo the last call", ["U"]],
    ],
  },
  {
    title: "Leads",
    keys: [
      ["Search", ["/"]],
      ["Move down / up", ["J / K"]],
      ["Open lead", ["Enter"]],
      ["Add lead", ["A"]],
      ["Edit the open lead", ["E"]],
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Shortcuts work when you aren&apos;t typing in a field.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[13px]">
          {SECTIONS.map((section) => (
            <Fragment key={section.title}>
              <h3 className="col-span-2 mt-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h3>
              {section.keys.map(([label, keys]) => (
                <Fragment key={label}>
                  <dt>{label}</dt>
                  <dd className="flex justify-end">
                    <KbdGroup>
                      {keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </KbdGroup>
                  </dd>
                </Fragment>
              ))}
            </Fragment>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
