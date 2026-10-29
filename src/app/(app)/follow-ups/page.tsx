import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Follow-ups" };

export default function Page() {
  return (
    <>
      <PageHeader title="Follow-ups" />
      <PageBody>
        <ComingSoon what="Due and overdue follow-ups" slice={6} />
      </PageBody>
    </>
  );
}
