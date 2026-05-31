"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/auth-client";
import { useLocale } from "@/lib/i18n";

type UserFormValue = {
  email: string;
};

export default function UserAuthForm() {
  const { t } = useLocale();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const loginFormSchema = z.object({
    email: z.string().email({ message: t.validation.email }),
  });

  const form = useForm<UserFormValue>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const isPending = form.formState.isSubmitting || loading;

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithMagicLink(data.email, callbackUrl);

      if (result?.error) {
        setError(result.error.message ?? t.toasts.verificationEmailError);
        toast.error(t.toasts.verificationEmailError);
        return;
      }

      setSentEmail(data.email);
      setEmailSent(true);
      toast.success(t.toasts.verificationEmailSent);
    } catch (error) {
      console.error("Error during sign in:", error);
      setError(error instanceof Error ? error.message : t.toasts.verificationEmailError);
      toast.error(t.toasts.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle(callbackUrl);

      if (result?.error) {
        toast.error(result.error.message ?? t.toasts.googleSignInError);
      }
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
      toast.error(t.toasts.googleSignInError);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {emailSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center space-y-6 text-center p-8 rounded-xl 
              bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-border/50 
              dark:border-white/[0.05] shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          >
            <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">
                {t.auth.checkEmail}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t.auth.magicLinkSent(sentEmail)}
              </p>
            </div>

            <div
              className="bg-muted/30 dark:bg-white/5 rounded-lg p-4 w-full max-w-sm 
              border border-border/50 dark:border-white/[0.05]"
            >
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-5 w-5 text-primary/70" />
                <span>{t.auth.checkSpam}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-2 dark:bg-white/5 dark:hover:bg-white/10 
                dark:border-white/10 transition-colors"
              onClick={() => setEmailSent(false)}
            >
              {t.auth.differentEmail}
            </Button>
          </motion.div>
        )}

        {!emailSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-auto p-6 rounded-xl 
              bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-border/50 
              dark:border-white/[0.05] shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email" className="text-foreground/90">
                        {t.auth.email}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t.auth.emailPlaceholder}
                          disabled={isPending}
                          {...field}
                          autoComplete="email"
                          className="bg-white/50 dark:bg-white/5 border-border/50 
                            dark:border-white/[0.05] focus:ring-primary/30 
                            dark:focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white 
                    dark:bg-primary/80 dark:hover:bg-primary/70 transition-colors"
                  type="submit"
                >
                  {t.auth.continueWithEmail}
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-white/[0.05]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span
                  className="bg-background px-2 text-muted-foreground 
                  dark:bg-black/20 dark:text-white/60"
                >
                  {t.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center">
              <Button
                variant="outline"
                className="w-full space-x-2 flex justify-center p-6 text-sm font-medium
                  bg-white/50 dark:bg-white/5 border-border/50 dark:border-white/[0.05]
                  hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                onClick={handleGoogleSignIn}
                disabled={isPending}
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                {t.auth.continueWithGoogle}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
