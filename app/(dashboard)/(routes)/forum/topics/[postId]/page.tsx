import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, ArrowLeft } from "lucide-react";
import { CommentsSection } from "../../_components/comments-section";
import Link from "next/link";
import { MeetingButton } from "./_components/meeting-button";
import { getServerMessages } from "@/lib/i18n-server";

interface PostPageProps {
  params: {
    postId: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await auth();
  const t = getServerMessages();
  if (!session?.user) {
    return redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return redirect("/");
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.postId },
    include: {
      author: true,
      learningPath: true,
      cohort: true,
      course: true,
      comments: {
        where: { parentId: null },
        include: {
          author: true,
          replies: {
            include:{
              author: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!post) {
    return redirect("/forum");
  }

  // Check access for students
  if (user.role === "STUDENT") {
    const [courseEnrollment, learningPathEnrollment, cohortEnrollment] = await Promise.all([
      post.courseId
        ? prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: user.id,
                courseId: post.courseId,
              },
            },
          })
        : null,
      post.learningPathId
        ? prisma.learningPathEnrollment.findUnique({
            where: {
              userId_learningPathId: {
                userId: user.id,
                learningPathId: post.learningPathId,
              },
            },
          })
        : null,
      post.cohortId
        ? prisma.cohortEnrollment.findUnique({
            where: {
              userId_cohortId: {
                userId: user.id,
                cohortId: post.cohortId,
              },
            },
          })
        : null,
    ]);

    if (!courseEnrollment && !learningPathEnrollment && !cohortEnrollment) {
      return redirect("/forum");
    }
  }

  // Record the view
  await prisma.forumView.upsert({
    where: {
      postId_userId: {
        postId: params.postId,
        userId: user.id,
      },
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      postId: params.postId,
      userId: user.id,
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-x-2">
        <Link
          href="/forum"
          className="flex items-center text-sm dark:text-white/70 hover:dark:text-white/90 
            transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          {t.forum.backToForum}
        </Link>
      </div>

      {/* Main Post Card */}
      <Card
        className="relative overflow-hidden border dark:border-white/[0.08]
        bg-gradient-to-br from-card/50 to-card/30
        dark:from-black/40 dark:via-black/20 dark:to-transparent 
        dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
        transition-all duration-300"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1
                className="text-3xl font-bold tracking-tight dark:text-white/90 
                bg-gradient-to-r from-foreground to-foreground/70 
                dark:from-white dark:to-white/70 bg-clip-text"
              >
                {post.title}
              </h1>
              <div className="flex items-center gap-x-3 text-sm dark:text-white/50">
                <UserAvatar
                  userId={post.author.id}
                  email={post.author.email}
                  name={post.author.name}
                  image={post.author.image}
                  size={32}
                  className="border-2 dark:border-white/10"
                />
                <span className="font-medium dark:text-white/70">
                  {post.author.name}
                </span>
                <span className="dark:text-white/30">•</span>
                <span>{format(post.createdAt, "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            </div>
            {post.meetingLink && (
              <MeetingButton meetingLink={post.meetingLink} />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {post.learningPath && (
              <Badge
                variant="secondary"
                className="bg-sky-100 text-sky-700 hover:bg-sky-200
                  dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
              >
                {post.learningPath.title}
              </Badge>
            )}

            {post.cohort && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 hover:bg-purple-200
                  dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
              >
                {post.cohort.title}
              </Badge>
            )}

            {post.course && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700
                  dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                {post.course.title}
              </Badge>
            )}
            
            {post.meetingDate && (
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-100 text-orange-700
                  dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-300
                  dark:hover:bg-orange-500/20"
              >
                <Video className="h-3 w-3 mr-1.5" />
                {format(post.meetingDate, "MMM d, yyyy 'at' h:mm a")}
              </Badge>
            )}
          </div>

          <div
            className="prose prose-slate max-w-none dark:prose-invert
            dark:text-white/70 leading-relaxed"
          >
            <p>{post.content}</p>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold dark:text-white/90">{t.forum.comments}</h2>
        <Card
          className="border dark:border-white/[0.08]
          bg-gradient-to-br from-card/30 to-transparent
          dark:from-black/20 dark:to-transparent 
          dark:backdrop-blur-md dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2)]"
        >
          <div className="p-6">
            <CommentsSection
              postId={post.id}
              comments={post.comments}
              currentUser={user}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
