"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface IntroChapterLinkProps {
  href: string;
  chapterId: string;
  children: ReactNode;
  className?: string;
}

export const IntroChapterLink = ({ 
  href, 
  chapterId, 
  children, 
  className = "" 
}: IntroChapterLinkProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const storageKey = `intro_chapter_${chapterId}`;
    console.log('=== Setting Intro Chapter Storage ===');
    console.log('Storage key:', storageKey);
    
    try {
      // Set the storage value
      localStorage.setItem(storageKey, "true");
      
      // Verify it was set
      const isSet = localStorage.getItem(storageKey) === "true";
      console.log('Storage verification:', {
        isSet,
        storageKey,
        allStorage: Object.keys(localStorage)
      });

      if (isSet) {
        console.log('Storage verified, navigating to:', href);
        // Navigate to the chapter
        window.location.href = href;
      } else {
        console.error('Failed to set storage properly');
        alert('Unable to access the preview. Please try again.');
      }
    } catch (error) {
      console.error('Error setting storage:', error);
      alert('An error occurred while trying to access the preview. Please try again.');
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}; 