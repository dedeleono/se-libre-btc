import { NavbarRoutes } from "@/components/navbar-routes";
import { MobileSidebar } from "./mobile-sidebar";
import { NotificationType, UserRole } from "@prisma/client";
import { ClientNotifications } from "./client-notifications";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  senderId: string | null;
  receiverId: string;
  paymentId?: string;
  forumPostId?: string;
  courseId?: string;
  learningPathId?: string;
  cohortId?: string;
  liveSessionId?: string;
  quizAttemptId?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    name: string | null;
    image: string | null;
  } | null;
}

interface NavbarProps {
  notifications: Notification[];
  userId?: string;
  userRole?: UserRole;
}

export const Navbar = ({ notifications, userId, userRole }: NavbarProps) => {
  return (
    <div
      className="p-4 border-b h-full flex items-center bg-background shadow-sm w-full
      dark-gradient dark:border-white/[0.05] dark-glass"
    >
      <MobileSidebar />

      <div className="ml-auto flex items-center ">
        {userId && notifications && (
          <ClientNotifications 
            notifications={notifications as Notification[]} 
            userId={userId} 
            userRole={userRole || "STUDENT"} 
          />
        )}
        <NavbarRoutes />
      </div>
    </div>
  );
};
