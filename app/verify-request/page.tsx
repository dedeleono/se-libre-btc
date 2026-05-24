"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="mb-4 flex justify-center"
        >
          <Mail className="w-12 h-12 text-blue-500" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2"
        >
          Revisa tu correo
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Hemos enviado un enlace de inicio de sesión a{" "}
          <span className="font-semibold">{email}</span>
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 dark:text-gray-400 mt-4"
        >
          Haz clic en el enlace para continuar
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function VerifyRequest() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Cargando...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, espera un momento
          </p>
        </div>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
} 