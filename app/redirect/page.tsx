"use client"

import { useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Redirect() {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const session = await getSession();

        if (!session?.user) {
          router.push("/");
          return;
        }

        // Add a delay to ensure loading state is visible
        await new Promise(resolve => setTimeout(resolve, 500));

        // Call the validation API
        const response = await fetch("/api/auth/validate-user");
        const data = await response.json();

        if (data.redirectTo) {
          // If we have user info and redirecting to checkout, append it to the URL
          if (data.redirectTo === "/checkout" && data.userInfo) {
            const params = new URLSearchParams({
              email: data.userInfo.email,
              name: data.userInfo.name || ""
            });
            router.push(`${data.redirectTo}?${params.toString()}`);
          } else {
            router.push(data.redirectTo);
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error during redirect:", error);
        router.push("/");
      }
    };

    checkUserRole();
  }, [router]);

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
          <Loader2 className="w-12 h-12 text-blue-500" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2"
        >
          Preparando tu sesión...
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Espera un momento mientras redirigimos a la página correcta
        </motion.p>
      </motion.div>
    </div>
  );
}
