"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { type LeadFormState, saveLead } from "@/lib/actions/leads";
import type { LeadField } from "@/lib/lead-input";
import type { LeadFormOptions } from "@/lib/lead-form-options";
import { timeZoneLabel } from "@/lib/timezones";

/** A lead as the edit form shows it. */
export type FormLead = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  /** International format, e.g. "+44 20 7946 0118". */
  phone: string;
  country: string | null;
  timezone: string | null;
  email: string | null;
  website: string | null;
  listId: string | null;
  tags: string[];
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: LeadFormOptions;
  /** Edit this lead; without it the form adds a new one. */
  lead?: FormLead;
  /** Pre-selects a list when adding (e.g. the list the leads table is filtered to). */
  defaultListId?: string;
};

export function LeadFormDialog({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        {/* Mounted only while open, so each opening starts with a fresh form. */}
        <LeadForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

const INITIAL: LeadFormState = { errors: {}, submittedAt: 0 };

function LeadForm({
  options,
  lead,
  defaultListId,
  onDone,
}: Omit<Props, "open" | "onOpenChange"> & { onDone: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [country, setCountry] = useState(lead?.country ?? options.defaultCountry);
  const [timezone, setTimezone] = useState(lead?.timezone ?? "");

  const [state, formAction, pending] = useActionState(async (prev: LeadFormState, data: FormData) => {
    const next = await saveLead(prev, data);
    if (next.saved) {
      toast.success(next.saved.created ? `Added ${next.saved.name}` : "Lead saved");
      onDone();
      if (next.saved.created) router.push(`/leads/${next.saved.id}`);
    } else {
      const first = FIELD_ORDER.find((field) => next.errors[field]);
      if (first) (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
    }
    return next;
  }, INITIAL);

  const choice = options.zones[country] ?? { zones: [], guess: null };
  const zones = timezone && !choice.zones.includes(timezone) ? [timezone, ...choice.zones] : choice.zones;
  const countryName = options.countries.find((c) => c.code === country)?.name;
  const errors = state.errors;
  const fieldProps = (name: LeadField) => ({
    id: `lead-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `lead-${name}-error` : undefined,
  });
  const error = (name: LeadField) =>
    errors[name] ? <FieldError id={`lead-${name}-error`}>{errors[name]}</FieldError> : null;

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-4"
      onSubmit={(e) => {
        // Submitting through startTransition (not the action prop) keeps what was typed if validation fails.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <DialogHeader>
        <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
        <DialogDescription>Name and phone are required. Everything else can be added later.</DialogDescription>
      </DialogHeader>
      {lead && <input type="hidden" name="id" value={lead.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="lead-name">Name *</FieldLabel>
          <Input {...fieldProps("name")} defaultValue={lead?.name} autoComplete="off" autoFocus />
          {error("name")}
        </Field>
        <Field data-invalid={!!errors.company}>
          <FieldLabel htmlFor="lead-company">Company</FieldLabel>
          <Input {...fieldProps("company")} defaultValue={lead?.company ?? ""} autoComplete="off" />
          {error("company")}
        </Field>
        <Field data-invalid={!!errors.role}>
          <FieldLabel htmlFor="lead-role">Role</FieldLabel>
          <Input
            {...fieldProps("role")}
            defaultValue={lead?.role ?? ""}
            placeholder="e.g. Founder"
            autoComplete="off"
          />
          {error("role")}
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="lead-email">Email</FieldLabel>
          <Input {...fieldProps("email")} type="email" defaultValue={lead?.email ?? ""} autoComplete="off" />
          {error("email")}
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="lead-phone">Phone *</FieldLabel>
          <Input
            {...fieldProps("phone")}
            type="tel"
            className="font-mono"
            defaultValue={lead?.phone}
            autoComplete="off"
            aria-describedby={errors.phone ? "lead-phone-error" : "lead-phone-help"}
          />
          {error("phone") ?? (
            <FieldDescription id="lead-phone-help" className="text-xs">
              Local or international format. Saved as +countrycode.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="lead-country">Country</FieldLabel>
          <NativeSelect
            {...fieldProps("country")}
            className="w-full"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setTimezone("");
            }}
          >
            {options.countries.map((c) => (
              <NativeSelectOption key={c.code} value={c.code}>
                {c.name} (+{c.dial})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="lead-timezone">Time zone</FieldLabel>
          <NativeSelect
            {...fieldProps("timezone")}
            className="w-full"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            aria-describedby={!timezone && !choice.guess ? "lead-timezone-help" : undefined}
          >
            <NativeSelectOption value="">
              {choice.guess ? `Automatic (${timeZoneLabel(choice.guess)})` : "Not known"}
            </NativeSelectOption>
            {zones.map((zone) => (
              <NativeSelectOption key={zone} value={zone}>
                {timeZoneLabel(zone)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {!timezone && !choice.guess && zones.length > 1 && (
            <FieldDescription id="lead-timezone-help" className="text-xs">
              {countryName ?? "This country"} has several time zones. Pick one so call hours apply.
            </FieldDescription>
          )}
        </Field>
        <Field data-invalid={!!errors.listId}>
          <FieldLabel htmlFor="lead-listId">List</FieldLabel>
          <NativeSelect {...fieldProps("listId")} className="w-full" defaultValue={lead?.listId ?? defaultListId ?? ""}>
            <NativeSelectOption value="">No list</NativeSelectOption>
            {options.lists.map((list) => (
              <NativeSelectOption key={list.id} value={list.id}>
                {list.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {error("listId")}
        </Field>
        <Field data-invalid={!!errors.website}>
          <FieldLabel htmlFor="lead-website">Website</FieldLabel>
          <Input
            {...fieldProps("website")}
            defaultValue={lead?.website ?? ""}
            placeholder="example.com"
            autoComplete="off"
          />
          {error("website")}
        </Field>
      </div>

      <Field data-invalid={!!errors.tags}>
        <FieldLabel htmlFor="lead-tags">Tags</FieldLabel>
        <Input
          {...fieldProps("tags")}
          defaultValue={lead?.tags.join(", ")}
          placeholder="saas, warm"
          autoComplete="off"
          aria-describedby={errors.tags ? "lead-tags-error" : "lead-tags-help"}
        />
        {error("tags") ?? (
          <FieldDescription id="lead-tags-help" className="text-xs">
            Separate tags with commas.
          </FieldDescription>
        )}
      </Field>
      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
        <Textarea {...fieldProps("notes")} defaultValue={lead?.notes ?? ""} rows={3} />
        {error("notes")}
      </Field>

      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : lead ? "Save changes" : "Add lead"}
        </Button>
      </DialogFooter>
    </form>
  );
}

const FIELD_ORDER: LeadField[] = ["name", "company", "role", "email", "phone", "listId", "website", "tags", "notes"];
