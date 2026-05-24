"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, User, Image, CheckCircle } from "lucide-react";
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
import { Stepper, Step, useStepper } from "@/components/stepper";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().optional(),
});

interface OnboardingFormProps {
  organizationId: string;
  userRole: UserRole;
  pendingInvitation?: {
    id: string;
    email: string;
    name: string;
    level: {
      id: string;
      name: string;
      position: number;
      price: number | null;
      inscriptionPrice: number | null;
      inscriptionPaid: boolean;
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

const steps: OnboardingStep[] = [
  {
    id: "personal-info",
    label: "Personal Information",
    icon: User,
    description: "Tell us about yourself"
  },
  {
    id: "profile-picture",
    label: "Profile Picture",
    icon: Image,
    description: "Add your profile picture"
  }
];

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
          ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-600 dark:bg-emerald-600"
          : state === 'success'
          ? "border-green-500 bg-green-500 text-white"
          : state === 'error'
          ? "border-red-500 bg-red-500 text-white"
          : "border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/70"
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: pendingInvitation?.name || "",
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
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await axios.patch("/api/users/me", {
        name: values.name,
        imageUrl: imageUrl,
        onboardingCompleted: true,
      });

      if (response.data) {
        if (pendingInvitation) {
          await axios.post("/api/dashboard/admin/users/complete-invitation", {
            invitationId: pendingInvitation.id,
          });
        }

        toast.success("Profile updated successfully");

        const roleRedirects = {
          [UserRole.ADMIN]: "/admin",
          [UserRole.TEACHER]: "/teacher",
          [UserRole.STUDENT]: "/student",
        };

        router.push(roleRedirects[userRole] || "/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Completa tu perfil</CardTitle>
        <CardDescription>
          Configura tu perfil para que puedas empezar a usar la plataforma.
        </CardDescription>
      </CardHeader>
      
      {/* Overall Process Progress */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
              "border-green-500 bg-green-500 text-white"
            )}>
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500 dark:text-white/70">
              Inscripción y Pago
            </span>
          </div>
          <div className="flex-1 h-[2px] bg-gray-200 dark:bg-white/10 mx-4" />
          <div className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
              "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-600 dark:bg-emerald-600"
            )}>
              2
            </div>
            <span className="ml-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Perfil
            </span>
          </div>
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
                  <div className="text-xs text-gray-500">{step.description}</div>
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => handleStepSubmit('personal-info', { name: form.getValues('name') })}
                >
                  Next
                </Button>
              </div>
            )}

            {currentStepIndex === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Foto de perfil</FormLabel>
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
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => handleStepSubmit('profile-picture', { imageUrl })}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Completar perfil
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
