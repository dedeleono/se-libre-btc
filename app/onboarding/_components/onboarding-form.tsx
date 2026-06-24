"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, User, Image } from "lucide-react";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { S3FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import { useLocale } from "@/lib/i18n";
import { AgeRangeSelect } from "@/components/forms/age-range-select";
import Combobox from "@/components/ui/combobox";
import { COUNTRIES, getRegionsForCountry, countryHasRegions } from "@/lib/constants/countries";

interface OnboardingFormProps {
  organizationId: string;
  userRole: UserRole;
  pendingInvitation?: {
    id: string;
    email: string;
    name: string;
    learningPath: {
      id: string;
      title: string;
      position: number;
      price: number | null;
    } | null;
    payment: {
      id: string;
      status: string;
    } | null;
  } | null;
}

interface OnboardingStep {
  id: string;
  label: string;
  icon: any;
  description: string;
}

const StepIcon = ({ 
  icon: Icon, 
  state, 
  isActive 
}: { 
  icon: any; 
  state: 'idle' | 'loading' | 'success' | 'error';
  isActive: boolean;
}) => {
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
        isActive
          ? "border-success bg-success text-success-foreground dark:border-success dark:bg-success"
          : state === 'success'
          ? "border-success bg-success text-success-foreground"
          : state === 'error'
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border-border dark:border-white/20 text-muted-foreground dark:text-white/70"
      )}
    >
      <motion.div
        initial={false}
        animate={state === 'loading' ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 1, repeat: state === 'loading' ? Infinity : 0, ease: "linear" }}
      >
        <Icon className="w-5 h-5" />
      </motion.div>
    </div>
  );
};

export default function OnboardingForm({
  organizationId,
  userRole,
  pendingInvitation,
}: OnboardingFormProps) {
  const { t } = useLocale();
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<{
    [key: string]: 'idle' | 'loading' | 'success' | 'error'
  }>({
    'personal-info': 'idle',
    'profile-picture': 'idle'
  });
  const router = useRouter();
  const formSchema = z
    .object({
      name: z.string().min(1, t.validation.nameRequired),
      ageRange: z.string().min(1, t.validation.fieldRequired),
      country: z.string().min(1, t.validation.fieldRequired),
      region: z.string().optional(),
      imageUrl: z.string().optional(),
    })
    .refine((data) => !countryHasRegions(data.country) || !!data.region, {
      message: t.validation.fieldRequired,
      path: ["region"],
    });
  const steps: OnboardingStep[] = [
    {
      id: "personal-info",
      label: t.onboarding.personalInfo,
      icon: User,
      description: t.onboarding.personalInfoDescription
    },
    {
      id: "profile-picture",
      label: t.onboarding.avatar,
      icon: Image,
      description: t.onboarding.avatarDescription
    }
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: pendingInvitation?.name || "",
      ageRange: "",
      country: "",
      region: "",
      imageUrl: "",
    },
  });

  const handleStepSubmit = async (stepId: string, data: any) => {
    try {
      setStepStates(prev => ({ ...prev, [stepId]: 'loading' }));
      
      if (stepId === 'personal-info') {
        await form.setValue('name', data.name);
      } else if (stepId === 'profile-picture') {
        await form.setValue('imageUrl', data.imageUrl);
      }

      // Simulate a brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setStepStates(prev => ({ ...prev, [stepId]: 'success' }));
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Submit the final form
        await onSubmit(form.getValues());
      }
    } catch (error) {
      console.error("Error submitting step:", error);
      setStepStates(prev => ({ ...prev, [stepId]: 'error' }));
      toast.error(t.onboarding.stepError);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await axios.patch("/api/users/me", {
        name: values.name,
        ageRange: values.ageRange,
        country: values.country,
        region: values.region,
        imageUrl: imageUrl,
        onboardingCompleted: true,
      });

      if (response.data) {
        if (pendingInvitation) {
          await axios.post("/api/dashboard/admin/users/complete-invitation", {
            invitationId: pendingInvitation.id,
          });
        }

        toast.success(t.profile.updated);

        const roleRedirects = {
          [UserRole.ADMIN]: "/admin",
          [UserRole.STUDENT]: "/student",
        };

        router.push(roleRedirects[userRole] || "/");
      }
    } catch (error) {
      console.error(error);
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t.onboarding.completeProfile}</CardTitle>
        <CardDescription>
          {t.onboarding.completeProfileDescription}
        </CardDescription>
      </CardHeader>
      
      <div className="px-6 py-4 border-b border-border dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t.onboarding.freeAccess}</p>
            <p className="text-xs text-muted-foreground">
              {t.onboarding.accountReady}
            </p>
          </div>
          <UserAvatar
            userId={organizationId}
            email={pendingInvitation?.email}
            name={form.watch("name")}
            image={imageUrl}
            size={44}
          />
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-8 md:block hidden">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <StepIcon
                  icon={step.icon}
                  state={stepStates[step.id]}
                  isActive={index === currentStepIndex}
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {currentStepIndex === 0 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.profile.fullName}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.profile.fullNamePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.profile.ageRange}</FormLabel>
                      <FormControl>
                        <AgeRangeSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t.profile.ageRangePlaceholder}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.profile.country}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={COUNTRIES.map((c) => ({ label: c.name, value: c.name }))}
                          value={field.value}
                          onChange={(v) => {
                            form.setValue("country", v as string, { shouldValidate: true });
                            form.setValue("region", "", { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {countryHasRegions(form.watch("country")) && (
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.profile.region}</FormLabel>
                        <FormControl>
                          <Combobox
                            options={getRegionsForCountry(form.watch("country")).map((r) => ({
                              label: r,
                              value: r,
                            }))}
                            value={field.value}
                            onChange={(v) =>
                              form.setValue("region", v as string, { shouldValidate: true })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    const valid = await form.trigger(["name", "ageRange", "country", "region"]);
                    if (!valid) return;
                    handleStepSubmit('personal-info', {
                      name: form.getValues('name'),
                      ageRange: form.getValues('ageRange'),
                      country: form.getValues('country'),
                      region: form.getValues('region'),
                    });
                  }}
                >
                  {t.common.continue}
                </Button>
              </div>
            )}

            {currentStepIndex === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>{t.onboarding.profilePhoto}</FormLabel>
                  <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                    <UserAvatar
                      userId={organizationId}
                      email={pendingInvitation?.email}
                      name={form.getValues("name")}
                      image={imageUrl}
                      size={48}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t.onboarding.photoHelp}
                    </p>
                  </div>
                  <S3FileUpload
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url || "")}
                    onUploadComplete={(url) => setImageUrl(url)}
                    type="image"
                    acceptedFileTypes={["image/*"]}
                    variant="profile"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStepIndex(0)}
                  >
                    {t.onboarding.back}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => handleStepSubmit('profile-picture', { imageUrl })}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.onboarding.finishProfile}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </Card>
  );
}
