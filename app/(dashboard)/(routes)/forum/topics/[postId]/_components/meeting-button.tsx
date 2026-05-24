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
      className="bg-emerald-100/80 text-emerald-700 border-emerald-200
        hover:bg-emerald-200/80 hover:text-emerald-800
        dark:bg-emerald-500/10 dark:text-emerald-300 
        dark:border-emerald-400/20 dark:hover:bg-emerald-500/20
        dark:backdrop-blur-sm transition-all duration-300"
    >
      <Video className="h-4 w-4 mr-2" />
      Join Meeting
    </Button>
  );
};
