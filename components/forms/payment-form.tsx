import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import axios from "axios";
import { useLocale } from "@/lib/i18n";

interface PaymentFormProps {
  amount: number;
  customerEmail: string;
  productId: string;
  productName: string;
  productType: "COURSE" | "LEARNING_PATH";
  onBack: () => void;
}

export default function PaymentForm({
  amount,
  customerEmail,
  productId,
  productName,
  productType,
  onBack,
}: PaymentFormProps) {
  const { t } = useLocale();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (!productId || !customerEmail) {
        throw new Error(t.payments.missingInfo);
      }

      const response = await axios.post("/api/payments/create", {
        customerEmail,
        baseUrl: window.location.origin,
        amount,
        productType,
        courseId: productType === "COURSE" ? productId : undefined,
        learningPathId: productType === "LEARNING_PATH" ? productId : undefined,
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast.success(t.payments.recordedRedirecting);
        window.location.href = "/onboarding";
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t.payments.processingError
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground dark:text-white/90">
              {t.payments.summary}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              {t.payments.reviewDetails}
            </p>
          </div>

          <div className="rounded-xl border border-border dark:border-white/10 bg-white dark:bg-black/40 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground dark:text-white/70">{t.payments.selectedProduct}</span>
              <span className="font-semibold text-accent dark:text-secondary">{productName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground dark:text-white/70">{t.auth.email}</span>
              <span className="font-semibold text-foreground dark:text-white/90">{customerEmail}</span>
            </div>
            <div className="bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-white dark:from-[hsl(var(--primary)/0.2)] dark:to-[hsl(var(--primary)/0.1)] rounded-xl p-6 border border-[hsl(var(--primary)/0.1)] dark:border-[var(--naranja-500)]/20 mt-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground dark:text-white/70">{t.payments.access}</span>
                  <span className="text-xs text-muted-foreground dark:text-white/50">{t.payments.oneTimePayment}</span>
                </div>
                <span className="text-xl font-bold text-success dark:text-secondary">Q {amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-[hsl(var(--primary)/0.9)]
                dark:bg-primary dark:hover:bg-[hsl(var(--primary)/0.9)] transition-all duration-200 rounded-xl shadow-md hover:shadow-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>{t.payments.redirecting}</span>
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  <span>{t.payments.payNow}</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-white/70 p-3">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="text-xs">{t.payments.securePayment} <a href="https://recurrente.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-semibold text-[var(--terracota-700)] hover:text-[var(--terracota-500)]">Recurrente</a></span>
            </div>
          </div>

          <div className="flex justify-start pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.payments.goBack}
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
