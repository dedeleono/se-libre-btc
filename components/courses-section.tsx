"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  courses: { id: string }[];
  enrollments: { id: string }[];
}

const CoursesSection = () => {
  const { t } = useLocale();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/learning-paths");
        if (!response.ok) throw new Error("Failed to fetch learning paths");
        setLearningPaths(await response.json());
      } catch (error) {
        console.error("Error fetching learning paths:", error);
        setError(t.public.loadPathsError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPaths();
  }, [t.public.loadPathsError]);

  if (isLoading) {
    return <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)}</div>;
  }

  if (error) {
    return <div className="py-10 text-center"><p className="text-destructive">{error}</p><Button onClick={() => window.location.reload()} className="mt-4" variant="outline">{t.common.retry}</Button></div>;
  }

  return (
    <>
      <div className="mb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="bg-gradient-to-r from-accent via-secondary to-tertiary bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
            {t.public.learningPathsTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground dark:text-white/70">
            {t.public.learningPathsSubtitle}
          </p>
        </motion.div>
      </div>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...learningPaths].sort((a, b) => a.position - b.position).map((path, index) => (
          <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
            <Card className="group overflow-hidden bg-white/80 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-black/40">
              <CardHeader>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2"><Route className="h-6 w-6 text-primary" /></div>
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium">{t.public.coursesCount(path.courses.length)}</span>
                </div>
                <CardTitle className="text-xl font-bold">{path.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground dark:text-white/70">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm">{t.public.learnersCount(path.enrollments.length)}</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{path.description || t.public.defaultPathDescription}</p>
                <Button variant="outline" size="sm" className="mt-6 w-full" asChild>
                  <Link href={`/learning-paths/${path.slug}`}>{t.public.viewPath}</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default CoursesSection;
