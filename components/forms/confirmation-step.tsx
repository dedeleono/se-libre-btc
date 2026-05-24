import { useStepper } from "@/components/stepper";
import { CheckoutFormData } from "@/types/checkout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ConfirmationStepProps {
  formData: CheckoutFormData;
  onBack: () => void;
}

export default function ConfirmationStep({ 
  formData,
  onBack 
}: ConfirmationStepProps) {
  const { resetSteps } = useStepper();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order Confirmation</h2>
      <div>
        <h3 className="font-semibold">Personal Information</h3>
        <p>Name: {formData.personalInfo.name}</p>
        <p>Email: {formData.personalInfo.email}</p>
      </div>
      <div>
        <h3 className="font-semibold">Selected Course</h3>
        <p>{formData.levelSelection.levelName}</p>
      </div>
      <div>
        <h3 className="font-semibold">Payment Information</h3>
        <p>
          Payment Status: Successful
        </p>
        
      </div>
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
        <Button
          onClick={resetSteps}
          className="bg-green-500 text-white"
        >
          Complete Order
        </Button>
      </div>
    </div>
  );
}
