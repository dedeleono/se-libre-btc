"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageCircle } from "lucide-react";
import { CreatePostDialog } from "./create-post-form";
import { CreateForumForm, CreateForumFormRef } from "./create-forum-form";

interface ForumHeaderProps {
  canCreatePosts: boolean;
  levels: { id: string; name: string }[];
  courses: { id: string; title: string }[];
}

export const ForumHeader = ({
  canCreatePosts,
  levels,
  courses,
}: ForumHeaderProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const forumFormRef = useRef<CreateForumFormRef>(null);

  const handleOpenForm = () => {
    forumFormRef.current?.open();
  };

  return (
    <div className="flex flex-col space-y-0.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="flex flex-col space-y-0.5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight dark:text-white/90">
            Foro General
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-white/50">
            Discute sobre cualquier tema con tus compañeros y profesores
          </p>
        </div>
        {canCreatePosts && (
          <Button 
            onClick={handleOpenForm}
            className="w-full sm:w-auto bg-gradient-to-r from-primary/80 to-primary dark:from-sky-600 dark:to-sky-800
              hover:from-primary hover:to-primary/80 dark:hover:from-sky-500 dark:hover:to-sky-700
              text-white shadow-lg dark:shadow-sky-900/20 
              dark:border-white/[0.05] dark:backdrop-blur-sm
              transition-all duration-300 dark-glow"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Topic
          </Button>
        )}
      </div>

      <CreatePostDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        levels={levels}
        courses={courses}
      />

      <CreateForumForm
        ref={forumFormRef}
        levels={levels}
        courses={courses}
      />
    </div>
  );
};
