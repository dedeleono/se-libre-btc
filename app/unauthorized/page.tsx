import { UserRole } from "@prisma/client";
import Link from "next/link";

import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getServerMessages } from "@/lib/i18n-server";

export default async function UnauthorizedPage() {
  const session = await auth();
  const t = await getServerMessages();
  const role = session?.user.role;
  const href =
    role === UserRole.ADMIN ? "/admin" : role === UserRole.STUDENT ? "/student" : "/sign-in";
  const label = role ? t.errors.goToDashboard : t.nav.signIn;

  return (
    <main id={MAIN_CONTENT_ID} className="dl-app grid min-h-screen place-items-center p-4">
      <div className="stamp-card w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-3xl text-balance">{t.errors.unauthorizedTitle}</h1>
        <p className="text-pretty font-semibold text-muted-foreground">{t.errors.unauthorizedBody}</p>
        <Button asChild>
          <Link href={href}>{label}</Link>
        </Button>
      </div>
    </main>
  );
}
