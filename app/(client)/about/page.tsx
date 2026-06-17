import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  LineChart,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getServerMessages } from "@/lib/i18n-server";

export default function AboutPage() {
  const t = getServerMessages();

  const features = [
    { icon: BookOpen, ...t.public.aboutFeatures[0] },
    { icon: LineChart, ...t.public.aboutFeatures[1] },
    { icon: GraduationCap, ...t.public.aboutFeatures[2] },
  ];

  const slogans = ["Aprende", "Practica", "Comparte", "Resiste", "Sé tu propio banco"];

  return (
    <main className="dl-app overflow-hidden">
      {/* HERO */}
      <section className="relative border-b-2 border-foreground">
        <div className="absolute inset-0 dl-stamped" />
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
          <div className="space-y-8">
            <div className="page-eyebrow">#DineroLibre · Guatemala</div>
            <h1 className="page-title max-w-[12ch]">
              {t.public.aboutUsTitle}
              <span className="dl-libre-tag ml-3 align-top text-[0.4em] text-[var(--terracota-700)] dark:text-[var(--maiz-500)]">
                / Libre
              </span>
            </h1>
            <p className="max-w-xl text-lg font-semibold leading-relaxed text-muted-foreground">
              {t.public.aboutSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/courses">
                  {t.public.start}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">{t.nav.contact}</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="stamp-card flex items-center justify-center bg-[var(--crema-050)] p-10">
              <Image
                src="/images/se_libre/25.png"
                alt="Sello Dinero Libre"
                width={760}
                height={980}
                priority
                className="h-auto w-full max-w-[240px] object-contain"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden border-2 border-foreground bg-primary px-4 py-3 font-[var(--font-display)] text-2xl uppercase leading-none text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground))] md:block">
              Dinero sano
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE ARE — editorial statement */}
      <section className="mx-auto max-w-[1160px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.4fr_1fr] md:gap-16">
          <div className="md:sticky md:top-28 h-fit">
            <div className="page-eyebrow">#DineroLibre</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t.public.aboutUsTitle}</h2>
          </div>
          <p className="text-2xl font-semibold leading-snug text-foreground md:text-[28px]">
            {t.public.aboutUsBody}
          </p>
        </div>
      </section>

      {/* SLOGAN BAND */}
      <div className="overflow-hidden border-y-2 border-foreground bg-primary text-primary-foreground">
        <div className="marquee py-3 font-[var(--font-display)] text-2xl uppercase tracking-[0.04em] md:text-3xl">
          {[0, 1, 2, 3].map((group) => (
            <div
              key={group}
              aria-hidden={group > 0}
              className="flex shrink-0 items-center gap-6 pr-6"
            >
              {slogans.map((word) => (
                <span key={word} className="flex items-center gap-6">
                  <span>{word}</span>
                  <span aria-hidden className="opacity-60">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MISSION & VISION — dark band */}
      <section className="border-b-2 border-foreground bg-[var(--volcan-900)] text-[var(--crema-050)]">
        <div className="mx-auto grid max-w-[1160px] gap-12 px-4 py-20 md:grid-cols-2 md:px-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center border-2 border-[var(--crema-200)] bg-[var(--volcan-700)] text-[var(--naranja-500)] shadow-[4px_4px_0_var(--naranja-500)]">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="mt-8 text-5xl text-[var(--crema-050)] md:text-6xl">
              {t.public.missionTitle}
            </h2>
            <p className="mt-6 text-base font-semibold leading-relaxed text-[var(--cafe-300)]">
              {t.public.missionBody}
            </p>
          </div>
          <div className="md:border-l-2 md:border-[var(--volcan-500)] md:pl-12">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-[var(--crema-200)] bg-[var(--volcan-700)] text-[var(--maiz-500)] shadow-[4px_4px_0_var(--naranja-500)]">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="mt-8 text-5xl text-[var(--crema-050)] md:text-6xl">
              {t.public.visionTitle}
            </h2>
            <p className="mt-6 text-base font-semibold leading-relaxed text-[var(--cafe-300)]">
              {t.public.visionBody}
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      {/* <section className="mx-auto max-w-[1160px] px-4 py-20 md:px-8">
        <div className="max-w-2xl">
          <div className="page-eyebrow">#DineroLibre</div>
          <h2 className="mt-4 text-5xl md:text-6xl">{t.public.featuresTitle}</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="stamp-card p-6">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-[var(--naranja-050)] text-[var(--terracota-700)] dark:bg-[var(--volcan-700)] dark:text-[var(--maiz-500)]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-2xl">{feature.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section> */}

      {/* CLOSING CTA */}
      <section className="relative border-t-2 border-foreground">
        <div className="absolute inset-0 dl-stamped" />
        <div className="relative mx-auto max-w-[1160px] px-4 py-20 text-center md:px-8">
          <h2 className="mx-auto max-w-[16ch] text-5xl md:text-6xl">
            Sé tu propio banco
            <span className="dl-libre-tag ml-2 text-[0.4em] align-top text-[var(--terracota-700)] dark:text-[var(--maiz-500)]">
              / Libre
            </span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/courses">
                {t.public.start}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">{t.nav.contact}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
