import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Import" };

export default function Page() {
  return (
    <>
      <PageHeader title="Import" />
      <PageBody>
        <ComingSoon what="CSV import" slice={7} />
      </PageBody>
    </>
  );
}
