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

const navItems = [
  { label: "Acerca de nosotros", href: "/about" },
  { label: "Contactános", href: "/contact" },
] as const;

const HeaderMenu = () => {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60
      dark:bg-background/95 dark:border-white/[0.05] dark:supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 pl-5">
          <Logo
            alt="Logo"
            width={125}
            height={125}
            className="scale-150"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-success",
                pathname === item.href
                  ? "text-success  font-['Open_Sans'] font-black"
                  : "text-muted-foreground dark:text-white/70"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth Button - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/sign-in">
            <Button
              variant="default"
              size="default"
              className="bg-sky-900 hover:bg-sky-800 
              dark:bg-sky-700/90 dark:hover:bg-sky-800/90 dark:text-white"
            >
              Iniciar Sesión
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="dark:text-white/90"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 dark:bg-background dark:border-white/[0.05]"
            >
              <SheetHeader>
                <SheetTitle className="text-left dark:text-white/90">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-accent",
                      pathname === item.href
                        ? "text-primary dark:text-white bg-accent dark:bg-white/[0.06]"
                        : "text-muted-foreground dark:text-white/70"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t mt-2 dark:border-white/[0.05]">
                  <Link href="/sign-in" className="w-full">
                    <Button
                      size="sm"
                      className="bg-sky-900 hover:bg-sky-800 w-full 
                      dark:bg-sky-700/90 dark:hover:bg-sky-800/90 dark:text-white"
                    >
                      Iniciar Sesión
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
