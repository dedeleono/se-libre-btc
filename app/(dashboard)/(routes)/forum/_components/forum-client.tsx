// app/(dashboard)/(routes)/forum/_components/forum-client.tsx
"use client";

import { MessageCircle, Eye, ExternalLink, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ForumHeader } from "./forum-header";
import { ForumPosts } from "./forum-posts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ForumClientProps {
  posts: any[];
  currentUser: any;
  learningPaths: any[];
  cohorts: any[];
  courses: any[];
  canCreatePosts: boolean;
}

export function ForumClient({
  posts,
  currentUser,
  learningPaths,
  cohorts,
  courses,
  canCreatePosts,
}: ForumClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      <ScrollArea className="h-full">
        <div className="space-y-6 sm:px-0">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card/50
              dark:bg-black/40 dark:border-white/[0.08]
              dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]
              dark:backdrop-blur-md"
          >
            <div className="p-2 sm:p-6">
              <ForumHeader
                canCreatePosts={canCreatePosts}
                learningPaths={learningPaths}
                cohorts={cohorts}
                courses={courses}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border
              dark:bg-black/20 dark:border-white/[0.08]
              dark:shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]
              dark:backdrop-blur-sm bg-foreground/10"
          >
            <div className="p-2 sm:p-6">
              <ForumPosts posts={posts} currentUser={currentUser} />
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
