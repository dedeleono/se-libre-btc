"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n";

type AccessOption = { id: string; title: string };

export type InviteAccessOptions = {
  courses: AccessOption[];
  learningPaths: AccessOption[];
  cohorts: AccessOption[];
};

type AccessType = "course" | "learningPath" | "cohort";

const NO_ACCESS = "none";

function toAccess(value: string) {
  if (value === NO_ACCESS) return { type: "none" as const };
  const [type, ...rest] = value.split(":");
  return { type: type as AccessType, id: rest.join(":") };
}

export function InviteStudentForm({ options }: { options: InviteAccessOptions }) {
  const { t } = useLocale();
  const copy = t.admin.inviteStudent;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z.object({
    firstName: z.string().trim().min(1, copy.firstNameRequired),
    lastName: z.string().trim().min(1, copy.lastNameRequired),
    email: z.string().trim().email(copy.emailInvalid),
    access: z.string(),
  });
  type InviteValues = z.infer<typeof schema>;

  const form = useForm<InviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", access: NO_ACCESS },
  });
  const { isSubmitting } = form.formState;

  const groups: { type: AccessType; label: string; items: AccessOption[] }[] = [
    { type: "course", label: copy.courses, items: options.courses },
    { type: "learningPath", label: copy.learningPaths, items: options.learningPaths },
    { type: "cohort", label: copy.cohorts, items: options.cohorts },
  ];

  const onSubmit = async (values: InviteValues) => {
    setFormError(null);
    try {
      const { data } = await axios.post<{ email: string }>("/api/admin/invitations", {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        access: toAccess(values.access),
      });
      toast.success(copy.sent(data.email));
      form.reset();
      router.refresh();
    } catch (error) {
      const code = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      if (code === "account_exists" || code === "already_invited") {
        form.setError(
          "email",
          { message: code === "account_exists" ? copy.accountExists : copy.alreadyInvited },
          { shouldFocus: true }
        );
        return;
      }
      if (code === "access_not_found") {
        form.setError("access", { message: copy.accessNotFound }, { shouldFocus: true });
        return;
      }
      setFormError(code === "email_failed" ? copy.emailFailed : copy.genericError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">{copy.title}</CardTitle>
        <CardDescription className="text-pretty">{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.firstName}</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.lastName}</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.email}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={copy.emailPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="access"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.access}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger
                        ref={field.ref}
                        onBlur={field.onBlur}
                        className="w-full rounded-[2px] border-2 bg-card text-base font-semibold data-[size=default]:h-10 md:text-sm dark:bg-card dark:hover:bg-card"
                      >
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ACCESS}>{copy.noAccess}</SelectItem>
                      {groups
                        .filter((group) => group.items.length > 0)
                        .map((group) => (
                          <SelectGroup key={group.type}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.items.map((item) => (
                              <SelectItem key={item.id} value={`${group.type}:${item.id}`}>
                                {item.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{copy.accessHelp}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <p role="alert" className="text-sm font-medium text-destructive text-pretty sm:me-auto">
                {formError}
              </p>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {copy.submit}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
