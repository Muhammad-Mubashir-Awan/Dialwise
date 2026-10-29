"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteLeadAction } from "@/lib/actions/leads";

export function DeleteLead({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
        Delete lead
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm delete">
      <span className="text-[13px]">Delete {name} and their call history?</span>
      <Button
        variant="destructive"
        disabled={pending}
        autoFocus
        onClick={() =>
          startTransition(async () => {
            const result = await deleteLeadAction(id);
            if (result.ok) {
              toast.success(`Deleted ${result.name}`);
              router.push("/leads");
            } else {
              toast.error(result.error);
            }
          })
        }
      >
        {pending ? "Deleting…" : "Delete lead"}
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </div>
  );
}
