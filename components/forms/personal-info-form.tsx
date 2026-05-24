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
import { PersonalInfo } from "@/types/checkout";
import { useSearchParams } from "next/navigation";

// Define the validation schema
const personalInfoSchema = z.object({
  name: z.string().min(1, { message: 'Nombre es requerido' }),
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  phone: z.string().regex(/^[0-9]+$/, { message: 'Número de teléfono debe contener solo dígitos' }),
  dpi: z.string().min(16, { message: 'DPI es requerido' }),
});

// Infer the type from the schema
type PersonalInfoInputs = z.infer<typeof personalInfoSchema>;

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
  const { nextStep } = useStepper();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email");

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
              className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2"
            >
              <User className="h-4 w-4 text-gray-500 dark:text-white/50" />
              Nombre completo
            </Label>
            <Input
              {...register("name")}
              type="text"
              id="name"
              className={`w-full transition-all duration-200 border-gray-200 dark:border-white/10 dark:bg-black/40 dark:text-white 
                dark:placeholder:text-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                dark:focus:border-blue-400 dark:focus:ring-blue-400/20 ${
                  errors.name ? "border-red-500 dark:border-red-500" : ""
                }`}
              placeholder="Ingresa tu nombre completo"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
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
              className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2"
            >
              <Mail className="h-4 w-4 text-gray-500 dark:text-white/50" />
              Correo electrónico
            </Label>
            <Input
              {...register("email")}
              type="email"
              id="email"
              className={`w-full transition-all duration-200 border-gray-200 dark:border-white/10 dark:bg-black/40 dark:text-white 
                dark:placeholder:text-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                dark:focus:border-blue-400 dark:focus:ring-blue-400/20 ${
                  errors.email ? "border-red-500 dark:border-red-500" : ""
                } ${emailFromParams ? "bg-gray-100" : ""}`}
              placeholder="Ingresa tu correo electrónico"
              disabled={!!emailFromParams}
              readOnly={!!emailFromParams}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
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
              className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2"
            >
              <Phone className="h-4 w-4 text-gray-500 dark:text-white/50" />
              Número de teléfono
            </Label>
            <Input
              {...register("phone")}
              type="tel"
              id="phone"
              className={`w-full transition-all duration-200 border-gray-200 dark:border-white/10 dark:bg-black/40 dark:text-white 
                dark:placeholder:text-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                dark:focus:border-blue-400 dark:focus:ring-blue-400/20 ${
                  errors.phone ? "border-red-500 dark:border-red-500" : ""
                }`}
              placeholder="Ingresa tu número de teléfono"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
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
              className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4 text-gray-500 dark:text-white/50" />
              Número de DPI
            </Label>
            <Input
              {...register("dpi")}
              type="text"
              id="dpi"
              className={`w-full transition-all duration-200 border-gray-200 dark:border-white/10 dark:bg-black/40 dark:text-white 
                dark:placeholder:text-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                dark:focus:border-blue-400 dark:focus:ring-blue-400/20 ${
                  errors.dpi ? "border-red-500 dark:border-red-500" : ""
                }`}
              placeholder="Ingresa tu número de DPI"
            />
            {errors.dpi && (
              <p className="text-red-500 text-sm mt-1">{errors.dpi.message}</p>
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
            className="w-full bg-sky-900 hover:bg-sky-800 dark:bg-sky-700/90 dark:hover:bg-sky-800/90 
              text-white transition-colors duration-200 py-6"
          >
            Continuar
          </Button>
        </motion.div>
      </motion.form>
    </Card>
  );
}
