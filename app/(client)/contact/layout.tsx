import Image from "next/image";
import { getServerMessages } from "@/lib/i18n-server";

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = getServerMessages();

  return (
    <div className="dl-app min-h-[calc(100vh-5rem)]">
      <div className="grid lg:grid-cols-2">
        {/* Form Side */}
        <div className="relative flex items-center justify-center p-6 lg:p-12">
          <div className="absolute inset-0 dl-stamped" />
          <div className="relative w-full max-w-[600px] py-10">{children}</div>
        </div>

        {/* Brand Poster Side */}
        <div className="relative hidden overflow-hidden border-l-2 border-foreground bg-[var(--volcan-900)] text-[var(--crema-050)] lg:block">
          <div className="absolute inset-0 dl-stamped" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <Image
              src="/images/se_libre/21.png"
              alt="Dinero Libre"
              width={520}
              height={680}
              className="h-auto w-[150px] object-contain"
            />

            <div>
              <div className="page-eyebrow text-[var(--cafe-300)]">
                #DineroLibre
              </div>
              <h2 className="mt-5 max-w-[14ch] text-5xl text-[var(--crema-050)]">
                {t.public.contactSubtitle}
              </h2>
              <p className="mt-6 max-w-sm text-base font-semibold leading-relaxed text-[var(--cafe-300)]">
                {t.public.contactResponse}
              </p>
            </div>

            <div className="self-start border-2 border-[var(--crema-200)] bg-primary px-4 py-2 font-[var(--font-display)] text-xl uppercase leading-none text-primary-foreground shadow-[4px_4px_0_var(--naranja-500)]">
              Sé tu propio banco
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
