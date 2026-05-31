import { useStepper } from "@/components/stepper";
import { CheckoutFormData } from "@/types/checkout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface ConfirmationStepProps {
  formData: CheckoutFormData;
  onBack: () => void;
}

export default function ConfirmationStep({ 
  formData,
  onBack 
}: ConfirmationStepProps) {
  const { t } = useLocale();
  const { resetSteps } = useStepper();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t.forms.orderConfirmation}</h2>
      <div>
        <h3 className="font-semibold">{t.forms.personalInformation}</h3>
        <p>{t.forms.name}: {formData.personalInfo.name}</p>
        <p>{t.forms.email}: {formData.personalInfo.email}</p>
      </div>
      <div>
        <h3 className="font-semibold">{t.forms.selectedCourse}</h3>
        <p>{formData.productSelection.productName}</p>
      </div>
      <div>
        <h3 className="font-semibold">{t.forms.paymentInformation}</h3>
        <p>
          {t.forms.paymentStatusSuccessful}
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
          {t.payments.goBack}
        </Button>
        <Button
          onClick={resetSteps}
          className="bg-green-500 text-white"
        >
          {t.forms.completeOrder}
        </Button>
      </div>
    </div>
  );
}
