"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

interface EnrollmentButtonProps {
  productId: string;
  productType: "course" | "learningPath" | "cohort";
  redirectTo?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const endpointByType = {
  course: (id: string) => `/api/courses/${id}/enroll`,
  learningPath: (id: string) => `/api/learning-paths/${id}/enroll`,
  cohort: (id: string) => `/api/cohorts/${id}/enroll`,
};

export function EnrollmentButton({
  productId,
  productType,
  redirectTo,
  children,
  className,
  variant,
  size,
}: EnrollmentButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(endpointByType[productType](productId));
      toast.success(response.data?.message || t.toasts.enrollmentComplete);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (error.response?.status === 402) {
        toast.error(t.toasts.enrollmentUnavailable);
        return;
      }
      toast.error(error.response?.data || t.toasts.enrollmentError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? t.course.enrolling : children}
    </Button>
  );
}
