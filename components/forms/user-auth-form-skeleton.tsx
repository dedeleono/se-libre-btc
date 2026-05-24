'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function UserAuthFormSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6 rounded-xl 
        bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-border/50 
        dark:border-white/[0.05] shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    >
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-muted/50 dark:bg-white/10" />
          <Skeleton className="h-10 w-full bg-muted/50 dark:bg-white/10" />
        </div>

        <Skeleton className="h-10 w-full bg-muted/50 dark:bg-white/10" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t dark:border-white/[0.05]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground 
              dark:bg-black/20 dark:text-white/60">
              O continua con
            </span>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          <Skeleton className="h-12 w-full bg-muted/50 dark:bg-white/10" />
        </div>
      </div>
    </motion.div>
  );
} 