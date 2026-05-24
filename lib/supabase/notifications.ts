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
  submissionId?: string;
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
      const { error } = await supabaseAdmin.from('Notifications').insert({
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

  async createAssignmentSubmissionNotification(
    submissionId: string,
    studentId: string,
    teacherId: string,
    assignmentTitle: string
  ) {
    const now = new Date().toISOString();
    await supabaseAdmin.from('Notifications').insert({
      id: crypto.randomUUID(),
      type: 'ASSIGNMENT_SUBMISSION',
      title: 'New Assignment Submission',
      body: `A student has submitted their work for "${assignmentTitle}"`,
      senderId: studentId,
      receiverId: teacherId,
      submissionId: submissionId,
      isRead: false,
      createdAt: now,
      updatedAt: now
    });
  },

  async createAssignmentGradedNotification(
    submissionId: string,
    teacherId: string,
    studentId: string,
    assignmentTitle: string,
    score: number
  ) {
    const now = new Date().toISOString();
    await supabaseAdmin.from('Notifications').insert({
      id: crypto.randomUUID(),
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded',
      body: `Your submission for "${assignmentTitle}" has been graded. Score: ${score}`,
      senderId: teacherId,
      receiverId: studentId,
      submissionId: submissionId,
      isRead: false,
      createdAt: now,
      updatedAt: now
    });
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
        .from('Notifications')
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
    levelId?: string,
    courseId?: string
  ) {
    try {
      let recipients: { id: string }[] = [];

      if (levelId) {
        const { data: levelUsers, error: levelError } = await supabaseAdmin
          .from('User')
          .select('id')
          .or(`levelId.eq.${levelId},teacherLevels.levelId.eq.${levelId}`)
          .neq('id', authorId);

        if (levelError) {
          console.error('Error fetching level users:', levelError);
          return;
        }
        if (levelUsers) recipients = levelUsers;
      } else if (courseId) {
        const { data: courseUsers, error: courseError } = await supabaseAdmin
          .from('User')
          .select('id')
          .or(`studentCourses.courseId.eq.${courseId},teacherCourses.id.eq.${courseId}`)
          .neq('id', authorId);

        if (courseError) {
          console.error('Error fetching course users:', courseError);
          return;
        }
        if (courseUsers) recipients = courseUsers;
      }

      if (recipients.length > 0) {
        const notifications = recipients.map((recipient) => ({
          type: 'FORUM_POST',
          title: 'New Forum Post',
          body: `New post in forum: "${title}"`,
          senderId: authorId,
          receiverId: recipient.id,
          forumPostId: postId,
          isRead: false,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('Notifications')
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
      await supabaseAdmin.from('Notifications').insert({
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