"use client";

import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface MeetingButtonProps {
  meetingLink: string;
}

export const MeetingButton = ({ meetingLink }: MeetingButtonProps) => {
  const onClick = () => {
    window.open(meetingLink, "_blank");
  };

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="bg-[hsl(var(--success)/0.12)] text-success border-success
        hover:bg-[hsl(var(--success)/0.2)] hover:text-success
        dark:bg-[hsl(var(--success)/0.12)] dark:text-success
        dark:border-success dark:hover:bg-[hsl(var(--success)/0.2)]
        dark:backdrop-blur-sm transition-all duration-300"
    >
      <Video className="h-4 w-4 mr-2" />
      Join Meeting
    </Button>
  );
};
