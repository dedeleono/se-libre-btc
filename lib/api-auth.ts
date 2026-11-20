import "server-only";
import { NextResponse } from "next/server";

import { auth, type AppSession } from "@/lib/auth";
import { decideAdmin } from "@/lib/authz";

export type ApiAuthResult =
  | { ok: true; session: AppSession }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<ApiAuthResult> {
  const decision = decideAdmin(await auth());
  if (decision.ok) return decision;
  return {
    ok: false,
    response: new NextResponse(decision.status === 401 ? "Unauthorized" : "Forbidden", {
      status: decision.status,
    }),
  };
}
