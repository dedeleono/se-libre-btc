import Link from "next/link";

import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";
import { Button } from "@/components/ui/button";
import { parseErrorCode } from "@/lib/error-codes";
import { getServerMessages } from "@/lib/i18n-server";

export default async function ErrorPage(props: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await props.searchParams;
  const t = await getServerMessages();
  const known = parseErrorCode(code);
  const copy = known
    ? t.errors.pages[known]
    : { title: t.common.somethingWentWrong, body: t.errors.genericBody };

  return (
    <main id={MAIN_CONTENT_ID} className="dl-app grid min-h-screen place-items-center p-4">
      <div className="stamp-card w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-3xl text-balance">{copy.title}</h1>
        <p className="text-pretty font-semibold text-muted-foreground">{copy.body}</p>
        <Button asChild>
          <Link href="/sign-in">{t.nav.signIn}</Link>
        </Button>
      </div>
    </main>
  );
}
