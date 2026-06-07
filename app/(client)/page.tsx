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

const posters = ["19.png", "20.png", "24.png"];

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
              <h1 className="page-title max-w-[10ch]">
                {t.public.heroTitle}
              </h1>
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
            <div className="stamp-card bg-[var(--volcan-900)] p-5">
              <Image
                src="/images/se_libre/logo.png"
                alt="Dinero Libre"
                width={1545}
                height={2000}
                priority
                className="h-auto w-full object-contain"
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
            { icon: BookOpen, title: t.public.features[0].title, body: t.public.features[0].description },
            { icon: ShieldCheck, title: t.public.features[1].title, body: t.public.features[1].description },
            { icon: CircleDollarSign, title: t.public.features[2].title, body: t.public.features[2].description },
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
            <div className="page-eyebrow text-[var(--cafe-300)]">Ruta práctica</div>
            <h2 className="mt-4 text-6xl text-[var(--crema-050)] md:text-7xl">
              Bitcoin sin permiso
            </h2>
            <p className="mt-6 text-base font-semibold leading-relaxed text-[var(--cafe-300)]">
              Aprende los fundamentos, practica con recursos reales y avanza con una comunidad enfocada en soberanía financiera.
            </p>
            <Button asChild className="mt-8" variant="secondary">
              <Link href="/courses">{t.public.viewCourse}</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
