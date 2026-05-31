import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { DashboardShell } from "./_components/dashboard-shell";
import { createSsrClient } from "@/lib/supabase/supabaseSsr";

import { auth } from "@/lib/auth";
import { NotificationType } from "@prisma/client";

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
  createdAt: string;
  updatedAt: string;
  sender?: {
    name: string | null;
    image: string | null;
  } | null;
}

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const supabase = createSsrClient();
  
  let notifications: Notification[] = [];
  
  if (session?.user) {
    
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select(`
          *,
          sender:User!senderId (
            name,
            image
          )
        `)
        .eq('receiverId', session.user.id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('Successfully fetched notifications:', data);
        notifications = data as unknown as Notification[];
      }
    } catch (error) {
      console.error('Unexpected error fetching notifications:', error);
    }
  }

  return (
    <DashboardShell
      navbar={
        <Navbar
          notifications={notifications}
          userId={session?.user?.id}
          userRole={session?.user?.role}
        />
      }
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
};

export default DashboardLayout;
