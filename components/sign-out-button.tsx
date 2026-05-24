'use client';

import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LogOutIcon, User } from "lucide-react";
import { useSignOut } from "@/hooks/useSignOut";

interface SignOutProps {
  initialUser: {
    name?: string | null;
    image?: string | null;
  }
}

export function SignOut({ initialUser }: SignOutProps) {
  const handleSignOut = useSignOut();
  const { name, image } = initialUser;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-100/80 transition-colors">
      <div className="flex items-center gap-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={image || ""}
            alt={name || ""}
            className="object-cover"
            onError={(e) => {
              console.error("Error loading image:", e);
              e.currentTarget.src = "";
            }}
          />
          <AvatarFallback>
            {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <button 
        onClick={handleSignOut} 
        className="text-slate-500 hover:text-slate-600 transition-colors"
      >
        <LogOutIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
