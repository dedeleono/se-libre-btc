import * as z from "zod";
import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

export interface CreateForumFormRef {
  open: () => void;
  close: () => void;
}

interface CreateForumFormProps {
  learningPaths: { id: string; name: string }[];
  cohorts: { id: string; name: string }[];
  courses: { 
    id: string; 
    title: string;
    learningPathId?: string | null;
  }[];
}

export const CreateForumForm = forwardRef<CreateForumFormRef, CreateForumFormProps>(
  ({ learningPaths, cohorts, courses }, ref) => {
    const { t } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const [selectedLearningPath, setSelectedLearningPath] = useState<string | null>(null);
    const formSchema = z.object({
      title: z.string().min(1, t.validation.titleRequired),
      content: z.string().min(1, t.forum.contentRequired),
      learningPathId: z.string().optional(),
      cohortId: z.string().optional(),
      courseId: z.string().optional(),
      meetingLink: z.string().url().optional().or(z.literal("")),
      meetingDate: z.string().optional(),
    });

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: "",
        content: "",
        meetingLink: "",
        meetingDate: "",
      },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      try {
        await axios.post("/api/forum", values);
        toast.success(t.forum.createSuccess);
        router.refresh();
        setIsOpen(false);
      } catch (error) {
        toast.error(t.common.somethingWentWrong);
      }
    };

    const filteredCourses = courses.filter(
      (course) => !selectedLearningPath || course.learningPathId === selectedLearningPath
    );

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.forum.createTopic}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.title}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.forum.titlePlaceholder} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.content}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t.forum.writePost} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learningPathId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.learningPathOptional}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedLearningPath(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.forum.selectLearningPath} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {learningPaths.map((learningPath) => (
                          <SelectItem key={learningPath.id} value={learningPath.id}>
                            {learningPath.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cohortId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.cohortOptional}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.forum.selectCohort} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cohorts.map((cohort) => (
                          <SelectItem key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.courseOptional}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.forum.selectCourse} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.meetingLinkOptional}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://meet.google.com/..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forum.meetingDateOptional}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">{t.forum.createForum}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);

CreateForumForm.displayName = "CreateForumForm";
