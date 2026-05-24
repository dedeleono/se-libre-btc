import { Logo } from "./logo"
import { SidebarRoutes } from "./sidebar-routes"
import { SignOut } from "@/components/sign-out-button"
import { auth } from "@/lib/auth"
import { ScrollArea } from "@/components/ui/scroll-area"

export const Sidebar = async () => {
    const session = await auth()
    
    return (
      <div className="h-full border-r flex flex-col bg-background w-full
        dark:bg-gradient-to-b dark:from-card/50 dark:to-background/30 
        dark:border-white/[0.05] dark:backdrop-blur-sm"
      >
        <div className="p-[1.15rem] dark:bg-card/30 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
          <Logo />
        </div>
        <ScrollArea className="flex-1 dark:bg-transparent">
          <div className="flex flex-col w-full">
            <SidebarRoutes />
          </div>
        </ScrollArea>
        {session && (
          <div className="mt-auto border-t dark:border-white/[0.05] dark:bg-card/30 
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <SignOut 
              initialUser={{
                name: session.user?.name,
                image: session.user?.image
              }} 
            />
          </div>
        )}
      </div>
    );
}

export const revalidate = 0;