import { Suspense } from "react";

import UserAuthForm from "@/components/forms/user-auth-form";
import UserAuthFormSkeleton from "@/components/forms/user-auth-form-skeleton";
import { getServerMessages } from "@/lib/i18n-server";

export default async function Page() {
  const t = await getServerMessages();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl text-balance">{t.auth.signInTitle}</h1>
        <p className="text-pretty font-semibold text-muted-foreground">{t.auth.signInHelp}</p>
      </header>
      <Suspense fallback={<UserAuthFormSkeleton />}>
        <UserAuthForm />
      </Suspense>
    </div>
  );
}
