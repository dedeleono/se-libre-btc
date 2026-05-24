import {Menu} from 'lucide-react'

import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet"
import { Sidebar } from './sidebar';

export const MobileSidebar = () => {
    return (
      <Sheet>
        <SheetTrigger className='lg:hidden pr-4 hover:opacity-75 transition'>
          <Menu className="dark:text-white/70 dark:hover:text-white transition-colors" />
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className='p-0 bg-white dark:bg-card/50 dark:backdrop-blur-xl dark:border-white/[0.05]'
        >
          <Sidebar />
        </SheetContent>
      </Sheet>
    );
}