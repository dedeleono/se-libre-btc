"use client";

import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { IconType } from 'react-icons';

interface SidebarItemProps {
  icon: LucideIcon | IconType;
  label: string;
  href: string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href
}: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-x-3 text-sm font-medium w-full p-4",
        "transition-all duration-200",
        "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80",
        "dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.06]",
        isActive &&
          "text-sky-700 bg-sky-50 hover:bg-sky-50 hover:text-sky-700 border-r-4 border-sky-700 dark:bg-white/[0.08] dark:text-white dark-glow dark:border-none",
        isActive && "text-sky-700 bg-sky-50 dark:text-sky-600 ",
        href === "#" && "cursor-pointer"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive ? "text-sky-700" : "text-slate-500"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
};

export default SidebarItem;
