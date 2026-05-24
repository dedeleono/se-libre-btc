"use client";

import { Copy, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CopyEmailProps {
  email: string;
  type: "email" | "carnet";
}

export const CopyEmail = ({ email, type }: CopyEmailProps) => {

  const icon =
    type === "email" ? (
      <Mail className="h-4 w-4 text-blue-600" />
    ) : (
      <CreditCard className="h-4 w-4 text-blue-600" />
    );
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-full">
        {icon}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(email);
          toast.success("Email copiado al portapapeles");
        }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground group rounded-md hover:bg-muted/50 px-2 py-1 transition-colors"
      >
        <span className="truncate text-xs font-medium">{email}</span>
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}; 