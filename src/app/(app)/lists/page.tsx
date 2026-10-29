import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Lists" };

export default function Page() {
  return (
    <>
      <PageHeader title="Lists" />
      <PageBody>
        <ComingSoon what="Call lists" slice={4} />
      </PageBody>
    </>
  );
}
