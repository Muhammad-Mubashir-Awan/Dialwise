import Link from "next/link";
import { PageBody, PageHeader } from "@/components/page-header";

export default function LeadNotFound() {
  return (
    <>
      <PageHeader title="Lead not found" />
      <PageBody>
        <div className="max-w-xl rounded-lg border bg-card px-4 py-7 text-center text-[13px] text-muted-foreground">
          <strong className="mb-1 block text-sm text-foreground">This lead doesn&apos;t exist</strong>
          It may have been deleted.{" "}
          <Link href="/leads" className="text-primary hover:underline">
            Back to all leads
          </Link>
        </div>
      </PageBody>
    </>
  );
}
