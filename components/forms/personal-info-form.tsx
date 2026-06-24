import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useStepper } from "@/components/stepper";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Mail, Phone, CreditCard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n";

type PersonalInfoInputs = {
  name: string;
  email: string;
  phone: string;
  dpi: string;
};

interface PersonalInfoFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string;
    dpi: string;
  };
  onSubmit: (data: any) => void;
}

export default function PersonalInfoForm({ initialData, onSubmit }: PersonalInfoFormProps) {
  const { t } = useLocale();
  const { nextStep } = useStepper();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email");
  const personalInfoSchema = z.object({
    name: z.string().min(1, { message: t.validation.nameRequired }),
    email: z.string().email({ message: t.validation.email }),
    phone: z.string().regex(/^[0-9]+$/, { message: t.forms.phoneDigitsOnly }),
    dpi: z.string().min(16, { message: t.forms.dpiRequired }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoInputs>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: initialData,
  });

  const onSubmitForm = (data: PersonalInfoInputs) => {
    onSubmit(data);
    nextStep();
  };

  return (
    <Card className="w-full">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-6 md:p-8 p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label 
              htmlFor="name" 
              className="text-sm font-medium text-foreground dark:text-white/70 flex items-center gap-2"
            >
              <User className="h-4 w-4 text-muted-foreground dark:text-white/50" />
              {t.forms.fullName}
            </Label>
            <Input
              {...register("name")}
              type="text"
              id="name"
              className={`w-full transition-all duration-200 border-border dark:border-white/10 dark:bg-black/40 dark:text-white
                dark:placeholder:text-white/50 focus:border-[var(--naranja-500)] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]
                dark:focus:border-[var(--naranja-500)] dark:focus:ring-[hsl(var(--primary)/0.2)] ${
                  errors.name ? "border-destructive dark:border-destructive" : ""
                }`}
              placeholder={t.forms.fullNamePlaceholder}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
            )}
          </motion.div>

          {/* Email Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label 
              htmlFor="email" 
              className="text-sm font-medium text-foreground dark:text-white/70 flex items-center gap-2"
            >
              <Mail className="h-4 w-4 text-muted-foreground dark:text-white/50" />
              {t.auth.email}
            </Label>
            <Input
              {...register("email")}
              type="email"
              id="email"
              className={`w-full transition-all duration-200 border-border dark:border-white/10 dark:bg-black/40 dark:text-white
                dark:placeholder:text-white/50 focus:border-[var(--naranja-500)] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]
                dark:focus:border-[var(--naranja-500)] dark:focus:ring-[hsl(var(--primary)/0.2)] ${
                  errors.email ? "border-destructive dark:border-destructive" : ""
                } ${emailFromParams ? "bg-muted" : ""}`}
              placeholder={t.forms.emailPlaceholderLong}
              disabled={!!emailFromParams}
              readOnly={!!emailFromParams}
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Phone Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label 
              htmlFor="phone" 
              className="text-sm font-medium text-foreground dark:text-white/70 flex items-center gap-2"
            >
              <Phone className="h-4 w-4 text-muted-foreground dark:text-white/50" />
              {t.forms.phoneNumber}
            </Label>
            <Input
              {...register("phone")}
              type="tel"
              id="phone"
              className={`w-full transition-all duration-200 border-border dark:border-white/10 dark:bg-black/40 dark:text-white
                dark:placeholder:text-white/50 focus:border-[var(--naranja-500)] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]
                dark:focus:border-[var(--naranja-500)] dark:focus:ring-[hsl(var(--primary)/0.2)] ${
                  errors.phone ? "border-destructive dark:border-destructive" : ""
                }`}
              placeholder={t.forms.phoneNumberPlaceholder}
            />
            {errors.phone && (
              <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
            )}
          </motion.div>

          {/* DPI Field */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label 
              htmlFor="dpi" 
              className="text-sm font-medium text-foreground dark:text-white/70 flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground dark:text-white/50" />
              {t.forms.dpiNumber}
            </Label>
            <Input
              {...register("dpi")}
              type="text"
              id="dpi"
              className={`w-full transition-all duration-200 border-border dark:border-white/10 dark:bg-black/40 dark:text-white
                dark:placeholder:text-white/50 focus:border-[var(--naranja-500)] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]
                dark:focus:border-[var(--naranja-500)] dark:focus:ring-[hsl(var(--primary)/0.2)] ${
                  errors.dpi ? "border-destructive dark:border-destructive" : ""
                }`}
              placeholder={t.forms.dpiPlaceholder}
            />
            {errors.dpi && (
              <p className="text-destructive text-sm mt-1">{errors.dpi.message}</p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-[hsl(var(--primary)/0.9)] dark:bg-primary dark:hover:bg-[hsl(var(--primary)/0.9)]
              text-primary-foreground transition-colors duration-200 py-6"
          >
            {t.common.continue}
          </Button>
        </motion.div>
      </motion.form>
    </Card>
  );
}
