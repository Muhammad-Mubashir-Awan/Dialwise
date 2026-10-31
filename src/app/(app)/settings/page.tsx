import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { countryOptions } from "@/lib/phone";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" />
      <PageBody>
        <Suspense fallback={<Skeleton aria-busy="true" aria-label="Loading" className="h-96 max-w-160 rounded-lg" />}>
          <Settings />
        </Suspense>
      </PageBody>
    </>
  );
}

async function Settings() {
  const user = await requireUser();
  return <SettingsForm settings={await getSettings(getDb())} countries={countryOptions()} email={user.email} />;
}
