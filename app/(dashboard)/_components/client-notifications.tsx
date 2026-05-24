"use client";

import { NotificationsComponent, NotificationsHandle } from "@/components/notifications";
import { NotificationType, UserRole } from "@prisma/client";
import { useRef } from "react";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  senderId: string | null;
  receiverId: string;
  paymentId?: string;
  submissionId?: string;
  forumPostId?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    name: string | null;
    image: string | null;
  } | null;
}

interface ClientNotificationsProps {
  notifications: Notification[];
  userId: string;
  userRole: UserRole;
}

export const ClientNotifications = ({ notifications, userId, userRole }: ClientNotificationsProps) => {
  const notificationsRef = useRef<NotificationsHandle>(null);

  return (
    <NotificationsComponent 
      ref={notificationsRef}
      notifications={notifications} 
      userId={userId} 
      userRole={userRole} 
    />
  );
}; 