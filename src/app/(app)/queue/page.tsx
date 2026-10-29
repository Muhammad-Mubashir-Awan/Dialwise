import type { Metadata } from "next";
import { ComingSoon, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Queue" };

export default function Page() {
  return (
    <>
      <PageHeader title="Queue" />
      <PageBody>
        <ComingSoon what="The call queue" slice={5} />
      </PageBody>
    </>
  );
}
