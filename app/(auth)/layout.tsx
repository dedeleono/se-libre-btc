import Image from "next/image";
import Link from "next/link";

import { MAIN_CONTENT_ID } from "@/components/layout/skip-link";
import Logo from "@/components/logo";
import { getServerMessages } from "@/lib/i18n-server";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const t = getServerMessages();

  return (
    <div className="dl-app grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      <div className="relative hidden min-h-screen overflow-hidden border-r-2 border-foreground bg-[var(--volcan-900)] p-10 text-[var(--crema-050)] lg:flex">
        <div className="absolute inset-0 dl-stamped opacity-60" />
        <Image
          src="/images/se_libre/25.png"
          alt=""
          width={1545}
          height={2000}
          className="absolute inset-y-0 right-0 h-full w-auto opacity-70"
          priority
        />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <Logo width={210} height={52} />
          <div className="max-w-xl">
            <div className="page-eyebrow text-[var(--cafe-300)]">{t.auth.heroEyebrow}</div>
            <p className="dl-display mt-4 text-7xl text-[var(--crema-050)]">
              {t.auth.heroTitle}
            </p>
            <p className="mt-6 max-w-md text-lg font-semibold leading-relaxed text-[var(--cafe-300)]">
              {t.auth.heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      <main id={MAIN_CONTENT_ID} className="flex min-h-screen items-center p-4 lg:p-10">
        <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center space-y-6">
          <Link href="/" className="w-fit">
            <Logo alt="Dinero Libre" width={210} height={52} />
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
