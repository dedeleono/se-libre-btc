"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Reply, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { ForumReply } from "@prisma/client";
import { User } from "@prisma/client";

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
      toast.success("Comment posted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
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
      toast.success("Reply posted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
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
              <Avatar className="h-10 w-10">
                <AvatarFallback>{comment.author.name?.[0]}</AvatarFallback>
              </Avatar>
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
                    Reply
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
                      {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
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
                  placeholder="Write a reply..."
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    Post Reply
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{reply.author.name?.[0]}</AvatarFallback>
                        </Avatar>
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
            placeholder="Write a comment..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              Post Comment
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCommentBox(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 