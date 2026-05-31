"use client";

import {
  BookAIcon,
  BookOpen,
  Calendar,
  Layout,
  LayoutDashboard,
  LucideIcon,
  Mail,
  MessageCircleIcon,
  Settings,
  UserIcon,
  Users,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

import SidebarItem from "./sidebar-item";

type Route = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type RouteGroup = {
  label: string;
  routes: Route[];
};

const studentRouteGroups: RouteGroup[] = [
  {
    label: "Aprendizaje",
    routes: [
      { icon: Layout, label: "Dashboard", href: "/student" },
      { icon: BookOpen, label: "My Learning", href: "/student/courses" },
      { icon: BookAIcon, label: "Browse Courses", href: "/student/browse" },
      { icon: LayoutDashboard, label: "Learning Paths", href: "/student/learning-paths" },
      { icon: Calendar, label: "Schedule", href: "/student/schedule" },
      { icon: BookOpen, label: "Notes", href: "/student/notes" },
    ],
  },
  {
    label: "Comunidad",
    routes: [
      { icon: MessageCircleIcon, label: "Community", href: "/forum" },
      { icon: UserIcon, label: "Profile", href: "/profile" },
    ],
  },
];

const adminRouteGroups: RouteGroup[] = [
  {
    label: "Admin",
    routes: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: BookAIcon, label: "Courses", href: "/admin/courses" },
      { icon: Layout, label: "Learning Paths", href: "/admin/learning-paths" },
      { icon: Calendar, label: "Cohorts", href: "/admin/cohorts" },
      { icon: Users, label: "Students", href: "/admin/students" },
    ],
  },
  {
    label: "Operaciones",
    routes: [
      { icon: MessageCircleIcon, label: "Community", href: "/forum" },
      { icon: Mail, label: "Emails", href: "/emailing" },
      { icon: Settings, label: "Settings", href: "/admin/settings" },
      { icon: UserIcon, label: "Profile", href: "/profile" },
    ],
  },
];

export const SidebarRoutes = () => {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const routeGroups = userRole === "ADMIN"
    ? adminRouteGroups
    : userRole === "STUDENT"
      ? studentRouteGroups
      : [];

  return (
    <div className="flex w-full flex-col gap-4 px-2 py-3">
      {routeGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="dashboard-sidebar-label px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          {group.routes.map((route) => (
            <SidebarItem key={route.href} icon={route.icon} label={route.label} href={route.href} />
          ))}
        </div>
      ))}
    </div>
  );
};
