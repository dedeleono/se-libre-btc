"use client";

import axios from "axios";
// import MuxPlayer from "@mux/mux-player-react"
import { SyntheticEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
// import {useConfettiStore} from "@/hooks/use-confetti-store"

interface VideoPlayerProps {
  chapterId: string;
  title: string;
  courseId: string;
  nextChapterId?: string;
  isLocked: boolean;
  completeOnEnd: boolean;
  videoUrl: string;
}

export const VideoPlayer = ({
  chapterId,
  title,
  courseId,
  nextChapterId,
  isLocked,
  completeOnEnd,
  videoUrl,
}: VideoPlayerProps) => {
    function handleVideoEnded(event: SyntheticEvent<HTMLVideoElement, Event>): void {
        throw new Error("Function not implemented.");
    }

  return (
    <div className="relative aspect-video ">
      {/* {!isLocked && (
        <div className="flex items-center justify-center bg-slate-800 w-full text-white">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      )}
      {isLocked && (
        <div className="flex items-center justify-center bg-slate-800 w-full h-full text-white">
          <Lock className="h-8 w-8 text-secondary" />
          <p className="text-small">This chapter is locked</p>
        </div>
      )} */}
      <Label className="text-left p-3 mt-5 font-bold capitalize">{title}</Label>
      <video
        className="w-full h-full"
        src={videoUrl}
        controls
        // muted
        // onEnded={handleVideoEnded}
      />
    </div>
  );
};
