"use client";

import axios from "axios";
import { ArrowDown, ArrowLeft, ArrowUp, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

type CourseOption = {
  id: string;
  title: string;
};

type PathCourse = {
  id: string;
  courseId: string;
  position: number;
  course: CourseOption;
};

type LearningPathFormData = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  isFree: boolean;
  price: string;
  isPublished?: boolean;
  courses?: PathCourse[];
};

interface LearningPathFormProps {
  initialData?: LearningPathFormData;
  courses: CourseOption[];
}

export const LearningPathForm = ({ initialData, courses }: LearningPathFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const isNew = !initialData?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [formData, setFormData] = useState<LearningPathFormData>(
    initialData || {
      title: "",
      slug: "",
      description: "",
      imageUrl: "",
      isFree: true,
      price: "",
      courses: [],
    }
  );

  const sortedPathCourses = useMemo(
    () => [...(formData.courses || [])].sort((a, b) => a.position - b.position),
    [formData.courses]
  );
  const availableCourses = courses.filter(
    (course) => !sortedPathCourses.some((pathCourse) => pathCourse.courseId === course.id)
  );

  const savePath = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        isFree: formData.isFree,
        price: formData.isFree ? null : formData.price || "0",
      };

      if (isNew) {
        const response = await axios.post("/api/learning-paths", payload);
        toast.success(t.admin.learningPathCreated);
        router.push(`/admin/learning-paths/${response.data.id}`);
      } else {
        await axios.patch(`/api/learning-paths/${initialData.id}`, payload);
        toast.success(t.admin.learningPathSaved);
        router.refresh();
      }
    } catch {
      toast.error(t.admin.learningPathSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async (nextPublished: boolean) => {
    if (!initialData?.id) return;

    try {
      setIsSaving(true);
      await axios.patch(`/api/learning-paths/${initialData.id}/${nextPublished ? "publish" : "unpublish"}`);
      toast.success(nextPublished ? t.admin.learningPathPublished : t.admin.learningPathUnpublished);
      router.refresh();
    } catch {
      toast.error(t.admin.learningPathPublishError);
    } finally {
      setIsSaving(false);
    }
  };

  const addCourse = async () => {
    if (!initialData?.id || !selectedCourseId) return;

    try {
      setIsSaving(true);
      await axios.post(`/api/learning-paths/${initialData.id}/courses`, { courseId: selectedCourseId });
      setSelectedCourseId("");
      toast.success(t.admin.courseAdded);
      router.refresh();
    } catch {
      toast.error(t.admin.courseAddError);
    } finally {
      setIsSaving(false);
    }
  };

  const removeCourse = async (courseId: string) => {
    if (!initialData?.id) return;

    try {
      setIsSaving(true);
      await axios.delete(`/api/learning-paths/${initialData.id}/courses/${courseId}`);
      toast.success(t.admin.courseRemoved);
      router.refresh();
    } catch {
      toast.error(t.admin.courseRemoveError);
    } finally {
      setIsSaving(false);
    }
  };

  const reorderCourse = async (pathCourseId: string, direction: "up" | "down") => {
    if (!initialData?.id) return;

    const currentIndex = sortedPathCourses.findIndex((item) => item.id === pathCourseId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedPathCourses.length) return;

    const reordered = [...sortedPathCourses];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      setIsSaving(true);
      await axios.patch(`/api/learning-paths/${initialData.id}/courses/reorder`, {
        list: reordered.map((item, index) => ({ id: item.id, position: index + 1 })),
      });
      router.refresh();
    } catch {
      toast.error(t.admin.courseReorderError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <Link href="/admin/learning-paths" className="flex items-center text-sm transition-opacity hover:opacity-75">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t.admin.backToLearningPaths}
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{isNew ? t.admin.newLearningPath : t.admin.learningPathDetails}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t.admin.editPathDetails}</p>
          </div>
          {!isNew && (
            <Button variant={initialData.isPublished ? "outline" : "default"} disabled={isSaving} onClick={() => publish(!initialData.isPublished)}>
              {initialData.isPublished ? t.admin.unpublish : t.admin.publish}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
              placeholder={t.admin.title}
            />
            <Input
              value={formData.slug}
              onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
              placeholder={t.admin.slug}
            />
          </div>
          <Textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            placeholder={t.admin.description}
          />
          <Input
            value={formData.imageUrl}
            onChange={(event) => setFormData((current) => ({ ...current, imageUrl: event.target.value }))}
            placeholder={t.admin.imageUrl}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={formData.isFree} onCheckedChange={(checked) => setFormData((current) => ({ ...current, isFree: checked }))} />
              {t.admin.freeEnrollment}
            </label>
            <Input
              disabled={formData.isFree}
              value={formData.price}
              onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
              placeholder={t.admin.price}
            />
          </div>
          <Button onClick={savePath} disabled={isSaving || !formData.title.trim()}>
            {isNew ? t.admin.createLearningPath : t.admin.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>{t.nav.courses}</CardTitle>
            <p className="text-sm text-muted-foreground">{t.admin.addRemoveReorderCourses}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t.admin.selectCourse}</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <Button onClick={addCourse} disabled={isSaving || !selectedCourseId}>{t.admin.add}</Button>
            </div>

            <div className="space-y-2">
              {sortedPathCourses.map((pathCourse, index) => (
                <div key={pathCourse.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{pathCourse.course.title}</p>
                    <p className="text-xs text-muted-foreground">{t.admin.position(index + 1)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" disabled={index === 0 || isSaving} onClick={() => reorderCourse(pathCourse.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={index === sortedPathCourses.length - 1 || isSaving} onClick={() => reorderCourse(pathCourse.id, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isSaving} onClick={() => removeCourse(pathCourse.courseId)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {sortedPathCourses.length === 0 && (
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">{t.admin.noCoursesAddedYet}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
