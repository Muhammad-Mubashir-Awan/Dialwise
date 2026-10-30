import type { NextRequest } from "next/server";
import { exportCsv } from "@/lib/data/export";
import { getDb } from "@/lib/db/client";
import { isUuid } from "@/lib/ids";
import { getCurrentUser } from "@/lib/session";

/** GET /api/export?type=leads|calls[&list=<id>]: a CSV download of leads or call history, signed-in only. */
export async function GET(request: NextRequest) {
  // The proxy already turns away signed-out requests; this check guards the route on its own too.
  if (!(await getCurrentUser())) return Response.json({ error: "Sign in to use this API." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  if (type !== "leads" && type !== "calls") {
    return Response.json({ error: "Use type=leads or type=calls." }, { status: 400 });
  }
  const listId = params.get("list");
  if (listId && !isUuid(listId)) return Response.json({ error: "That isn't a list id." }, { status: 400 });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(exportCsv(getDb(), { type, listId }), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
