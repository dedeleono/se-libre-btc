"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Reply, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { ForumReply } from "@prisma/client";
import { User } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import { useLocale } from "@/lib/i18n";

// Add this interface to define the shape of comments with author
interface CommentWithAuthor extends ForumReply {
  author: User;
  replies?: CommentWithAuthor[];
}

interface CommentsProps {
  postId: string;
  comments: CommentWithAuthor[];
  currentUser: User;
}

export function CommentsSection({ postId, comments, currentUser }: CommentsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [showCommentBox, setShowCommentBox] = useState(comments.length === 0);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const onSubmitComment = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/forum/${postId}/comments`, {
        content: newComment,
      });
      setNewComment("");
      setShowCommentBox(false);
      toast.success(t.forum.commentPosted);
      router.refresh();
    } catch (error) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitReply = async (parentId: string) => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/forum/${postId}/comments`, {
        content: replyContent,
        parentId,
      });
      setReplyingTo(null);
      setReplyContent("");
      toast.success(t.forum.replyPosted);
      router.refresh();
    } catch (error) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                userId={comment.author.id}
                email={comment.author.email}
                name={comment.author.name}
                image={comment.author.image}
                size={40}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.author.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{comment.content}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-muted-foreground"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    {t.forum.reply}
                  </Button>
                  {comment.replies && comment.replies.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReplies(comment.id)}
                      className="text-muted-foreground"
                    >
                      <motion.div
                        animate={{ rotate: expandedComments.includes(comment.id) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 mr-2" />
                      </motion.div>
                      {t.forum.repliesCount(comment.replies.length)}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="ml-14 space-y-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t.forum.writeReply}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {t.forum.postReply}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <AnimatePresence>
                {expandedComments.includes(comment.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-14 space-y-4 overflow-hidden"
                  >
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-4">
                        <UserAvatar
                          userId={reply.author.id}
                          email={reply.author.email}
                          name={reply.author.name}
                          image={reply.author.image}
                          size={32}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{reply.author.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* Floating Comment Button */}
      {!showCommentBox && (
        <Button
          onClick={() => setShowCommentBox(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* New Comment Form */}
      {showCommentBox && (
        <div className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.forum.writeComment}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {t.forum.postComment}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCommentBox(false)}
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
