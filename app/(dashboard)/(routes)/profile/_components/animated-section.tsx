"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "x" | "y";
  distance?: number;
}

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = "y",
  distance = 20,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        [direction]: direction === "x" ? distance : distance 
      }}
      animate={{ 
        opacity: 1, 
        [direction]: 0 
      }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
} 