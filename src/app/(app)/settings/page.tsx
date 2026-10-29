import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" />
      <PageBody>
        <ComingSoon what="Call hours, retries and phone settings" slice={5} />
      </PageBody>
    </>
  );
}
