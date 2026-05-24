"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

interface Level {
  id: string;
  name: string;
  position: number;
  students: {
    id: string;
    name: string | null;
  }[];
  levelCourses: {
    course: {
      title: string;
      imageUrl: string | null;
    };
  }[];
}

const LevelsSection = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLevelClick = (levelId: string) => {
    router.push(`/levels/${levelId}`);
  };

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/levels");
        if (!response.ok) {
          throw new Error("Failed to fetch levels");
        }
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error("Error fetching levels:", error);
        setError("Failed to load levels. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-2xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-accent via-secondary to-tertiary bg-clip-text text-transparent sm:text-5xl font-['Open_Sans']">
            Nuestros Cursos
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Descubre nuestra selección de cursos por grado diseñados para
            potenciar tu aprendizaje
          </p>
        </motion.div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 font-['Open_Sans']">
          {[...levels]
            .sort((a, b) => a.position - b.position)
            .map((level, index) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  className="group overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100/50 
                  hover:border-secondary transition-all duration-300 ease-in-out
                  dark:bg-black/40 dark:border-white/[0.05] dark:hover:border-secondary/50
                  shadow-lg hover:shadow-xl hover:-translate-y-1 dark-card"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-2 rounded-lg bg-primary/10 
                        dark:bg-primary/20 
                        group-hover:bg-primary/20 
                        dark:group-hover:bg-primary/30 
                        transition-colors"
                      >
                        <GraduationCap className="h-6 w-6 text-primary dark:text-primary" />
                      </div>
                      <span
                        className="inline-flex items-center rounded-full bg-secondary/10 
                        dark:bg-secondary/20
                        px-3 py-1 text-sm font-medium text-secondary-foreground dark:text-secondary
                        group-hover:bg-secondary/20 
                        dark:group-hover:bg-secondary/30 
                        transition-colors"
                      >
                        {level.levelCourses.length} cursos
                      </span>
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white/90 font-bold">
                      {level.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-1 flex items-center gap-2 text-gray-600 dark:text-white/70">
                      <span
                        className="bg-accent/10 p-2 rounded-full text-accent 
                        group-hover:bg-accent/20 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="text-sm">{level.students.length} estudiantes</span>
                    </div>
                    <div className="mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30
                          transition-colors duration-300"
                        asChild
                      >
                        <Link href={`/levels/${level.id}`}>Ver cursos</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>
    </>
  );
};

export default LevelsSection;