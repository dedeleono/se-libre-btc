'use client';
import { IoMdSunny, IoMdMoon } from "react-icons/io";
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm 
            border border-white/10 shadow-inner hover:shadow-lg hover:border-white/20
            transition-[background-color,border-color,box-shadow,color] duration-300 dark:bg-black/20
            hover:bg-white/10 hover:text-foreground dark:hover:bg-white/5"
        >
          <motion.div
            initial={false}
            animate={{
              scale: theme === 'dark' ? 0 : 1,
              rotate: theme === 'dark' ? -45 : 0,
              opacity: theme === 'dark' ? 0 : 1
            }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <IoMdSunny className="h-5 w-5 text-yellow-500" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              scale: theme === 'dark' ? 1 : 0,
              rotate: theme === 'dark' ? 0 : 45,
              opacity: theme === 'dark' ? 1 : 0
            }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <IoMdMoon className="h-5 w-5 text-sky-300" />
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-black/40 backdrop-blur-xl border border-black/10 
          shadow-xl dark:bg-black/20 rounded-xl text-white/90"
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer
            hover:bg-white/10 focus:bg-white/10 dark:hover:bg-white/5 
            dark:focus:bg-white/5 transition-colors"
        >
          <IoMdSunny className="h-4 w-4 text-yellow-500" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer
            hover:bg-white/10 focus:bg-white/10 dark:hover:bg-white/5 
            dark:focus:bg-white/5 transition-colors"
        >
          <IoMdMoon className="h-4 w-4 text-sky-300" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer
            hover:bg-white/10 focus:bg-white/10 dark:hover:bg-white/5 
            dark:focus:bg-white/5 transition-colors"
        >
          <svg 
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
