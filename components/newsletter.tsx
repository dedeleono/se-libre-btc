import React from "react";
import { Button } from "./ui/button";
import { getServerMessages } from "@/lib/i18n-server";

const NewsLetter = () => {
  const t = getServerMessages();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 
      dark:from-emerald-600/90 dark:to-teal-700/90 px-6 py-16 sm:px-12 sm:py-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t.public.newsletterTitle}
        </h2>
        <p className="mt-4 text-lg text-emerald-100">
          {t.public.newsletterSubtitle}
        </p>
        <form className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="email"
            placeholder={t.auth.emailPlaceholder}
            className="flex-1 rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder-white/75 
              backdrop-blur-sm focus:ring-2 focus:ring-white dark:bg-black/20 dark:focus:ring-white/70"
          />
          <Button
            className="bg-white text-emerald-600 hover:bg-emerald-50 
              dark:bg-white/90 dark:hover:bg-white/80 dark:text-emerald-700"
            size="lg"
          >
            {t.common.continue}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewsLetter;
