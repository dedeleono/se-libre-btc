"use client";

import { Layout, Compass, List, User2Icon, BookIcon, TestTube2Icon, MessageCircleIcon, ChevronDown, LucideIcon, Menu, BookAIcon, UserIcon, LayoutDashboard, LucideCreditCard, Mail, BookOpen, Calendar } from "lucide-react";
import SidebarItem from "./sidebar-item";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaToiletPortable } from "react-icons/fa6";
import { IconType } from 'react-icons';

type Route = {
  icon: LucideIcon | IconType;
  label: string;
  href: string;
  children?: Route[];
};

const teacherRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/teacher",
  },
  {
    icon: User2Icon,
    label: "Estudiantes",
    href: "/teacher/students",
  },
  {
    icon: BookIcon,
    label: "Cursos",
    href: "/teacher/courses",
  },
  {
    icon: TestTube2Icon,
    label: "Quizzes y Tareas",
    href: "/teacher/assignments",
  },
  {
    icon: Mail,
    label: "Emails",
    href: "/emailing",
  },
  {
    icon: MessageCircleIcon,
    label: "Foro",
    href: "/forum",
  },
  {
    icon: BookOpen,
    label: "Guías",
    href: "/guides",
  },
  {
    icon: UserIcon,
    label: "Perfil",
    href: "/profile",
  },
];

const studentRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/student",
  },
  {
    icon: List,
    label: "Mis Cursos",
    href: "/student/courses",
  },
  {
    icon: Calendar,
    label: "Calendario",
    href: "/student/calendar",
  },
  {
    icon: FaToiletPortable,
    label: "Portafolio",
    href: "/student/portfolio",
  },
  {
    icon: MessageCircleIcon,
    label: "Foro",
    href: "/forum",
  },
  {
    icon: BookOpen,
    label: "Guías",
    href: "/guides",
  },
  {
    icon: LucideCreditCard,
    label: "Pagos",
    href: "/student/payments",
  },
  {
    icon: UserIcon,
    label: "Perfil",
    href: "/profile",
  },
];

// Filtered versions of teacher routes for admin view
const adminTeacherRoutes = teacherRoutes.filter(
  (route) =>
    // Add the routes you want to exclude from admin view
    route.href !== "/teacher" &&
    route.href !== "/teacher/courses" &&
    route.href !== "/forum" &&
    route.href !== "/profile" &&
    route.href !== "/emailing" &&
    route.href !== "/guides"
);

const adminStudentRoutes = studentRoutes.filter(
  (route) =>
    // Add the routes you want to exclude from admin view
    route.href !== "/student" &&
    route.href !== "/forum" &&
    route.href !== "/student/courses" &&
    route.href !== "/profile" &&
    route.href !== "/guides"
);

const adminRoutes: Route[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/admin",
  },
  {
    icon: UserIcon,
    label: "Estudiantes y Docentes",
    href: "/admin/sp",
  },
  {
    icon: BookAIcon,
    label: "Cursos",
    href: "/admin/courses",
  },
  {
    icon: Mail,
    label: "Emails",
    href: "/emailing",
  },
  {
    icon: MessageCircleIcon,
    label: "Foro",
    href: "/forum",
  },
  {
    icon: BookOpen,
    label: "Guías",
    href: "/guides",
  },
  {
    icon: LucideCreditCard,
    label: "Pagos",
    href: "/admin/payments",
  },
  {
    icon: UserIcon,
    label: "Perfil",
    href: "/profile",
  },
  // {
  //   icon: Menu,
  //   label: "Menú Docentes",
  //   href: "#",
  //   children: adminTeacherRoutes, // Use the filtered version instead of teacherRoutes
  // },
  // {
  //   icon: Menu,
  //   label: "Menú Estudiantes",
  //   href: "#",
  //   children: adminStudentRoutes, // Use the filtered version instead of teacherRoutes
  // },
];

export const SidebarRoutes = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role;
  const routes = userRole === "ADMIN" ? adminRoutes : userRole === "TEACHER" ? teacherRoutes : userRole === "STUDENT" ? studentRoutes : [];
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const renderRoute = (route: Route) => {
    if (route.children) {
      return (
        <div key={route.label} className="mb-2">
          <div
            onClick={() => toggleDropdown(route.label)}
            className={cn(
              "flex items-center justify-between px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md mx-2",
              "hover:bg-slate-100 hover:text-slate-900",
              "dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.06]",
              "cursor-pointer",
              openDropdown === route.label && "bg-sky-50 text-sky-900 dark:bg-white/[0.08] dark:text-white"
            )}
          >
            <div className="flex items-center gap-x-2">
              <route.icon className={cn(
                "h-4 w-4",
                openDropdown === route.label 
                  ? "text-sky-900 dark:text-white" 
                  : "text-slate-500 dark:text-white/50"
              )} />
              <span>{route.label}</span>
            </div>
            <motion.div
              initial={false}
              animate={{ rotate: openDropdown === route.label ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className={cn(
                "h-4 w-4",
                openDropdown === route.label 
                  ? "text-sky-900 dark:text-white" 
                  : "text-slate-500 dark:text-white/50"
              )} />
            </motion.div>
          </div>
          <AnimatePresence initial={false}>
            {openDropdown === route.label && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ml-4 pl-4 my-2 space-y-1 border-l-2 border-slate-200 dark:border-white/[0.08]">
                  {route.children.map((child) => (
                    <SidebarItem
                      key={child.href}
                      icon={child.icon}
                      label={child.label}
                      href={child.href}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className="mb-2">
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col py-2">
      {routes.map(renderRoute)}
    </div>
  );
};
