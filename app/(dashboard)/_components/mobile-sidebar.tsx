import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getServerMessages } from "@/lib/i18n-server";

import { Sidebar } from "./sidebar";

export const MobileSidebar = async () => {
  const t = await getServerMessages();

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t.common.openMenu}
        className="lg:hidden inline-flex items-center justify-center -m-[11px] p-[11px] hover:opacity-75 transition-opacity"
      >
        <Menu className="dark:text-white/70 dark:hover:text-white transition-colors" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 bg-white dark:bg-card/50 dark:backdrop-blur-xl dark:border-white/[0.05]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t.nav.menu}</SheetTitle>
        </SheetHeader>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
