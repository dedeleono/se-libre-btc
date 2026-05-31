import React from "react";
import Image from "next/image";
import HeroSection from "@/components/hero-section";
import InfoSection from "@/components/info-section";
import NewsLetter from "@/components/newsletter";
import CoursesSection from "@/components/courses-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { getServerMessages } from "@/lib/i18n-server";

export default function Home() {
  const t = getServerMessages();

  return (
    <main className="min-h-screen dark:bg-background">
      <div className="relative h-screen min-h-[600px]">
        <div className="relative z-10">
          <HeroSection />
        </div>
      </div>

      <section className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
        <InfoSection />
      </section>

      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/30 to-white
          dark:from-background dark:via-emerald-950/5 dark:to-background"
        />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <CoursesSection />
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50/50 via-emerald-50/30 to-white dark:from-background dark:via-emerald-950/5 dark:to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-12 max-w-7xl mx-auto">
            {/* Left Column: Title & Description */}
            <div className="md:w-1/2 md:sticky md:top-24">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                {t.public.faqEyebrow}
              </span>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-primary dark:text-white/90 font-['Open_Sans']">
                {t.public.faqTitle}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {t.public.faqSubtitle}
              </p>
              <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  {t.public.faqMissing}
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  {t.public.contactDirectly} →
                </Link>
              </div>
            </div>

            {/* Right Column: Accordion */}
            <div className="md:w-1/2 w-full">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="faq1"
                  className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t.public.faqs[0].question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 pl-12">
                      {t.public.faqs[0].answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq2"
                  className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t.public.faqs[1].question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 pl-12">
                      {t.public.faqs[1].answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq3"
                  className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        ¿Cuál es nuestra ubicación?
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 pl-12">
                      6ta Avenida 8-25 zona 2, Avenida Simeón Cañas, Apto
                      &quot;A&quot;, Guatemala, Guatemala
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq4"
                  className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        ¿Cómo entrego mis documentos?
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 pl-12">
                      Puedes entregarlos en nuestras instalaciones ubicadas en:
                      <strong className="block mt-1">
                        6ta Avenida 8-25 zona 2, Avenida Simeón Cañas, Apto
                        &quot;A&quot;, Guatemala, Guatemala.
                      </strong>
                      <br />
                      <br />
                      O bien, puedes enviarlos con tu empresa de mensajería de
                      preferencia a nuestra dirección.
                      <br />
                      <br />
                      (Recuerda que tus documentos deben ser originales y no
                      copias)
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq5"
                  className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <svg
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {t.public.faqs[2].question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 pl-12">
                      {t.public.faqs[2].answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white dark:bg-background py-16">
        <div className="absolute inset-0">
          <Image
            src="/students-group.jpg"
            alt="Students collaborating"
            fill
            className="object-cover opacity-10 dark:opacity-5"
            sizes="100vw"
          />
        </div>
        <div className="container mx-auto relative z-10">
          <NewsLetter />
        </div>
      </section>
    </main>
  );
}
