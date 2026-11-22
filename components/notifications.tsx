"use client";

import { type JSX } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NotificationType, UserRole } from "@prisma/client";
import { useEffect, useState, useMemo, memo, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { startVisiblePolling } from "@/lib/notification-polling";

interface Sender {
  name: string | null;
  image: string | null;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  senderId?: string | null;
  receiverId?: string;
  paymentId?: string;
  forumPostId?: string;
  courseId?: string;
  learningPathId?: string;
  cohortId?: string;
  liveSessionId?: string;
  createdAt: string;
  updatedAt?: string;
  sender?: {
    name: string | null;
    image: string | null;
  } | null;
}

interface UserMetadata {
  name: string | null;
  image: string | null;
}

interface NotificationsProps {
  notifications: Notification[];
  userId: string;
  userRole: UserRole;
}

export interface NotificationsHandle {
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

async function markNotificationRead(notificationId: string) {
  const response = await fetch(`/api/notifications/${notificationId}/mark-read`, { method: "PATCH" });
  if (!response.ok) throw new Error("Failed to mark notification as read");
}

async function fetchNotifications(): Promise<Notification[] | null> {
  const response = await fetch("/api/notifications", { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

async function markAllNotificationsRead() {
  const response = await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
  if (!response.ok) throw new Error("Failed to mark all notifications as read");
}

// Memoized notification item component
const NotificationItem = memo(({ 
  notification, 
  onClick, 
  getIcon 
}: { 
  notification: Notification; 
  onClick: (notification: Notification) => void;
  getIcon: (type: NotificationType) => JSX.Element;
}) => {
  const { t } = useLocale();

  return (
    <div
      onClick={() => onClick(notification)}
      className={cn(
        "group px-6 py-4 cursor-pointer transition-all duration-300",
        "hover:bg-muted/50 dark:hover:bg-muted/10",
        !notification.isRead && "bg-primary/5 dark:bg-primary/5",
        "relative overflow-hidden"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 mt-1 p-2 rounded-full transition-all duration-300",
          !notification.isRead 
            ? "bg-primary/10 scale-110" 
            : "bg-muted group-hover:bg-muted/70 scale-100"
        )}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <p className={cn(
            "text-sm leading-none truncate transition-all duration-300",
            !notification.isRead 
              ? "font-semibold text-foreground" 
              : "text-muted-foreground/70 group-hover:text-foreground/70"
          )}>
            {notification.title}
          </p>
          <p className={cn(
            "text-xs line-clamp-2 transition-all duration-300",
            !notification.isRead 
              ? "text-muted-foreground/90" 
              : "text-muted-foreground/50 group-hover:text-muted-foreground/70"
          )}>
            {notification.body}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <span className="group-hover:text-muted-foreground/70 transition-colors duration-300">
              {format(new Date(notification.createdAt), "MMM d, h:mm a")}
            </span>
            {!notification.isRead && (
              <span className="flex items-center gap-1 text-primary">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t.notifications.new}
              </span>
            )}
          </div>
        </div>
      </div>
      {notification.isRead && (
        <div className="absolute inset-y-0 left-0 w-1 bg-muted-foreground/10 group-hover:bg-muted-foreground/20 transition-colors duration-300" />
      )}
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// Notification content component
const NotificationContent = memo(({ 
  notifications, 
  unreadCount, 
  handleNotificationClick,
  getNotificationIcon,
  onMarkAllAsRead 
}: { 
  notifications: Notification[];
  unreadCount: number;
  handleNotificationClick: (n: Notification) => void;
  getNotificationIcon: (type: NotificationType) => JSX.Element;
  onMarkAllAsRead: () => Promise<void>;
}) => {
  const { t } = useLocale();

  return (
  <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
    <CardHeader className="border-b bg-gradient-to-r from-background to-muted/30 px-6 py-4 space-y-1">
      <div className="flex items-center justify-between">
        <CardTitle className="text-foreground">
          {t.notifications.title}
        </CardTitle>
        {unreadCount > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            {t.notifications.newCount(unreadCount)}
          </span>
        )}
      </div>
      <CardDescription className="text-muted-foreground/80 text-xs sm:block hidden">
        {t.notifications.subtitle}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="relative">
            <BellIcon className="w-12 h-12 text-muted-foreground/30" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-muted-foreground/20 rounded-full animate-ping" />
          </div>
          <p className="mt-4 text-muted-foreground/60 text-sm font-medium">{t.notifications.emptyTitle}</p>
          <p className="text-xs text-muted-foreground/40 text-center mt-1">
            {t.notifications.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={handleNotificationClick}
              getIcon={getNotificationIcon}
            />
          ))}
        </div>
      )}
    </CardContent>
    {notifications.length > 0 && unreadCount > 0 && (
      <CardFooter className="border-t p-4 bg-gradient-to-b from-transparent to-muted/5">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground/70"
          onClick={onMarkAllAsRead}
        >
          {t.notifications.markAllAsRead}
        </Button>
      </CardFooter>
    )}
  </Card>
  );
});

NotificationContent.displayName = 'NotificationContent';

// Main notifications component with forwarded ref
export const NotificationsComponent = memo(forwardRef<NotificationsHandle, NotificationsProps>(
  ({ notifications: initialNotifications, userId, userRole }, ref) => {
    const { t } = useLocale();
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const router = useRouter();
    const localChangeRef = useRef(0);

    // Initialize state after mount
    useEffect(() => {
      setMounted(true);
      setNotifications(initialNotifications);
      setUnreadCount(initialNotifications.filter(n => !n.isRead).length);
    }, [initialNotifications]);

    const markAllAsRead = useCallback(async () => {
      let previousNotifications: Notification[] = [];
      let previousUnreadCount = 0;
      
      try {
        // Store current state for rollback if needed
        previousNotifications = [...notifications];
        previousUnreadCount = unreadCount;

        // Optimistically update UI
        localChangeRef.current += 1;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Update database
        await markAllNotificationsRead();
        localChangeRef.current += 1;
        
        // Refresh server state
        router.refresh();
        
        toast.success(t.notifications.markedAllRead, {
          description: t.notifications.cleared
        });
      } catch (error) {
        console.error("Error marking all as read:", error);
        
        // Revert optimistic updates on error
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        
        toast.error(t.notifications.markAllError, {
          description: t.notifications.tryLater
        });
      }
    }, [notifications, unreadCount, router, t.notifications]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      markAllAsRead,
      refreshNotifications: () => {
        setNotifications(initialNotifications);
        setUnreadCount(initialNotifications.filter(n => !n.isRead).length);
      }
    }), [markAllAsRead, initialNotifications]);

    const handleNotificationClick = useCallback(async (notification: Notification) => {
      if (!notification.isRead) {
        try {
          // Optimistically update the UI
          localChangeRef.current += 1;
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          
          // Update the database
          await markNotificationRead(notification.id);
          localChangeRef.current += 1;
          
          // Refresh the router to sync server state
          router.refresh();
        } catch (error) {
          console.error("Error marking notification as read:", error);
          // Revert optimistic update on error
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: false } : n)
          );
          setUnreadCount(prev => prev + 1);
          toast.error(t.notifications.markOneError);
        }
      }

      // Handle navigation based on notification type
      if ((notification.type === NotificationType.PAYMENT_RECEIVED || 
           notification.type === NotificationType.PAYMENT_PENDING) && 
          notification.paymentId) {
        router.refresh();
      } else if ((notification.type === NotificationType.FORUM_POST || 
                  notification.type === NotificationType.FORUM_REPLY) && 
                 notification.forumPostId) {
        router.push(`/forum/topics/${notification.forumPostId}`);
      } else if (notification.type === NotificationType.COURSE_ENROLLED && notification.courseId) {
        router.push(`/courses/${notification.courseId}`);
      } else if (notification.type === NotificationType.LEARNING_PATH_ENROLLED && notification.learningPathId) {
        router.push(`/learning-paths/${notification.learningPathId}`);
      } else if (notification.type === NotificationType.LIVE_SESSION_REMINDER) {
        router.push(userRole === "ADMIN" ? "/admin/cohorts" : "/student/schedule");
      } else if (notification.type === NotificationType.USER_SIGNUP && userRole === "ADMIN") {
        router.push("/admin/students");
      }
    }, [router, userRole, t.notifications.markOneError]);

    const getNotificationIcon = useCallback((type: NotificationType) => {
      switch (type) {
        case "PAYMENT_RECEIVED":
        case "PAYMENT_PENDING":
          return <DollarIcon className="w-4 h-4 text-success" />;
        case "COURSE_ENROLLED":
        case "LEARNING_PATH_ENROLLED":
        case "COHORT_ENROLLED":
        case "COURSE_COMPLETED":
        case "QUIZ_COMPLETED":
        case "LIVE_SESSION_REMINDER":
          return <FileIcon className="w-4 h-4 text-[var(--terracota-500)]" />;
        case "USER_SIGNUP":
          return <UserIcon className="w-4 h-4 text-[var(--terracota-500)]" />;
        case "FORUM_POST":
        case "FORUM_REPLY":
          return <MessageIcon className="w-4 h-4 text-primary" />;
        default:
          return <BellIcon className="w-4 h-4" />;
      }
    }, []);

    const refreshFromServer = useCallback(async () => {
      const changeAtStart = localChangeRef.current;
      try {
        const latest = await fetchNotifications();
        if (!latest || changeAtStart !== localChangeRef.current) return;
        setNotifications(latest);
        setUnreadCount(latest.filter(n => !n.isRead).length);
      } catch {
        return;
      }
    }, []);

    useEffect(() => {
      if (!userId || !mounted) return;
      return startVisiblePolling(refreshFromServer, { doc: document, win: window });
    }, [userId, mounted, refreshFromServer]);

    if (!mounted) {
      return null;
    }

    return (
      <Suspense fallback={null}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label={t.notifications.title}
              className={cn(
                "relative rounded-full transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                unreadCount > 0 && "text-primary dark:text-white/80"
              )}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] flex items-center justify-center text-destructive-foreground font-medium animate-in zoom-in-50 shadow-sm ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-[380px] p-0 mr-4 shadow-lg border-border/50"
            align="end"
          >
            <NotificationContent
              notifications={notifications}
              unreadCount={unreadCount}
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
              onMarkAllAsRead={markAllAsRead}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </Suspense>
    );
  }
));

NotificationsComponent.displayName = 'NotificationsComponent';

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
