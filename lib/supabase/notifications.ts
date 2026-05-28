import { NotificationType, UserRole } from '@prisma/client';
import { supabase, supabaseAdmin } from './supabase';
import { prisma } from '@/lib/db';

interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  senderId: string | null;
  receiverId: string;
  paymentId?: string;
  forumPostId?: string;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const SupabaseNotifications = {
  async createPaymentNotification(
    paymentId: string,
    receiverId: string,
    amount: number,
    isReceived: boolean
  ) {
    try {
  
      
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin.from('Notification').insert({
        id: crypto.randomUUID(),
        type: isReceived ? 'PAYMENT_RECEIVED' : 'PAYMENT_PENDING',
        title: isReceived ? 'New Payment Received' : 'New Payment Pending',
        body: `A payment of Q${amount} has been ${
          isReceived ? 'received' : 'initiated'
        } and requires your attention.`,
        senderId: null, // System notification
        receiverId: receiverId,
        paymentId: paymentId,
        isRead: false,
        createdAt: now,
        updatedAt: now
      });

      if (error) {
        console.error('Error creating payment notification:', error);
        throw error;
      }

      
    } catch (error) {
      console.error('Unexpected error creating payment notification:', error);
      throw error;
    }
  },

  async createUserSignupNotification(
    newUserId: string,
    userRole: UserRole,
    userName: string
  ) {
    try {
      
      
      // Use Prisma to fetch admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        },
        select: {
          id: true
        }
      });

      if (!admins || admins.length === 0) {
        console.warn('No admin users found to notify about new signup');
        return;
      }

      

      const now = new Date().toISOString();
      const notifications = admins.map((admin) => ({
        id: crypto.randomUUID(),
        type: 'USER_SIGNUP' as const,
        title: 'New User Registration',
        body: `${userName} has registered as a ${userRole.toLowerCase()}.`,
        senderId: newUserId,
        receiverId: admin.id,
        isRead: false,
        createdAt: now,
        updatedAt: now
      }));

      const { error: insertError } = await supabaseAdmin
        .from('Notification')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting signup notifications:', insertError);
        throw insertError;
      }

      
    } catch (error) {
      console.error('Unexpected error in createUserSignupNotification:', error);
      throw error;
    }
  },

  async createForumPostNotification(
    postId: string,
    authorId: string,
    title: string,
    learningPathId?: string,
    courseId?: string,
    cohortId?: string
  ) {
    try {
      const recipients = courseId
        ? await prisma.courseEnrollment.findMany({ where: { courseId }, select: { userId: true } })
        : learningPathId
          ? await prisma.learningPathEnrollment.findMany({ where: { learningPathId }, select: { userId: true } })
          : cohortId
            ? await prisma.cohortEnrollment.findMany({ where: { cohortId }, select: { userId: true } })
            : [];

      const uniqueRecipients = Array.from(new Set(recipients.map((recipient) => recipient.userId))).filter((id) => id !== authorId);

      if (uniqueRecipients.length > 0) {
        const notifications = uniqueRecipients.map((receiverId) => ({
          type: 'FORUM_POST',
          title: 'New Forum Post',
          body: `New post in forum: "${title}"`,
          senderId: authorId,
          receiverId,
          forumPostId: postId,
          isRead: false,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('Notification')
          .insert(notifications);

        if (insertError) {
          console.error('Error inserting notifications:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in createForumPostNotification:', error);
    }
  },

  async createForumReplyNotification(
    postId: string,
    authorId: string,
    originalPostAuthorId: string,
    postTitle: string
  ) {
    if (authorId !== originalPostAuthorId) {
      await supabaseAdmin.from('Notification').insert({
        type: 'FORUM_REPLY',
        title: 'New Reply to Your Post',
        body: `Someone replied to your post: "${postTitle}"`,
        senderId: authorId,
        receiverId: originalPostAuthorId,
        forumPostId: postId,
        isRead: false,
      });
    }
  },

  async markAsRead(notificationId: string, userId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  },
}; 