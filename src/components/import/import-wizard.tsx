"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload } from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { checkImportPhones, importBatchAction } from "@/lib/actions/import";
import {
  chunkRows,
  guessMapping,
  IMPORT_FIELDS,
  type ImportField,
  type ImportPlan,
  parseCsv,
  planImport,
  rowsToRaw,
} from "@/lib/csv";
import type { CountryOption } from "@/lib/phone";

type CsvFile = { name: string; header: string[]; rows: string[][] };
type Review = { plan: ImportPlan; existing: number; doNotCall: number };

const STEPS = ["Upload", "Match columns", "Review"];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function ImportWizard({
  lists,
  countries,
  defaultCountry,
}: {
  lists: { id: string; name: string }[];
  countries: CountryOption[];
  defaultCountry: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [country, setCountry] = useState(defaultCountry);
  const [file, setFile] = useState<CsvFile | null>(null);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const listName = lists.find((l) => l.id === listId)?.name ?? "No list";

  async function readFile(picked: File | undefined) {
    if (!picked) return;
    setFileError(null);
    if (picked.size > MAX_FILE_BYTES) {
      setFileError("That file is over 20 MB. Split it into smaller files.");
      return;
    }
    const parsed = parseCsv(await picked.text());
    if (!parsed.ok) {
      setFileError(parsed.error);
      return;
    }
    setFile({ name: picked.name, header: parsed.header, rows: parsed.rows });
    setMapping(guessMapping(parsed.header));
    setStep(2);
  }

  async function startReview() {
    if (!file) return;
    setStep(3);
    setReview(null);
    const plan = planImport(rowsToRaw(file.rows, mapping), { defaultCountry: country, listId: listId || null });
    const counts = await checkImportPhones(plan.valid.map((v) => v.values.phoneE164));
    setReview({ plan, existing: counts?.existing ?? 0, doNotCall: counts?.doNotCall ?? 0 });
  }

  async function runImport() {
    if (!file || !review) return;
    const rows = review.plan.valid.map((v) => v.raw);
    let added = 0;
    setProgress({ done: 0, total: rows.length });
    for (const batch of chunkRows(rows, { maxRows: 500, maxBytes: 700_000 })) {
      const result = await importBatchAction({
        listId: listId || null,
        defaultCountry: country,
        fileName: file.name,
        rows: batch,
      });
      if (!result.ok) {
        setProgress(null);
        toast.error(added ? `${result.error} ${added} leads were imported before this.` : result.error);
        return;
      }
      added += result.added;
      setProgress((p) => p && { ...p, done: p.done + batch.length });
    }
    // Every row of the file that didn't become a lead: already in the CRM, do not call, repeated or unusable.
    const skipped = file.rows.length - added;
    toast.success(
      `Imported ${added} ${added === 1 ? "lead" : "leads"} into ${listName}` +
        (skipped ? `. ${skipped} skipped as already in your CRM or unusable.` : ""),
    );
    router.refresh();
    router.push(listId ? `/leads?list=${listId}` : "/leads?list=none");
  }

  return (
    <div className="flex max-w-215 flex-col gap-4">
      <ol className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[13px]" aria-label="Import steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-muted-foreground",
              step === i + 1 && "font-medium text-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-5.5 place-items-center rounded-full border text-xs",
                step === i + 1 && "border-primary bg-primary text-primary-foreground",
                step > i + 1 && "border-primary text-primary",
              )}
            >
              {step > i + 1 ? <Check aria-hidden="true" className="size-3" /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="import-list" className="text-xs font-medium text-muted-foreground">
                Add leads to
              </label>
              <NativeSelect
                id="import-list"
                className="w-full"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {lists.map((list) => (
                  <NativeSelectOption key={list.id} value={list.id}>
                    {list.name}
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value="">No list</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="import-country" className="text-xs font-medium text-muted-foreground">
                Country for numbers without +code
              </label>
              <NativeSelect
                id="import-country"
                className="w-full"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <NativeSelectOption key={c.code} value={c.code}>
                    {c.name} (+{c.dial})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void readFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-card px-4 py-9 text-center",
              dragging && "border-primary bg-accent",
            )}
          >
            <Upload aria-hidden="true" className="size-6 text-muted-foreground" />
            <strong className="font-medium">Drop a CSV file here</strong>
            <p className="text-[13px] text-muted-foreground">
              One lead per row. A header row is needed. Up to 10,000 rows.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <label htmlFor="import-file" className={cn(buttonVariants(), "cursor-pointer")}>
                Choose file
              </label>
              <input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void readFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <a href="/lead-template.csv" download className={buttonVariants({ variant: "outline" })}>
                Download a template
              </a>
            </div>
          </div>
          {fileError && (
            <p role="alert" className="text-sm text-destructive">
              {fileError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Duplicates are matched on the phone number after it&apos;s converted to international format, so 020 7946
            0118 and +44 20 7946 0118 count as the same lead. Numbers on your do-not-call list are skipped.
          </p>
        </>
      )}

      {step === 2 && file && (
        <>
          <p className="text-[13px]">
            <strong className="font-medium">{file.name}</strong>{" "}
            <span className="text-muted-foreground">
              · {file.rows.length.toLocaleString("en-GB")} {file.rows.length === 1 ? "row" : "rows"}
            </span>
          </p>
          <div className="relative overflow-x-auto rounded-lg border bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="[&>th]:h-8.5 [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground">
                  <th>Column in your file</th>
                  <th className="max-md:hidden">Example value</th>
                  <th>Import as</th>
                </tr>
              </thead>
              <tbody>
                {file.header.map((column, i) => (
                  <tr key={i} className="[&>td]:h-11 [&>td]:border-b [&>td]:px-3 [&>td]:py-1 last:[&>td]:border-b-0">
                    <td className="font-medium">{column || `Column ${i + 1}`}</td>
                    <td className="max-w-60 truncate text-muted-foreground max-md:hidden">{file.rows[0]?.[i]}</td>
                    <td>
                      <NativeSelect
                        className="min-w-36"
                        aria-label={`Import ${column || `column ${i + 1}`} as`}
                        value={mapping[i]}
                        onChange={(e) =>
                          setMapping((m) => m.map((field, j) => (j === i ? (e.target.value as ImportField) : field)))
                        }
                      >
                        {IMPORT_FIELDS.map(([value, label]) => (
                          <NativeSelectOption key={value} value={value}>
                            {label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!mapping.includes("phone") && (
            <p role="alert" className="text-sm text-destructive">
              Pick the column that holds phone numbers. Leads can&apos;t be imported without one.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={startReview} disabled={!mapping.includes("phone")}>
              Review import
            </Button>
          </div>
        </>
      )}

      {step === 3 && file && (
        <>
          {!review ? (
            <p role="status" className="text-sm text-muted-foreground">
              Checking {file.rows.length.toLocaleString("en-GB")} rows…
            </p>
          ) : (
            <ReviewStep review={review} listName={listName} />
          )}
          {progress && (
            <div role="status" className="flex flex-col gap-1.5 text-[13px]">
              Importing {progress.done.toLocaleString("en-GB")} of {progress.total.toLocaleString("en-GB")}…
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} disabled={!!progress}>
              Back
            </Button>
            {review && (
              <Button onClick={runImport} disabled={!!progress || toAdd(review) === 0}>
                Import {toAdd(review).toLocaleString("en-GB")} {toAdd(review) === 1 ? "lead" : "leads"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const toAdd = (review: Review) => Math.max(0, review.plan.valid.length - review.existing - review.doNotCall);

function ReviewStep({ review, listName }: { review: Review; listName: string }) {
  const tiles: [string, number, string][] = [
    ["Will be added", toAdd(review), `to ${listName}`],
    ["Already in your CRM", review.existing + review.plan.repeated, "skipped"],
    ["Invalid phone", review.plan.invalid.length, "skipped"],
    ["On do-not-call list", review.doNotCall, "skipped"],
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, value, detail]) => (
          <div key={label} className="flex flex-col gap-1 rounded-lg border bg-card p-3.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-mono text-2xl font-semibold tabular-nums">{value.toLocaleString("en-GB")}</span>
            <span className="truncate text-xs text-subtle-foreground">{detail}</span>
          </div>
        ))}
      </div>
      {review.plan.invalid.length > 0 && (
        <section aria-labelledby="invalid-rows" className="rounded-lg border bg-card">
          <h2 id="invalid-rows" className="border-b px-4 py-3 text-sm font-semibold">
            Rows with an invalid phone
          </h2>
          <ul className="m-0 list-none p-4 text-[13px]">
            {review.plan.invalid.slice(0, 5).map(({ row, raw }) => (
              <li key={row} className="truncate font-mono text-muted-foreground">
                Line {row}: {[raw.name, raw.company, raw.phone || "(no phone)"].filter(Boolean).join(", ")}
              </li>
            ))}
            {review.plan.invalid.length > 5 && (
              <li className="mt-1 text-muted-foreground">and {review.plan.invalid.length - 5} more</li>
            )}
          </ul>
        </section>
      )}
    </>
  );
}
