import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Leads" };

export default function Page() {
  return (
    <>
      <PageHeader title="Leads" />
      <PageBody>
        <ComingSoon what="Leads table with filters" slice={4} />
      </PageBody>
    </>
  );
}
