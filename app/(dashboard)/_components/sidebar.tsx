import Logo from "@/components/logo"
import { SidebarRoutes } from "./sidebar-routes"
import { SignOut } from "@/components/sign-out-button"
import { auth } from "@/lib/auth"
import { ScrollArea } from "@/components/ui/scroll-area"

export const Sidebar = async () => {
    const session = await auth()
    
    return (
      <div className="flex h-full w-full flex-col bg-background">
        <div className="border-b-2 border-foreground p-5">
          <div className="dashboard-sidebar-logo transition-transform duration-200">
            <Logo width={150} height={42} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col w-full">
            <SidebarRoutes />
          </div>
        </ScrollArea>
        {session && (
          <div className="mt-auto border-t-2 border-foreground">
            <SignOut 
              initialUser={{
                id: session.user?.id,
                email: session.user?.email,
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
