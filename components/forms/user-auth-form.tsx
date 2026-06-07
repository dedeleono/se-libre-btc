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
            className="stamp-card flex flex-col items-center space-y-6 p-8 text-center"
          >
            <div className="border-2 border-foreground bg-primary p-4 text-primary-foreground">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl">
                {t.auth.checkEmail}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t.auth.magicLinkSent(sentEmail)}
              </p>
            </div>

            <div
              className="paper-card w-full max-w-sm p-4"
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
            className="stamp-card mx-auto w-full max-w-md p-6"
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
                      <FormLabel htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
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
                          className="transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isPending}
                  className="w-full"
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
                  className="bg-card px-2 font-bold text-muted-foreground"
                >
                  {t.auth.orContinueWith}
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center">
              <Button
                variant="outline"
                className="flex w-full justify-center space-x-2 p-6"
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
