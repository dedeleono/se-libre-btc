"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PreviewAccessCheckProps {
  chapterId: string;
  isIntro: boolean;
}

export const PreviewAccessCheck = ({ chapterId, isIntro }: PreviewAccessCheckProps) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('PreviewAccessCheck - Component mounted');
    
    if (!isIntro) {
      console.log('PreviewAccessCheck - Not an intro chapter, redirecting to sign-in');
      router.push("/sign-in");
      return;
    }

    // Add a small delay to ensure localStorage is accessible
    const timeoutId = setTimeout(() => {
      const storageKey = `intro_chapter_${chapterId}`;
      const hasAccess = localStorage.getItem(storageKey) === "true";

      console.log('PreviewAccessCheck - Storage check:', {
        chapterId,
        isIntro,
        storageKey,
        hasAccess,
        allStorage: Object.keys(localStorage).map(key => ({
          key,
          value: localStorage.getItem(key)
        }))
      });

      if (hasAccess) {
        console.log('PreviewAccessCheck - Access granted, allowing content');
        setIsChecking(false);
      } else {
        console.log('PreviewAccessCheck - No access found, redirecting to sign-in');
        router.push("/sign-in");
      }
    }, 100); // Small delay to ensure localStorage is accessible

    return () => clearTimeout(timeoutId);
  }, [chapterId, isIntro, router]);

  if (isChecking) {
    return null;
  }

  return null;
}; 