import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Stats" };

export default function Page() {
  return (
    <>
      <PageHeader title="Stats" />
      <PageBody>
        <ComingSoon what="Call stats" slice={8} />
      </PageBody>
    </>
  );
}
