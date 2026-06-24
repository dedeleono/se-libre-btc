"use client";

import { ForumPost, User } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Video, Eye, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DeletePostModal, DeletePostModalRef } from "./delete-post-modal";
import { useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

interface ForumPostsProps {
  posts: (ForumPost & {
    author: User;
    learningPath?: { title: string } | null;
    cohort?: { title: string } | null;
    course?: { title: string };
    _count?: {
      comments: number;
      views: number;
    };
  })[];
  currentUser: User;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export const ForumPosts = ({ posts, currentUser }: ForumPostsProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const deleteModalRef = useRef<DeletePostModalRef>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const canDelete = currentUser.role === "ADMIN";

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    deleteModalRef.current?.open();
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    
    try {
      await axios.delete(`/api/forum/${postToDelete}`);
      toast.success(t.forum.postDeleted);
      router.refresh();
    } catch (error) {
      toast.error(t.common.somethingWentWrong);
      throw error; // Re-throw to show loading state in modal
    }
  };

  if (!posts.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center 
          dark:bg-black/20 dark:backdrop-blur-sm dark:border-white/[0.08]
          dark:text-white/70 rounded-lg"
      >
        <MessageCircle className="h-10 w-10 text-primary/70 mb-4" />
        <h3 className="text-lg font-medium dark:text-white/90">{t.forum.noContentYet}</h3>
        <p className="text-sm dark:text-white/50 mt-2">
          {t.forum.emptyPrompt}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4 mt-6 "
      >
        {posts.map((post) => (
          <motion.div key={post.id} variants={item}>
            <Card
              className="p-4 sm:p-6 transition-all duration-200 
              dark:bg-black/20 dark:backdrop-blur-sm dark:border-white/[0.08]
              dark:hover:bg-black/30 dark:hover:border-white/[0.12] shadow-xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <Link href={`/forum/topics/${post.id}`}>
                        <h3
                          className="text-lg sm:text-xl font-semibold dark:text-white/90 
                          hover:text-primary transition-colors line-clamp-2"
                        >
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm dark:text-white/50">
                        <span className="text-xs">{post.author.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="sm:inline hidden text-xs">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {post.learningPathId && (
                        <Badge
                          variant="secondary"
                          className="text-xs sm:text-sm bg-[hsl(var(--primary)/0.1)] text-[var(--terracota-700)] hover:bg-[hsl(var(--primary)/0.2)]"
                        >
                          {post.learningPath?.title}
                        </Badge>
                      )}
                      {post.cohortId && (
                        <Badge
                          variant="secondary"
                          className="text-xs sm:text-sm bg-[hsl(var(--primary)/0.1)] text-[var(--terracota-700)] hover:bg-[hsl(var(--primary)/0.2)]"
                        >
                          {post.cohort?.title}
                        </Badge>
                      )}
                      {post.courseId && (
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm border-success text-success"
                        >
                          {post?.course?.title}
                        </Badge>
                      )}
                      {post.meetingLink && (
                        <Badge
                          variant="secondary"
                          className="text-xs sm:text-sm bg-[hsl(var(--primary)/0.12)] text-primary hover:bg-[hsl(var(--primary)/0.2)] cursor-pointer"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">
                            {t.forum.meetingAvailable}
                          </span>
                          <span className="sm:hidden">{t.forum.meeting}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {canDelete && (
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(post.id)}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t.forum.deletePost}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <div className="flex items-center gap-3 sm:gap-4 dark:text-white/40">
                    {post.meetingLink && (
                      <div
                        className="flex items-center gap-1.5 text-[hsl(var(--primary)/0.7)]
                        hover:text-primary transition-colors"
                      >
                        <Video className="h-4 w-4" />
                        <span className="text-xs font-medium">{t.forum.meeting}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {post._count?.comments || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-white/70 transition-colors">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {post._count?.views || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <DeletePostModal ref={deleteModalRef} onConfirm={handleDelete} />
    </>
  );
};
