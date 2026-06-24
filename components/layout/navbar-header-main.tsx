"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/lib/i18n";

const HeaderMenu = () => {
  const pathname = usePathname();
  const { t } = useLocale();
  const navItems = [
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-20 max-w-[1160px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo alt="Dinero Libre" width={168} height={42} />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs font-extrabold uppercase tracking-[0.12em] transition-colors hover:text-[var(--terracota-500)]",
                pathname === item.href
                  ? "text-foreground underline decoration-2 underline-offset-8"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/sign-in">
            <Button size="default">{t.nav.signIn}</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <LanguageToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72"
            >
              <SheetHeader>
                <SheetTitle className="text-left">
                  {t.nav.menu}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-4 px-4 pb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-accent",
                      pathname === item.href
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t mt-2 dark:border-white/[0.05]">
                  <Link href="/sign-in" className="w-full">
                    <Button size="sm" className="w-full">
                      {t.nav.signIn}
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default HeaderMenu;
