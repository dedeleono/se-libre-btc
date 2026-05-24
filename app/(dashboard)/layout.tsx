import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { createSsrClient } from "@/lib/supabase/supabaseSsr";
import { NotificationsComponent } from "@/components/notifications";
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
  submissionId?: string;
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
        .from('Notifications')
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
    <div className="h-full flex flex-col w-full max-w-full overflow-x-hidden">
      <div className="h-[80px] lg:pl-56 fixed inset-x-0 top-0 w-full z-50">
        <Navbar 
          notifications={notifications} 
          userId={session?.user?.id} 
          userRole={session?.user?.role} 
        />
      </div>
      <div className="hidden lg:flex w-56 flex-col fixed inset-y-0 z-50 left-0">
        <Sidebar />
      </div>
      <main className="lg:pl-56 pt-[80px] h-full min-h-screen w-full dark:bg-sky-100/5 bg-foreground/5 max-w-full flex flex-col">{children}</main>
    </div>
  );
};

export default DashboardLayout;
