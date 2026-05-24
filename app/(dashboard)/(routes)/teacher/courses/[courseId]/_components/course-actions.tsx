"use client";

import { useState } from "react";
import axios from "axios";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionsProps {
  disabled: boolean;
  courseId: string;
  isPublished: boolean;
}

export const CourseActions = ({
  disabled,
  courseId,
  isPublished,
}: ActionsProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      if (isPublished) {
        await axios.patch(
          `/api/courses/${courseId}/unpublish`
        );
        console.log("course unpublished");
      } else {
        await axios.patch(
          `/api/courses/${courseId}/publish`
        );
        console.log("course published");
      }

      router.refresh();
    } catch (error) {
      console.log("shfkjdshf chapter actinos onClick", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/courses/${courseId}`
      );
      console.log("course deleted");
      router.refresh();
      router.push(`/teacher/courses`);
    } catch (error) {
      console.log("error, chapter actions", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        size={"default"}
        variant={"outline"}
      >
        {isPublished ? "Bajar" : "Publicar"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size={"icon"} disabled={isLoading} variant={"destructive"}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
