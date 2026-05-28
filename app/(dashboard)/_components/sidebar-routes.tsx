"use client";

import {
  BookAIcon,
  BookOpen,
  Calendar,
  Layout,
  LayoutDashboard,
  LucideCreditCard,
  LucideIcon,
  Mail,
  MessageCircleIcon,
  Settings,
  UserIcon,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

import SidebarItem from "./sidebar-item";

type Route = {
  icon: LucideIcon;
  label: string;
  href: string;
};

const studentRoutes: Route[] = [
  { icon: Layout, label: "Dashboard", href: "/student" },
  { icon: BookOpen, label: "My Learning", href: "/student/courses" },
  { icon: BookAIcon, label: "Browse Courses", href: "/student/browse" },
  { icon: LayoutDashboard, label: "Learning Paths", href: "/student/learning-paths" },
  { icon: Calendar, label: "Schedule", href: "/student/schedule" },
  { icon: MessageCircleIcon, label: "Community", href: "/forum" },
  { icon: BookOpen, label: "Notes", href: "/student/notes" },
  { icon: LucideCreditCard, label: "Payments", href: "/student/payments" },
  { icon: UserIcon, label: "Profile", href: "/profile" },
];

const adminRoutes: Route[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: BookAIcon, label: "Courses", href: "/admin/courses" },
  { icon: Layout, label: "Learning Paths", href: "/admin/learning-paths" },
  { icon: Calendar, label: "Cohorts", href: "/admin/cohorts" },
  { icon: Users, label: "Students", href: "/admin/students" },
  { icon: MessageCircleIcon, label: "Community", href: "/forum" },
  { icon: LucideCreditCard, label: "Payments", href: "/admin/payments" },
  { icon: Mail, label: "Emails", href: "/emailing" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
  { icon: UserIcon, label: "Profile", href: "/profile" },
];

export const SidebarRoutes = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const routes = userRole === "ADMIN" ? adminRoutes : userRole === "STUDENT" ? studentRoutes : [];

  return (
    <div className="flex w-full flex-col py-2">
      {routes.map((route) => (
        <div key={route.href} className="mb-2">
          <SidebarItem icon={route.icon} label={route.label} href={route.href} />
        </div>
      ))}
    </div>
  );
};
