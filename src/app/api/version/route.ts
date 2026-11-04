import { getVersion } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** The data's fingerprint, polled by LiveRefresh. Behind the group code like every page. */
export async function GET() {
  return Response.json({ v: await getVersion() }, { headers: { "Cache-Control": "no-store" } });
}
