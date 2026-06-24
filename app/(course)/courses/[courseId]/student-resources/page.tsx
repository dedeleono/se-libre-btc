"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Video, File, Image as ImageIcon, Book, Loader2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useLocale } from "@/lib/i18n";

interface ResourcePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  source: string;
}

interface CourseWithResources {
  id: string;
  title: string;
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
  modules: {
    title: string;
    chapters: {
      title: string;
      attachments: {
        id: string;
        name: string;
        url: string;
      }[];
    }[];
  }[];
}

const getFileType = (url: string) => {
  const extension = url.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "mp4":
    case "mov":
    case "avi":
      return "video";
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    default:
      return "document";
  }
};

const getFileIcon = (type: string) => {
  const IconComponent = (() => {
    switch (type) {
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      case "pdf":
        return Book;
      default:
        return File;
    }
  })();

  return IconComponent;
};

export default function ResourcesPage(props: ResourcePageProps) {
  const params = use(props.params);
  const { t } = useLocale();
  const resourceTypes = t.course.resourceTypes;
  const [course, setCourse] = useState<CourseWithResources | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.courseId}/resources`);
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params.courseId]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-x-2 mb-8">
          <Skeleton className="h-4 w-[100px]" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((j) => (
                    <Skeleton key={j} className="h-[60px] w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
          <File className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">{t.course.courseLoadErrorTitle}</h3>
          <p>{t.course.resourcesLoadError}</p>
        </div>
      </div>
    );
  }

  // Group resources by type
  const courseResources = course.attachments.map((attachment: any) => ({
    ...attachment,
    type: getFileType(attachment.url),
    source: t.nav.courses,
  }));

  const chapterResources = course.modules
    .flatMap((module: any) =>
      module.chapters.flatMap((chapter: any) =>
        chapter.attachments.map((attachment: any) => ({
          ...attachment,
          type: getFileType(attachment.url),
          source: `${module.title} - ${chapter.title}`,
        }))
      )
    );

  const allResources = [...courseResources, ...chapterResources];

  const groupedResources = allResources.reduce<Record<string, Resource[]>>(
    (acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    },
    {}
  );

  const hasResources = Object.values(groupedResources).some(
    (resources) => resources.length > 0
  );

  if (!hasResources) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
          <FileText className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">{t.course.noResources}</h3>
          <p>{t.course.noResourcesDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2 text-success dark:text-secondary font-['Open_Sans'] text-balance">{t.course.courseResources}</h1>
        <p className="text-slate-600 dark:text-white/70 font-['Open_Sans'] text-sm">
          {t.course.resourcesSubtitle}
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-success/10 text-slate-600 dark:text-white/70">
          {Object.entries(resourceTypes).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              disabled={key !== 'all' && !groupedResources[key]?.length}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary
                dark:data-[state=active]:bg-success/20 dark:data-[state=active]:text-accent/90
                rounded-lg transition-colors duration-200"
            >
              {label}
              {groupedResources[key]?.length > 0 && (
                <span className="ml-2 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full tabular-nums
                  dark:bg-success/10 dark:text-success/90">
                  {groupedResources[key].length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedResources).map(([type, resources]) => 
            resources.length > 0 && (
              <Card key={type} className="border-slate-200 dark:bg-gradient-to-br dark:from-card/50 
                dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-700 dark:text-white/90">
                    {React.createElement(getFileIcon(type), { className: "h-5 w-5 text-slate-600 dark:text-white/70" })}
                    {resourceTypes[type as keyof typeof resourceTypes] || type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center p-3 w-full bg-sky-50 border-sky-200 border text-sky-700 
                        rounded-md hover:bg-sky-100 transition-colors
                        dark:bg-sky-500/5 dark:border-sky-500/10 dark:text-sky-300"
                    >
                      {React.createElement(getFileIcon(resource.type), { 
                        className: "h-4 w-4 mr-2 flex-shrink-0 dark:text-sky-300/90" 
                      })}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate dark:text-sky-300">
                          {resource.name}
                        </p>
                        <p className="text-xs text-sky-600/80 truncate dark:text-sky-300/70">
                          {resource.source}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 hover:bg-sky-200 dark:hover:bg-sky-500/10"
                        onClick={() => window.open(resource.url, "_blank")}
                      >
                        <Download className="h-4 w-4 dark:text-sky-300" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {Object.keys(resourceTypes)
          .filter((type) => type !== "all")
          .map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {groupedResources[type]?.length ? (
                <Card className="dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 
                  dark:border-white/[0.05] dark:backdrop-blur-xl">
                  <CardContent className="space-y-4 pt-6">
                    {groupedResources[type]?.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center p-3 w-full bg-sky-50 border-sky-200 border text-sky-700 
                          rounded-md hover:bg-sky-100 transition-colors
                          dark:bg-sky-500/5 dark:border-sky-500/10 dark:text-sky-300"
                      >
                        {React.createElement(getFileIcon(resource.type), { 
                          className: "h-4 w-4 mr-2 flex-shrink-0 dark:text-sky-300/90" 
                        })}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate dark:text-sky-300">
                            {resource.name}
                          </p>
                          <p className="text-xs text-sky-600/80 truncate dark:text-sky-300/70">
                            {resource.source}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 hover:bg-sky-200 dark:hover:bg-sky-500/10"
                          onClick={() => window.open(resource.url, "_blank")}
                        >
                          <Download className="h-4 w-4 dark:text-sky-300" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
