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
        toast.success("Learning path created");
        router.push(`/admin/learning-paths/${response.data.id}`);
      } else {
        await axios.patch(`/api/learning-paths/${initialData.id}`, payload);
        toast.success("Learning path saved");
        router.refresh();
      }
    } catch {
      toast.error("Could not save learning path");
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async (nextPublished: boolean) => {
    if (!initialData?.id) return;

    try {
      setIsSaving(true);
      await axios.patch(`/api/learning-paths/${initialData.id}/${nextPublished ? "publish" : "unpublish"}`);
      toast.success(nextPublished ? "Learning path published" : "Learning path unpublished");
      router.refresh();
    } catch {
      toast.error("Could not update publish state");
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
      toast.success("Course added");
      router.refresh();
    } catch {
      toast.error("Could not add course");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCourse = async (courseId: string) => {
    if (!initialData?.id) return;

    try {
      setIsSaving(true);
      await axios.delete(`/api/learning-paths/${initialData.id}/courses/${courseId}`);
      toast.success("Course removed");
      router.refresh();
    } catch {
      toast.error("Could not remove course");
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
      toast.error("Could not reorder courses");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <Link href="/admin/learning-paths" className="flex items-center text-sm transition hover:opacity-75">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to learning paths
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{isNew ? "New Learning Path" : "Learning Path Details"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Edit title, publishing, pricing, and public preview details.</p>
          </div>
          {!isNew && (
            <Button variant={initialData.isPublished ? "outline" : "default"} disabled={isSaving} onClick={() => publish(!initialData.isPublished)}>
              {initialData.isPublished ? "Unpublish" : "Publish"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={formData.title}
              onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
            />
            <Input
              value={formData.slug}
              onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
              placeholder="Slug"
            />
          </div>
          <Textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
          />
          <Input
            value={formData.imageUrl}
            onChange={(event) => setFormData((current) => ({ ...current, imageUrl: event.target.value }))}
            placeholder="Image URL"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={formData.isFree} onCheckedChange={(checked) => setFormData((current) => ({ ...current, isFree: checked }))} />
              Free enrollment
            </label>
            <Input
              disabled={formData.isFree}
              value={formData.price}
              onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
            />
          </div>
          <Button onClick={savePath} disabled={isSaving || !formData.title.trim()}>
            {isNew ? "Create learning path" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <p className="text-sm text-muted-foreground">Add, remove, and reorder courses in this path.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select course</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <Button onClick={addCourse} disabled={isSaving || !selectedCourseId}>Add</Button>
            </div>

            <div className="space-y-2">
              {sortedPathCourses.map((pathCourse, index) => (
                <div key={pathCourse.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{pathCourse.course.title}</p>
                    <p className="text-xs text-muted-foreground">Position {index + 1}</p>
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
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">No courses added yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
