import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import axios from "axios";

interface PaymentFormProps {
  amount: number;
  inscriptionAmount: number | null;
  customerEmail: string;
  levelId: string;
  levelName: string;
  onBack: () => void;
  isFirstTimeStudent: boolean;
}

export default function PaymentForm({
  amount,
  inscriptionAmount,
  customerEmail,
  levelId,
  levelName,
  onBack,
  isFirstTimeStudent,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [isLoadingYear, setIsLoadingYear] = useState(true);

  const totalAmount = amount + (inscriptionAmount || 0);

  // Fetch the current active academic year when component mounts
  useEffect(() => {
    const fetchActiveAcademicYear = async () => {
      try {
        setIsLoadingYear(true);
        const response = await axios.get("/api/academic-year/active");
        if (response.data?.academicYear?.id) {
          setAcademicYearId(response.data.academicYear.id);
        } else {
          console.error("No active academic year found");
        }
      } catch (error) {
        console.error("Error fetching active academic year:", error);
      } finally {
        setIsLoadingYear(false);
      }
    };

    fetchActiveAcademicYear();
  }, []);

  const handlePayment = async () => {
    if (isProcessing || isLoadingYear) return;
    setIsProcessing(true);

    try {
      if (!levelId || !customerEmail) {
        throw new Error("Missing required payment information");
      }

      if (!academicYearId) {
        throw new Error("No active academic year found. Please contact an administrator.");
      }

      const response = await axios.post("/api/payments/create", {
        levelId,
        customerEmail,
        baseUrl: window.location.origin,
        isFirstTimeStudent,
        monthlyAmount: amount,
        inscriptionAmount: isFirstTimeStudent ? inscriptionAmount : null,
        totalAmount: isFirstTimeStudent ? amount + (inscriptionAmount || 0) : amount,
        academicYearId
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("No checkout URL provided");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al procesar el pago. Por favor intente nuevamente."
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white/90">
              Resumen de Pago
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              Revisa los detalles antes de proceder con el pago
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600 dark:text-white/70">Grado seleccionado</span>
              <span className="font-semibold text-accent dark:text-secondary">{levelName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-white/70">Email</span>
              <span className="font-semibold text-gray-900 dark:text-white/90">{customerEmail}</span>
            </div>
            {isFirstTimeStudent && inscriptionAmount && (
              <div className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 dark:text-white/70">Inscripción</span>
                      <span className="text-xs text-gray-500 dark:text-white/50">Pago único</span>
                    </div>
                    <span className="text-base font-semibold text-gray-900 dark:text-white/90">Q {inscriptionAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 dark:text-white/70">Mensualidad</span>
                      <span className="text-xs text-gray-500 dark:text-white/50">Cargo mensual</span>
                    </div>
                    <span className="text-base font-semibold text-gray-900 dark:text-white/90">Q {amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-sky-900/10 
                  rounded-xl p-6 border border-sky-100 dark:border-sky-500/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-white/70">Subtotal</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-white/90">Q {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-sky-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900 dark:text-white/90">Total a pagar</span>
                      <span className="text-xl font-bold text-sky-900 dark:text-white/90">Q {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isFirstTimeStudent && (
              <div className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-sky-900/10 
                rounded-xl p-6 border border-sky-100 dark:border-sky-500/20 mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-white/70">Mensualidad</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">Cargo mensual</span>
                  </div>
                  <span className="text-xl font-bold text-success dark:text-secondary">Q {amount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || isLoadingYear}
              className="w-full h-14 text-base font-semibold bg-sky-900 hover:bg-sky-800 
                dark:bg-sky-700/90 dark:hover:bg-sky-800/90 transition-all duration-200 rounded-xl shadow-md hover:shadow-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Redirigiendo al pago...</span>
                </>
              ) : isLoadingYear ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Cargando información...</span>
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  <span>Pagar Ahora</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-white/70 p-3">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="text-xs">Pago seguro procesado por <a href="https://recurrente.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-semibold text-indigo-700 hover:text-indigo-500">Recurrente</a></span>
            </div>
          </div>

          <div className="flex justify-start pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
