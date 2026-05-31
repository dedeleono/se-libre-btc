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
import { useLocale } from "@/lib/i18n";

type Route = {
  icon: LucideIcon;
  label: string;
  href: string;
};

type RouteGroup = {
  label: string;
  routes: Route[];
};

export const SidebarRoutes = () => {
  const { data: session } = useSession();
  const { t } = useLocale();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const studentRouteGroups: RouteGroup[] = [
    {
      label: t.nav.learning,
      routes: [
        { icon: Layout, label: t.nav.dashboard, href: "/student" },
        { icon: BookOpen, label: t.nav.myLearning, href: "/student/courses" },
        { icon: BookAIcon, label: t.nav.browseCourses, href: "/student/browse" },
        { icon: LayoutDashboard, label: t.nav.learningPaths, href: "/student/learning-paths" },
        { icon: Calendar, label: t.nav.schedule, href: "/student/schedule" },
        { icon: BookOpen, label: t.nav.notes, href: "/student/notes" },
      ],
    },
    {
      label: t.nav.communityGroup,
      routes: [
        { icon: MessageCircleIcon, label: t.nav.community, href: "/forum" },
        { icon: UserIcon, label: t.nav.profile, href: "/profile" },
      ],
    },
  ];
  const adminRouteGroups: RouteGroup[] = [
    {
      label: t.nav.admin,
      routes: [
        { icon: LayoutDashboard, label: t.nav.dashboard, href: "/admin" },
        { icon: BookAIcon, label: t.nav.courses, href: "/admin/courses" },
        { icon: Layout, label: t.nav.learningPaths, href: "/admin/learning-paths" },
        { icon: Calendar, label: t.nav.cohorts, href: "/admin/cohorts" },
        { icon: Users, label: t.nav.students, href: "/admin/students" },
      ],
    },
    {
      label: t.nav.operations,
      routes: [
        { icon: MessageCircleIcon, label: t.nav.community, href: "/forum" },
        { icon: Mail, label: t.nav.emails, href: "/emailing" },
        { icon: Settings, label: t.nav.settings, href: "/admin/settings" },
        { icon: UserIcon, label: t.nav.profile, href: "/profile" },
      ],
    },
  ];
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
