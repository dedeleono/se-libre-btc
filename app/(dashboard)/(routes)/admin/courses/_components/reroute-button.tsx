"use client";

import { Button } from "@/components/ui/button";
import { Plus, PlusCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function RerouteButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.push("/teacher/create")}
      className={cn(
        "flex items-center gap-2 font-medium rounded-lg",
        className
      )}
    >
      Nuevo Curso
      <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
    </Button>
  );
}
