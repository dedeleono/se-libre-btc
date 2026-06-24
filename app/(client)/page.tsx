import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, MessageCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getServerMessages } from "@/lib/i18n-server";
import GuateLibreLogo from "@/components/guate-libre-logo";

const posters = ["19.png", "24.png"];

const INSTAGRAM_PATH =
  "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.977.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.977-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.881.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.977-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z";
const X_PATH =
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "ig" | "x";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-foreground transition-opacity hover:opacity-60"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
        <path d={icon === "ig" ? INSTAGRAM_PATH : X_PATH} />
      </svg>
    </a>
  );
}

export default function Home() {
  const t = getServerMessages();

  return (
    <main className="dl-app min-h-screen overflow-hidden">
      <section className="relative border-b-2 border-foreground">
        <div className="absolute inset-0 dl-stamped" />
        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1160px] items-center gap-12 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-8">
          <div className="space-y-8">
            <div className="page-eyebrow">Dinero Libre Guatemala</div>
            <div className="space-y-5">
              <h1 className="page-title max-w-[10ch]">{t.public.heroTitle}</h1>
              <p className="max-w-xl text-lg font-semibold leading-relaxed text-muted-foreground">
                {t.public.heroSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/courses">
                  {t.public.start}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/learning-paths">
                  {t.public.learningPathsTitle}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="stamp-card p-5">
              {/* Light mode: dark wordmark on the light stamp card */}
              <Image
                src="/logo.png"
                alt="Dinero Libre"
                width={1545}
                height={2000}
                priority
                className="block h-auto w-full object-contain dark:hidden"
              />
              {/* Dark mode: light wordmark on the dark stamp card */}
              <Image
                src="/logoDark.png"
                alt="Dinero Libre"
                width={1545}
                height={2000}
                className="hidden h-auto w-full object-contain dark:block"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden border-2 border-foreground bg-primary px-4 py-3 font-[var(--font-display)] text-3xl uppercase leading-none text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground))] md:block">
              Sé tu propio banco
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-4 py-16 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: t.public.features[0].title,
              body: t.public.features[0].description,
            },
            {
              icon: ShieldCheck,
              title: t.public.features[1].title,
              body: t.public.features[1].description,
            },
            {
              icon: CircleDollarSign,
              title: t.public.features[2].title,
              body: t.public.features[2].description,
            },
          ].map((item) => (
            <div key={item.title} className="stamp-card p-6">
              <item.icon className="mb-6 h-8 w-8 text-[var(--terracota-500)] dark:text-[var(--maiz-500)]" />
              <h2 className="text-3xl">{item.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-[var(--volcan-900)] text-[var(--crema-050)]">
        <div className="mx-auto grid max-w-[1160px] gap-10 px-4 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-8">
          <div>
            <div className="page-eyebrow text-[var(--cafe-300)]">
              Ruta práctica
            </div>
            <h2 className="mt-4 text-6xl text-[var(--crema-050)] md:text-7xl">
              Dinerlo Libre 1:1
            </h2>
            <p className="mt-6 text-base font-semibold leading-relaxed text-[var(--cafe-300)]">
              Aprende los fundamentos, práctica con recursos reales y avanza con
              una comunidad enfocada en la soberanía financiera a través de la
              tecnología innovadora de Bitcoin.
            </p>
            <Button asChild className="mt-8" variant="secondary">
              <Link href="/courses">{t.public.viewCourse}</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {posters.map((poster, index) => (
              <div
                key={poster}
                className="overflow-hidden border-2 border-[var(--crema-200)] bg-black shadow-[4px_4px_0_var(--naranja-500)]"
              >
                <Image
                  src={`/images/se_libre/${poster}`}
                  alt={`Dinero Libre poster ${index + 1}`}
                  width={1545}
                  height={2000}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-foreground">
        <div className="mx-auto max-w-[1160px] px-4 py-16 md:px-8">
          <div className="flex justify-center">
            <div className="page-eyebrow">{t.public.sponsorsEyebrow}</div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-12 sm:flex-row sm:gap-0">
            {/* CURSO — Guate Libre + Maverick juntos */}
            <div className="flex flex-1 flex-col items-center gap-5 px-6">
              <div className="flex items-center justify-center gap-12 sm:gap-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 items-center">
                    <GuateLibreLogo width={112} />
                  </div>
                  <SocialLink
                    href="https://www.instagram.com/guate.libre"
                    label="Guate Libre en Instagram"
                    icon="ig"
                  />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 items-center">
                    <Image
                      src="/images/Maverick-Green.webp"
                      alt="Maverick Capital Investment"
                      width={384}
                      height={142}
                      className="h-10 w-auto object-contain dark:[filter:brightness(0)_invert(1)]"
                    />
                  </div>
                  <SocialLink
                    href="https://www.instagram.com/maverickcapitalinvestment"
                    label="Maverick en Instagram"
                    icon="ig"
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t.public.sponsorCourseRole}
              </span>
            </div>

            <div className="hidden w-[2px] self-stretch bg-foreground sm:block" />

            {/* PLATAFORMA */}
            <div className="flex flex-1 flex-col items-center gap-5 px-6">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 items-center">
                  <Image
                    src="/images/sponsors/st209fXf_400x400.jpg"
                    alt="Plataforma Dinero Libre"
                    width={400}
                    height={400}
                    className="h-12 w-12 border-2 border-foreground object-cover shadow-[4px_4px_0_hsl(var(--foreground))] dark:shadow-[4px_4px_0_var(--naranja-500)]"
                  />
                </div>
                <SocialLink href="https://x.com/mm_gojan" label="@mm_gojan en X" icon="x" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t.public.sponsorPlatformRole}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-4 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="md:sticky md:top-28 h-fit">
            <div className="page-eyebrow">{t.public.faqEyebrow}</div>
            <h2 className="mt-4 text-6xl">{t.public.faqTitle}</h2>
            <p className="mt-4 font-semibold leading-relaxed text-muted-foreground">
              {t.public.faqSubtitle}
            </p>
            <div className="stamp-card mt-8 p-6">
              <MessageCircle className="mb-4 h-6 w-6 text-primary" />
              <p className="text-sm font-bold text-muted-foreground">
                {t.public.faqMissing}
              </p>
              <Link
                href="/contact"
                className="mt-2 inline-flex font-bold uppercase tracking-[0.08em] text-[var(--terracota-700)] underline decoration-2 underline-offset-4 dark:text-[var(--maiz-500)]"
              >
                {t.public.contactDirectly}
              </Link>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {t.public.faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="stamp-card overflow-hidden px-6"
              >
                <AccordionTrigger className="py-5 text-left text-lg font-bold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="border-t-2 border-foreground py-5 text-base font-semibold text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}
