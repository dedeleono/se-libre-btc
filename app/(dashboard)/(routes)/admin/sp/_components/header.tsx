"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import UserFormCreate, { UserFormRef } from "./create-user-form";

export function Header() {
  const userCreateRef = useRef<UserFormRef>(null);

  return (
    <>
      
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => userCreateRef.current?.open()}
            className="flex items-center gap-2 sm:text-sm text-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Agregar Nuevo Usuario
          </Button>
        </div>
      
      <UserFormCreate ref={userCreateRef} />
    </>
  );
}
