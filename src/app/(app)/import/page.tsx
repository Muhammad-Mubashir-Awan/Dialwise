import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportWizard } from "@/components/import/import-wizard";
import { PageBody, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { allLists } from "@/lib/data/lists";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { countryOptions } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Import" };

export default function Page() {
  return (
    <>
      <PageHeader title="Import" />
      <PageBody>
        <Suspense fallback={<Skeleton aria-busy="true" aria-label="Loading" className="h-72 max-w-215 rounded-lg" />}>
          <Import />
        </Suspense>
      </PageBody>
    </>
  );
}

async function Import() {
  await requireUser();
  const db = getDb();
  const [lists, settings] = await Promise.all([allLists(db), getSettings(db)]);
  return <ImportWizard lists={lists} countries={countryOptions()} defaultCountry={settings.defaultCountry} />;
}
