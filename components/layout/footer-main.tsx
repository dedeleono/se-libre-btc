"use client";

import Link from "next/link";
import React from "react";
// import FooterCards from "../footercards/page";
import Logo from "@/components/logo";
import { useLocale } from "@/lib/i18n";

const Footer = () => {
  const { t } = useLocale();

  return (
    <footer className="dl-stamped border-t-2 border-foreground bg-background pt-16 text-foreground">
      <div className="mx-auto max-w-[1160px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 mb-16">
          <div className="md:col-span-6 space-y-6">
            <Logo width={210} height={48} />
            <p className="max-w-md text-sm font-semibold text-muted-foreground">
              Bitcoin education with a warm, practical, sovereignty-first learning platform.
            </p>
          </div>

          {/* Sitemap Section */}
          <div className="md:col-span-3">
            <h2 className="mb-6 text-2xl">
              {t.nav.home}
            </h2>
            <nav className="space-y-4">
              <Link
                href="/"
                className="block text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground transition-all duration-300 hover:translate-x-2 hover:text-foreground"
              >
                {t.nav.home}
              </Link>
              <Link
                href="/about"
                className="block text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground transition-all duration-300 hover:translate-x-2 hover:text-foreground"
              >
                {t.nav.about}
              </Link>
              <Link
                href="/contact"
                className="block text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground transition-all duration-300 hover:translate-x-2 hover:text-foreground"
              >
                {t.nav.contact}
              </Link>
            </nav>
          </div>

          {/* Follow Us Section */}
          <div className="md:col-span-3">
            <h2 className="mb-6 text-2xl">
              {t.public.footerFollow}
            </h2>
            <nav className="space-y-4">
              <Link
                href="#"
                className="group flex items-center text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground transition-all duration-300 hover:text-foreground"
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
                  Instagram
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="#"
                className="group flex items-center text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground transition-all duration-300 hover:text-foreground"
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
                  TikTok
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="flex items-center justify-center border-t-2 border-foreground py-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t.public.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
