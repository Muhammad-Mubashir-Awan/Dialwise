"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useRef } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { saveSettings, type SettingsFormState } from "@/lib/actions/settings";
import type { Settings } from "@/lib/db/schema";
import type { CountryOption } from "@/lib/phone";
import { sessionEnded } from "@/lib/session-ended";
import type { SettingsField } from "@/lib/settings-input";

type FormState = SettingsFormState & { failed?: boolean };

// Monday first, as the week reads; the values are 0 = Sunday … 6 = Saturday.
const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
] as const;

/** The same text for the same settings, whichever order the fields come in. */
const fingerprint = (entries: [string, FormDataEntryValue][]) =>
  JSON.stringify(entries.map(([name, value]) => `${name}=${value}`).sort());

const fingerprintOfForm = (form: HTMLFormElement) => fingerprint([...new FormData(form)]);

const fingerprintOfSettings = (settings: Settings) =>
  fingerprint([
    ["callWindowStart", settings.callWindowStart.slice(0, 5)],
    ["callWindowEnd", settings.callWindowEnd.slice(0, 5)],
    ...settings.callDays.map((day): [string, string] => ["callDays", String(day)]),
    ["retryGapHours", String(settings.retryGapHours)],
    ["defaultCountry", settings.defaultCountry],
  ]);

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card">
      <h2 id={id} className="border-b px-4 py-3 text-sm font-semibold">
        {title}
      </h2>
      <div className="flex flex-col gap-3.5 p-4">{children}</div>
    </section>
  );
}

export function SettingsForm({
  settings,
  countries,
  email,
}: {
  settings: Settings;
  countries: CountryOption[];
  email: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // What the server last got, so leaving a field without changing it doesn't save.
  const lastSent = useRef(fingerprintOfSettings(settings));
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, data: FormData): Promise<FormState> => {
      try {
        return await saveSettings(prev, data);
      } catch (error) {
        unstable_rethrow(error); // Being sent to sign-in isn't a failure.
        if (await sessionEnded()) window.location.reload();
        lastSent.current = ""; // So the same values can be sent again.
        return { errors: {}, version: prev.version, failed: true };
      }
    },
    { errors: {}, version: settings.updatedAt.getTime() },
  );

  const save = () => {
    const form = formRef.current;
    if (!form || fingerprintOfForm(form) === lastSent.current) return;
    lastSent.current = fingerprintOfForm(form);
    const data = new FormData(form);
    startTransition(() => formAction(data));
  };

  const saveEarlyEdits = useEffectEvent(save);
  useEffect(() => {
    // A change made before the form was live never reached the handlers, so it's picked up here.
    saveEarlyEdits();
    // Tells browser tests the form is live, so they don't type before it can save.
    if (formRef.current) formRef.current.dataset.ready = "true";
  }, []);
  // Typed fields save when you leave them or press Enter, not on every key.
  const saveOnEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    save();
  };

  const { errors, savedAt, conflict, failed } = state;
  const fieldProps = (name: SettingsField) => ({
    id: `settings-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `settings-${name}-error` : undefined,
  });
  const error = (name: SettingsField) =>
    errors[name] ? <FieldError id={`settings-${name}-error`}>{errors[name]}</FieldError> : null;

  const status = pending
    ? "Saving…"
    : conflict
      ? "Not saved: someone else just changed these settings. Reload to see them."
      : failed
        ? "Couldn't save. Check your connection and try again."
        : Object.keys(errors).length > 0
          ? "Not saved. Fix the field marked above."
          : savedAt
            ? `Saved at ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
            : "Changes save as you make them.";

  return (
    <form ref={formRef} noValidate autoComplete="off" className="flex max-w-160 flex-col gap-4">
      <Panel id="settings-call-hours" title="Call hours">
        <p className="text-[13px] text-muted-foreground">
          The queue only serves leads whose local time is inside these hours. Leads with an unknown time zone are always
          served.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!errors.callWindowStart}>
            <FieldLabel htmlFor="settings-callWindowStart">From (their time)</FieldLabel>
            <Input
              {...fieldProps("callWindowStart")}
              type="time"
              className="font-mono"
              defaultValue={settings.callWindowStart.slice(0, 5)}
              onBlur={save}
              onKeyDown={saveOnEnter}
            />
            {error("callWindowStart")}
          </Field>
          <Field data-invalid={!!errors.callWindowEnd}>
            <FieldLabel htmlFor="settings-callWindowEnd">Until (their time)</FieldLabel>
            <Input
              {...fieldProps("callWindowEnd")}
              type="time"
              className="font-mono"
              defaultValue={settings.callWindowEnd.slice(0, 5)}
              onBlur={save}
              onKeyDown={saveOnEnter}
            />
            {error("callWindowEnd")}
          </Field>
        </div>
        <FieldSet
          className="gap-0"
          aria-invalid={errors.callDays ? true : undefined}
          aria-describedby={errors.callDays ? "settings-callDays-error" : undefined}
        >
          <FieldLegend variant="label">Days</FieldLegend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map(([value, label]) => (
              <label key={value} className="relative">
                <input
                  type="checkbox"
                  name="callDays"
                  value={value}
                  defaultChecked={settings.callDays.includes(value)}
                  onChange={save}
                  className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0"
                />
                <span className="grid h-8 w-11 place-items-center rounded-md border border-input bg-card text-[13px] peer-checked:border-primary peer-checked:bg-accent peer-checked:font-medium peer-checked:text-accent-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {errors.callDays && (
            <FieldError id="settings-callDays-error" className="mt-1.5">
              {errors.callDays}
            </FieldError>
          )}
        </FieldSet>
      </Panel>

      <Panel id="settings-retries" title="Retries">
        <Field data-invalid={!!errors.retryGapHours}>
          <FieldLabel htmlFor="settings-retryGapHours">Wait after no answer or voicemail</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="w-22.5">
              <Input
                {...fieldProps("retryGapHours")}
                type="number"
                inputMode="numeric"
                min={1}
                max={168}
                className="font-mono"
                defaultValue={settings.retryGapHours}
                onBlur={save}
                onKeyDown={saveOnEnter}
              />
            </div>
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
          {error("retryGapHours")}
        </Field>
      </Panel>

      <Panel id="settings-phone" title="Phone numbers">
        <Field data-invalid={!!errors.defaultCountry} className="max-w-80">
          <FieldLabel htmlFor="settings-defaultCountry">Default country</FieldLabel>
          <NativeSelect
            {...fieldProps("defaultCountry")}
            className="w-full"
            defaultValue={settings.defaultCountry}
            onChange={save}
            aria-describedby={errors.defaultCountry ? "settings-defaultCountry-error" : "settings-defaultCountry-help"}
          >
            {countries.map((c) => (
              <NativeSelectOption key={c.code} value={c.code}>
                {c.name} (+{c.dial})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {error("defaultCountry") ?? (
            <FieldDescription id="settings-defaultCountry-help" className="text-xs">
              Used when a number has no +code.
            </FieldDescription>
          )}
        </Field>
      </Panel>

      <Panel id="settings-account" title="Account">
        <p className="text-[13px]">
          Signed in with Google as <span className="font-mono break-all">{email}</span>. Everyone on the allowed list
          shares this CRM and these settings.
        </p>
      </Panel>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p role="status" className="text-xs text-muted-foreground">
          {status}
        </p>
        {!pending && conflict && (
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        )}
        {!pending && failed && !conflict && (
          <Button type="button" variant="outline" size="sm" onClick={save}>
            Try again
          </Button>
        )}
      </div>
    </form>
  );
}
