"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { MessageCircle, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import type { PublicAuthor } from "@/lib/public-author";
import { useLocale } from "@/lib/i18n";

interface Discussion {
  id: string;
  content: string;
  createdAt: Date;
  author: PublicAuthor;
}

interface DiscussionSectionProps {
  chapterId: string;
  currentUser: User;
}

export function DiscussionSection({ chapterId, currentUser }: DiscussionSectionProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formWasOpenRef = useRef(false);

  useEffect(() => {
    if (showCommentBox) textareaRef.current?.focus();
    else if (formWasOpenRef.current) openButtonRef.current?.focus();
    formWasOpenRef.current = showCommentBox;
  }, [showCommentBox]);

  const loadDiscussions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/chapters/${chapterId}/discussions`);
      if (response.data) {
        setDiscussions(response.data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading discussions:", error);
      toast.error(t.forum.loadDiscussionsError);
      setDiscussions([]);
      setIsLoading(false);
    }
  }, [chapterId, t.forum.loadDiscussionsError]);

  const onSubmitComment = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/chapters/${chapterId}/discussions`, {
        content: newComment,
      });
      setNewComment("");
      setShowCommentBox(false);
      toast.success(t.forum.discussionPosted);
      loadDiscussions();
    } catch (error) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  return (
    <div className="flex flex-col gap-6">
      {showCommentBox ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-comment">{t.forum.yourComment}</Label>
          <Textarea
            id="new-comment"
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.forum.commentPlaceholder}
            className="min-h-[100px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {t.forum.postReply}
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setShowCommentBox(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={openButtonRef}
          variant="outline"
          className="min-h-11 self-start"
          onClick={() => setShowCommentBox(true)}
        >
          <MessageCircle aria-hidden className="size-4" />
          {t.forum.startComment}
        </Button>
      )}

      {/* Discussions List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare aria-hidden className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-balance">{t.forum.noContentYet}</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-pretty">
              {t.forum.emptyPrompt}
            </p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-4"
            >
              <UserAvatar
                userId={discussion.author.id}
                name={discussion.author.name}
                image={discussion.author.image}
                size={40}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {discussion.author.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(discussion.createdAt), {
                      addSuffix: true,
                      locale: locale === "es" ? es : enUS,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-white/70">
                  {discussion.content}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
} 
