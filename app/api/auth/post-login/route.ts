import { NextResponse } from "next/server";

import { getPostLoginRedirect, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession({ allowInactive: true });
  const url = new URL(getPostLoginRedirect(session), request.url);

  return NextResponse.redirect(url);
}
