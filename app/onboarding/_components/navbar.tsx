import { NavbarRoutes } from "@/components/navbar-routes";
import { MobileSidebar } from "../../(dashboard)/_components/mobile-sidebar";
import { NotificationType, UserRole } from "@prisma/client";
import Image from 'next/image'

interface NavbarProps {
  userId?: string;
  userRole?: UserRole;
}

export const Navbar = ({ userId, userRole }: NavbarProps) => {
  return (
    <div
      className="p-4 border-b h-full flex items-center bg-background shadow-sm 
      dark-gradient dark:border-white/[0.05] dark-glass"
    >
      <MobileSidebar />
      <Image src={"/logo.png"} width={150} height={150} alt="" />

      <div className="ml-auto flex items-center ">
        <NavbarRoutes />
      </div>
    </div>
  );
};
