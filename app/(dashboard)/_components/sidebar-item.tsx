"use client";

import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { IconType } from 'react-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const isActive = pathname === href || (href !== "/student" && href !== "/admin" && pathname.startsWith(`${href}/`));

  const link = (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-10 w-full items-center gap-x-3 rounded-[2px] px-3 py-2 text-sm font-bold",
        "transition-all duration-200",
        "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isActive &&
          "border-2 border-foreground bg-foreground text-background hover:bg-foreground hover:text-background dark:bg-primary dark:text-primary-foreground",
        href === "#" && "cursor-pointer"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive ? "text-current" : "text-muted-foreground"
        )}
      />
      <span className="dashboard-sidebar-label truncate">{label}</span>
    </Link>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export default SidebarItem;
