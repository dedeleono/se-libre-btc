"use client";

import { useState, useEffect, useRef } from "react";
import { Stepper, Step, useStepper } from "@/components/stepper";
import PersonalInfoForm from "@/components/forms/personal-info-form";
import LearningPathSelectionForm from "@/components/forms/learning-path-selection-form";
import PaymentForm from "@/components/forms/payment-form";
import ConfirmationStep from "@/components/forms/confirmation-step";
import { motion } from "framer-motion";
import { LucideIcon, User, GraduationCap, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { CheckoutFormData } from "@/types/checkout";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { StepperProviderRef } from "./stepper/context";
import axios from "axios";

interface CheckoutStep {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const steps: CheckoutStep[] = [
  {
    id: "personal-info",
    label: "Información personal",
    icon: User,
    description: "Cuéntanos sobre ti"
  },
  {
    id: "product-selection",
    label: "Learning path",
    icon: GraduationCap,
    description: "Choose your learning path"
  },
  {
    id: "payment",
    label: "Pago",
    icon: CreditCard,
    description: "Completa tu pago"
  },
  {
    id: "confirmation",
    label: "Confirmación",
    icon: CheckCircle,
    description: "Revisa tu información"
  }
];

const StepIcon = ({ 
  icon: Icon, 
  state, 
  isActive 
}: { 
  icon: LucideIcon; 
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
        {state === 'success' ? (
          <CheckCircle className="w-5 h-5" />
        ) : state === 'error' ? (
          <XCircle className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </motion.div>
    </div>
  );
};

interface CheckoutStepperProps {
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

export default function CheckoutStepper({ pendingInvitation }: CheckoutStepperProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    // Initialize with default values
    const initialData: CheckoutFormData = {
      personalInfo: {
        name: pendingInvitation?.name || searchParams.get("name") || "",
        email: pendingInvitation?.email || searchParams.get("email") || "",
        phone: "",
        dpi: "",
      },
      productSelection: {
        productId: pendingInvitation?.learningPath?.id || "",
        productName: pendingInvitation?.learningPath?.title || "",
        productType: "LEARNING_PATH",
        price: pendingInvitation?.learningPath?.price || 0,
      },
      payment: {
        paymentIntentId: "",
      },
    };

    return initialData;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const { hasCompletedAllSteps } = useStepper();

  const [stepStates, setStepStates] = useState<{
    [key: string]: 'idle' | 'loading' | 'success' | 'error'
  }>({
    personalInfo: 'idle',
    productSelection: 'idle',
    payment: 'idle',
    confirmation: 'idle'
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepperRef = useRef<any & StepperProviderRef>(null);

  const handleStepChange = (newStep: number) => {
    // Only allow moving to steps that have been completed or are next in sequence
    if (newStep <= currentStepIndex + 1) {
      setCurrentStepIndex(newStep);
      
      // Update step states if moving backwards
      if (newStep < currentStepIndex) {
        const currentStepId = steps[currentStepIndex].id;
        setStepStates(prev => ({ ...prev, [currentStepId]: 'idle' }));
      }
    }
  };

  const handleStepSubmit = async (stepId: keyof CheckoutFormData, data: any) => {
    try {
      setStepStates(prev => ({ ...prev, [stepId]: 'loading' }));
      setIsTransitioning(true);
      
      await setFormData(prevData => ({
        ...prevData,
        [stepId]: data,
      }));

      if (!data) {
        throw new Error("Invalid form data");
      }

      // If this is the payment step and we have a pending invitation, update it
      if (stepId === "payment" && pendingInvitation) {
        await axios.post("/api/dashboard/admin/users/complete-invitation", {
          invitationId: pendingInvitation.id,
        });
      }

      // Simulate a brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setStepStates(prev => ({ ...prev, [stepId]: 'success' }));
      
      // If this is the final step (confirmation), redirect to onboarding
      if (currentStepIndex === steps.length - 1) {
        toast.success("¡Inscripción completada! Redirigiendo...");
        // Add a small delay to show the success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = '/onboarding';
      } else {
        // Advance to next step
        setCurrentStepIndex(prev => prev + 1);
      }
      
    } catch (error) {
      console.error("Error submitting step:", error);
      setStepStates(prev => ({ ...prev, [stepId]: 'error' }));
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      // Update the current step index
      setCurrentStepIndex((prevStep) => {
        const newStep = prevStep - 1;
        if (stepperRef.current) {
          stepperRef.current.setStep(newStep);
          // stepperRef.current.nextStep();
        }
        return newStep;
      });
      
      // Get the current step ID and set its state back to idle
      const currentStepId = steps[currentStepIndex].id;
      setStepStates(prev => ({ ...prev, [currentStepId]: 'idle' }));
      
      // Update the Stepper component's internal state
      if (stepperRef.current) {
        stepperRef.current.setStep(currentStepIndex - 1);
      }
    }
  };

  return (
    <div className="min-h-[600px] max-w-4xl mx-auto md:p-8">
      <div className="bg-white dark:bg-black/40 rounded-2xl shadow-lg border border-gray-100 dark:border-white/[0.05]">
        <div className="md:p-6 p-4 border-b border-gray-100 dark:border-white/[0.05]">
          <h1 className="md:text-2xl text-xl font-semibold text-success dark:text-secondary">
            Completa tu inscripción
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/70">
            Por favor, completa la siguiente información para completar tu
            inscripción
          </p>
        </div>

        {/* Overall Process Progress */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-600 dark:bg-emerald-600"
              )}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Inscripción y Pago
              </span>
            </div>
            <div className="flex-1 h-[2px] bg-gray-200 dark:bg-white/10 mx-4" />
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                "border-gray-300 dark:border-white/20 text-gray-500 dark:text-white/70"
              )}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500 dark:text-white/70">
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
                    state={stepStates[step.id as keyof CheckoutFormData]}
                    isActive={currentStepIndex >= index}
                  />
                  <div
                    className={cn(
                      "mt-2 text-xs font-semibold transition-colors duration-200",
                      stepStates[step.id as keyof CheckoutFormData] === 'success'
                        ? "text-green-500"
                        : stepStates[step.id as keyof CheckoutFormData] === 'error'
                        ? "text-red-500"
                        : currentStepIndex === index
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-gray-400 dark:text-white/50"
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Progress
                value={((currentStepIndex + 1) / steps.length) * 100}
                className="h-1 transition-all duration-300"
              />
            </div>
          </div>

          <Stepper
            ref={stepperRef}
            initialStep={currentStepIndex}
            steps={steps}
            className="mb-8 md:hidden"
            onClickStep={handleStepChange}
            scrollTracking={true}
            
          >
            <Step
              label="Información personal"
              icon={User}
              description="Cuéntanos sobre ti"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white dark:bg-black/40 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-white/[0.05]"
              >
                <PersonalInfoForm
                  initialData={formData.personalInfo}
                  onSubmit={(data) => handleStepSubmit("personalInfo", data)}
                />
              </motion.div>
            </Step>
            <Step
              label="Learning path"
              icon={GraduationCap}
              description="Choose the learning path you want to study"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white dark:bg-black/40 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-white/[0.05]"
              >
                <LearningPathSelectionForm
                  initialData={formData.productSelection}
                  onSubmit={(data) => handleStepSubmit("productSelection", data)}
                  onBack={handleStepBack}
                />
              </motion.div>
            </Step>
            <Step
              label="Pago"
              icon={CreditCard}
              description="Completa tu pago"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PaymentForm
                  customerEmail={formData.personalInfo.email}
                  productId={formData.productSelection.productId}
                  amount={formData.productSelection.price}
                  productName={formData.productSelection.productName}
                  productType={formData.productSelection.productType}
                  onBack={handleStepBack}
                />
              </motion.div>
            </Step>
            <Step>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ConfirmationStep formData={formData} onBack={handleStepBack} />
              </motion.div>
            </Step>
          </Stepper>
        </div>
      </div>
    </div>
  );
}
