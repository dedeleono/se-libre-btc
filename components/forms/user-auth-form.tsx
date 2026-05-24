"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
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

const loginFormSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
});

type UserFormValue = z.infer<typeof loginFormSchema>;

export default function UserAuthForm() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

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
      console.log('Attempting to sign in with email:', data.email);
      const callbackUrlValue = callbackUrl && callbackUrl !== '/api/auth/error' 
        ? callbackUrl 
        : "/redirect";
      console.log('Using callback URL:', callbackUrlValue);
      
      const result = await signIn("email", {
        email: data.email,
        callbackUrl: callbackUrlValue,
        redirect: false,
      });

      if (result?.error) {
        console.error("Failed to send verification email:", result.error);
        setError(result.error);
        toast.error("Failed to send verification email. Please try again.");
        return;
      }

      console.log('Verification email sent successfully');
      setSentEmail(data.email);
      setEmailSent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error("Error during sign in:", error);
      setError(error instanceof Error ? error.message : 'Failed to send login link');
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", {
        callbackUrl: "/redirect",
        redirect: false,
      });

      if (result?.error) {
        console.error("Google sign in error:", result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
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
                Revisa tu correo
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Te enviamos un link de login a <br />
                <span className="font-medium text-primary">{sentEmail}</span>
              </p>
            </div>

            <div
              className="bg-muted/30 dark:bg-white/5 rounded-lg p-4 w-full max-w-sm 
              border border-border/50 dark:border-white/[0.05]"
            >
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-5 w-5 text-primary/70" />
                <span>No olvides revisar tu carpeta de spam</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-2 dark:bg-white/5 dark:hover:bg-white/10 
                dark:border-white/10 transition-colors"
              onClick={() => setEmailSent(false)}
            >
              Usar un correo diferente
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
                        Correo electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
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
                  Continuar con mi correo
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
                  O continua con
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
                Continuar con Google
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
