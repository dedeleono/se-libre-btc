"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE_NAME = "dashboard_sidebar_collapsed";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type DashboardShellProps = {
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

function getInitialCollapsed() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((cookie) => cookie === `${SIDEBAR_COOKIE_NAME}=true`);
}

export function DashboardShell({ navbar, sidebar, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(getInitialCollapsed);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        data-dashboard-sidebar={collapsed ? "collapsed" : "expanded"}
        className="h-full w-full max-w-full overflow-x-hidden"
      >
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-[80px] w-full transition-[padding] duration-200",
          collapsed ? "lg:pl-20" : "lg:pl-56"
        )}
      >
        {navbar}
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col overflow-hidden border-r bg-background transition-[width] duration-200 lg:flex",
          collapsed ? "w-20" : "w-56"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="absolute right-2 top-4 z-10 h-8 w-8 bg-background/80 shadow-sm backdrop-blur"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
        {sidebar}
      </aside>

      <main
        className={cn(
          "flex h-full min-h-screen w-full max-w-full flex-col bg-foreground/5 pt-[80px] transition-[padding] duration-200 dark:bg-sky-100/5",
          collapsed ? "lg:pl-20" : "lg:pl-56"
        )}
      >
        {children}
      </main>
      </div>
    </TooltipProvider>
  );
}
