import { Progress } from "@/components/ui/progress";
import { useStepper } from "./use-stepper";

interface StepperProgressProps {
  className?: string;
}

export function StepperProgress({ className }: StepperProgressProps) {
  const { activeStep, steps } = useStepper();
  
  // Calculate progress percentage
  const progress = Math.round((activeStep / (steps.length - 1)) * 100);
  
  return (
    <Progress 
      value={progress} 
      className={className}
    />
  );
} 