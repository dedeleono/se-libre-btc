"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { useLocale } from "@/lib/i18n";

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--naranja-050)] to-[var(--crema-100)] dark:from-background dark:to-secondary">
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
          <Mail className="w-12 h-12 text-[var(--terracota-500)]" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold text-foreground mb-2"
        >
          {t.auth.checkEmail}
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground"
        >
          {t.auth.magicLinkSent(email ?? "")}
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground mt-4"
        >
          {t.auth.clickLinkToContinue}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function VerifyRequest() {
  const { t } = useLocale();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--naranja-050)] to-[var(--crema-100)] dark:from-background dark:to-secondary">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Loader2 className="w-12 h-12 text-[var(--terracota-500)] animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.common.loading}
          </h2>
          <p className="text-muted-foreground">
            {t.auth.pleaseWait}
          </p>
        </div>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
} 
