'use client';

import { LogOutIcon } from "lucide-react";
import { useSignOut } from "@/hooks/useSignOut";
import { UserAvatar } from "@/components/user-avatar";

interface SignOutProps {
  initialUser: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

export function SignOut({ initialUser }: SignOutProps) {
  const handleSignOut = useSignOut();
  const { id, email, name, image } = initialUser;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted transition-colors">
      <div className="flex items-center gap-x-3">
        <UserAvatar userId={id} email={email} name={name} image={image} size={32} />
        <span className="dashboard-sidebar-label truncate text-sm font-medium">{name || email}</span>
      </div>
      <button 
        onClick={handleSignOut} 
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOutIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
