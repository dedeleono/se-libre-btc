"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";

interface Discussion {
  id: string;
  content: string;
  createdAt: Date;
  author: User;
}

interface DiscussionSectionProps {
  chapterId: string;
  currentUser: User;
}

export function DiscussionSection({ chapterId, currentUser }: DiscussionSectionProps) {
  const router = useRouter();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      toast.error("Failed to load discussions");
      setDiscussions([]);
      setIsLoading(false);
    }
  }, [chapterId]);

  const onSubmitComment = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/chapters/${chapterId}/discussions`, {
        content: newComment,
      });
      setNewComment("");
      setShowCommentBox(false);
      toast.success("Discussion posted successfully");
      loadDiscussions();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  return (
    <div className="space-y-6">
      {/* Discussions List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay nada aún</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sé el primero en empezar una discusión! <br />
              <br />
              Comparte tus ideas, haz preguntas o participa con otros
              estudiantes.
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
                email={discussion.author.email}
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
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {discussion.content}
                </p>
              </div>
            </motion.div>
          ))
        )}
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
            placeholder="Comparte tus ideas o haz una pregunta..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={onSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              Post
            </Button>
            <Button variant="ghost" onClick={() => setShowCommentBox(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
