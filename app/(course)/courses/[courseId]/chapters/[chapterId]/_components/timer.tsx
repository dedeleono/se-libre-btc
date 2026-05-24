"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  minutes: number | null;
  onTimeUp: () => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export const Timer = ({ minutes, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(minutes ? minutes * 60 : 0);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  // If minutes is null or 4999, don't show the timer
  if (!minutes || minutes === 4999) return null;

  // Calculate color based on time remaining
  const getVariant = (): "default" | "destructive" | "outline" | "secondary" => {
    const percentage = (timeLeft / (minutes * 60)) * 100;
    if (percentage > 50) return "secondary";
    if (percentage > 25) return "outline";
    return "destructive";
  };

  return (
    <Badge 
      variant={getVariant()}
      className={cn(
        "px-4 py-2 text-base flex items-center gap-2 transition-all duration-300",
        isPulsing && "scale-105",
        timeLeft <= 300 && "animate-pulse"
      )}
    >
      <Clock className={cn(
        "h-4 w-4",
        timeLeft <= 60 && "animate-spin"
      )} />
      {formatTime(timeLeft)}
    </Badge>
  );
};
