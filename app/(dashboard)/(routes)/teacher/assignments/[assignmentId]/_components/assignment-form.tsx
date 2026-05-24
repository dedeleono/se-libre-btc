"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QuestionList } from "./question-list";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { IconBadge } from "@/components/icon-badge";
import { ArrowLeft, ClipboardList, Clock, Pencil, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileText, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { 
  AssignmentInterface, 
  AssignmentFormProps, 
  AssignmentFormComponentProps,
  assignmentSchema,
  QuestionResponse
} from "@/types/assignments";
import { Assignment } from "@prisma/client";

// Title Form Component
export const AssignmentTitleForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing(!isEditing);

  const form = useForm<z.infer<typeof assignmentSchema.title>>({
    resolver: zodResolver(assignmentSchema.title),
    defaultValues: {
      title: initialData?.title || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof assignmentSchema.title>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, values);
      toast.success("Título actualizado");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Título
              </h3>
            </div>
            <Button
              onClick={toggleEdit}
              variant="ghost"
              className="cursor-pointer"
            >
              {isEditing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Título
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {!isEditing && (
            <p
              className={cn(
                "text-sm text-slate-700",
                !initialData?.title && "text-slate-500 italic"
              )}
            >
              {initialData?.title || "No title set"}
            </p>
          )}

          {isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="e.g., 'Quiz de Matemáticas 1'"
                          {...field}
                          className="bg-white border-slate-200 focus:border-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-x-2">
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

// Description Form Component
export const AssignmentDescriptionForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof assignmentSchema.description>>({
    resolver: zodResolver(assignmentSchema.description),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof assignmentSchema.description>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, values);
      toast.success("Descripción actualizada");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Descripción
              </h3>
            </div>
            <Button
              onClick={toggleEdit}
              variant="ghost"
              className="cursor-pointer"
            >
              {isEditing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Descripción
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {!isEditing && (
            <div className="text-sm text-slate-700">
              {!initialData?.description && (
                <p className="text-slate-500 italic">No hay descripción</p>
              )}
              {initialData?.description && (
                <div className="prose prose-slate max-w-none">
                  <Preview value={initialData.description} />
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Editor 
                          onChange={field.onChange}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-x-2">
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

// Points Form Component
export const AssignmentPointsForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof assignmentSchema.points>>({
    resolver: zodResolver(assignmentSchema.points),
    defaultValues: {
      maxPoints: initialData?.maxPoints ?? 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof assignmentSchema.points>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, values);
      toast.success("Points updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Punteo Total</h3>
              
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-x-2">
            <Star className="h-4 w-4 text-slate-500" />
            <p className={cn(
              "text-sm",
              initialData?.maxPoints
                ? "text-slate-700 font-medium"
                : "text-slate-500 italic"
            )}>
              {initialData?.maxPoints 
                ? `${initialData.maxPoints} puntos`
                : "Punteo no establecido"}
            </p>
          </div>
          {initialData?.isQuiz && (
            <p className="mt-2 text-xs text-slate-500 italic">
              Las preguntas del quiz deberán sumar 100 puntos, para luego ser normalizadas a este total.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Type Toggle Form Component
export const AssignmentTypeForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof assignmentSchema.submissionMode>>({
    resolver: zodResolver(assignmentSchema.submissionMode),
    defaultValues: {
      isOnline: initialData?.isOnline || false,
    },
  });

  const onSubmit = async (values: { isOnline: boolean }) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, values);
      toast.success("Tipo de tarea actualizado");
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Tipo de Tarea
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="isOnline"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div
                        className={cn(
                          "relative flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                          field.value
                            ? "border-sky-200 bg-sky-50/50"
                            : "border-slate-200 bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              field.value ? "bg-sky-100" : "bg-slate-100"
                            )}
                          >
                            <ClipboardList
                              className={cn(
                                "w-6 h-6",
                                field.value ? "text-sky-600" : "text-slate-600"
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-base">
                              {field.value ? "Quiz" : "Standard Assignment"}
                            </FormLabel>
                            <FormDescription className="mt-1">
                              {field.value
                                ? "Los estudiantes responderán preguntas directamente en la plataforma"
                                : "Los estudiantes enviarán su trabajo como se especifica en forma de archivo"}
                            </FormDescription>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-sky-600"
                          />
                        </FormControl>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <div className="mt-6 flex items-center justify-end gap-x-2">
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

// Submission Mode Form Component
export const AssignmentSubmissionModeForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const hasQuestions = initialData?.questions && initialData.questions.length > 0;

  const form = useForm<z.infer<typeof assignmentSchema.submissionMode>>({
    resolver: zodResolver(assignmentSchema.submissionMode),
    defaultValues: {
      isOnline: hasQuestions ? true : initialData?.isOnline ?? false,
    },
  });

  // Ensure the form is disabled if there are questions
  useEffect(() => {
    if (hasQuestions && !form.getValues("isOnline")) {
      form.setValue("isOnline", true);
    }
  }, [hasQuestions, form]);

  const onSubmit = async (values: { isOnline: boolean }) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, values);
      toast.success("Modo de envío actualizado");
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                Modo de Entrega
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Elige cómo los estudiantes enviarán su tarea
              </p>
            </div>

            <div className="p-6">
              <FormField
                control={form.control}
                name="isOnline"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div
                        className={cn(
                          "relative flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                          field.value
                            ? "border-sky-200 bg-sky-50/50"
                            : "border-slate-200 bg-slate-50/50",
                          hasQuestions && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              field.value ? "bg-sky-100" : "bg-slate-100"
                            )}
                          >
                            <FileText
                              className={cn(
                                "w-6 h-6",
                                field.value ? "text-sky-600" : "text-slate-600"
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-base">
                              {field.value
                                ? "Tarea en Línea"
                                : "Envío de Archivos"}
                            </FormLabel>
                            <FormDescription className="mt-1">
                              {field.value
                                ? "Los estudiantes completarán la tarea directamente en la plataforma"
                                : "Los estudiantes subirán su trabajo como un archivo"}
                            </FormDescription>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || hasQuestions}
                            className="data-[state=checked]:bg-sky-600"
                          />
                        </FormControl>
                      </div>

                      {hasQuestions && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <p className="text-sm text-amber-600">
                            Existen preguntas - el modo de envío está bloqueado a la tarea en línea
                          </p>
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <div className="mt-6 flex items-center justify-end gap-x-2">
                <Button
                  type="submit"
                  disabled={isLoading || hasQuestions}
                  className={cn(
                    "min-w-[120px]",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

// Timer
// export const AssignmentTimerForm = ({
//   initialData,
//   assignmentId,
// }: AssignmentFormComponentProps) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();
//   const [isEditing, setIsEditing] = useState(false);

//   const form = useForm<z.infer<typeof assignmentSchema.timer>>({
//     resolver: zodResolver(assignmentSchema.timer),
//     defaultValues: {
//       timer: initialData?.timer || null,
//     },
//   });

//   const toggleEdit = () => setIsEditing((prev) => !prev);

//   const onSubmit = async (values: z.infer<typeof assignmentSchema.timer>) => {
//     try {
//       setIsLoading(true);
//       await axios.patch(`/api/assignments/${assignmentId}`, values);
//       toast.success("Timer updated");
//       toggleEdit();
//       router.refresh();
//     } catch (error) {
//       toast.error("Something went wrong");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatTimeDisplay = (minutes: number): string => {
//     if (minutes === 0) return "No time limit";

//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;

//     if (hours === 0) {
//       return `${remainingMinutes} mins`;
//     }

//     if (remainingMinutes === 0) {
//       return `${hours} ${hours === 1 ? "hora" : "horas"}`;
//     }

//     return `${hours}${hours === 1 ? "hr" : "hrs"} ${remainingMinutes}mins`;
//   };

//     return (
//       <div className="mt-6">
//         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
//           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-lg font-semibold text-slate-900">
//                   Tiempo Límite
//                 </h3>
//               </div>
//               <Button
//                 onClick={toggleEdit}
//                 variant="ghost"
//                 className="cursor-pointer"
//               >
//                 {isEditing ? (
//                   <>Cancelar</>
//                 ) : (
//                   <>
//                     <Pencil className="w-4 h-4 mr-2" />
//                     Editar Tiempo
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>

//           <div className="p-6">
//             {!isEditing && (
//               <div className="flex items-center gap-x-2">
//                 <div
//                   className={cn(
//                     "flex items-center gap-2 text-sm",
//                     initialData?.timer
//                       ? "text-slate-700"
//                       : "text-slate-500 italic"
//                   )}
//                 >
//                   <Clock className="h-4 w-4" />
//                   <span className="font-medium">
//                     {formatTimeDisplay(initialData?.timer || 0)}
//                   </span>
//                 </div>
//               </div>
//             )}

//             {isEditing && (
//               <Form {...form}>
//                 <form
//                   onSubmit={form.handleSubmit(onSubmit)}
//                   className="space-y-6"
//                 >
//                   <div className="flex flex-col items-center gap-6">
//                     <div className="flex items-center gap-4">
//                       <FormField
//                         control={form.control}
//                         name="timer"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <div className="relative">
//                                 <Input
//                                   type="number"
//                                   min="0"
//                                   max="24"
//                                   disabled={isLoading}
//                                   placeholder="00"
//                                   {...field}
//                                   value={field.value === null ? '' : field.value}
//                                   onChange={(e) => {
//                                     const value = e.target.value === '' ? null : parseInt(e.target.value);
//                                     if (value === null || (!isNaN(value) && value >= 0 && value <= 24)) {
//                                       field.onChange(value);
//                                     }
//                                   }}
//                                   className="w-20 text-center text-2xl font-mono bg-white border-2 border-slate-200 
//                                     focus:border-slate-400 rounded-lg py-4 px-2"
//                                 />
//                                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500">
//                                   HOURS
//                                 </span>
//                               </div>
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />

//                       <span className="text-3xl font-bold text-slate-400 pb-6">
//                         :
//                       </span>

//                       <FormField
//                         control={form.control}
//                         name="timer"
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormControl>
//                               <div className="relative">
//                                 <Input
//                                   type="number"
//                                   min="0"
//                                   max="59"
//                                   disabled={isLoading}
//                                   placeholder="00"
//                                   {...field}
//                                   value={field.value === null ? '' : field.value}
//                                   onChange={(e) => {
//                                     const value = e.target.value === '' ? null : parseInt(e.target.value);
//                                     if (value === null || (!isNaN(value) && value >= 0 && value <= 59)) {
//                                       field.onChange(value);
//                                     }
//                                   }}
//                                   className="w-20 text-center text-2xl font-mono bg-white border-2 border-slate-200 
//                                     focus:border-slate-400 rounded-lg py-4 px-2"
//                                 />
//                                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500">
//                                   MINUTES
//                                 </span>
//                               </div>
//                             </FormControl>
//                           </FormItem>
//                         )}
//                       />
//                     </div>

//                     <Button
//                       disabled={isLoading}
//                       type="submit"
//                       className="bg-slate-700 hover:bg-slate-800 text-white min-w-[120px]"
//                     >
//                       {isLoading ? (
//                         <>
//                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                           Saving...
//                         </>
//                       ) : (
//                         "Save changes"
//                       )}
//                     </Button>
//                   </div>

//                   <FormDescription className="text-center text-sm text-slate-500 italic">
//                     Set both to 0 for no time limit
//                   </FormDescription>
//                 </form>
//               </Form>
//             )}
//           </div>
//         </div>
//       </div>
//     );
// };

//Deadline
export const AssignmentDeadlineForm = ({
  initialData,
  assignmentId,
}: AssignmentFormComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof assignmentSchema.deadline>>({
    resolver: zodResolver(assignmentSchema.deadline),
    defaultValues: {
      deadline: initialData?.deadline 
        ? new Date(initialData.deadline).toISOString().slice(0, 16)
        : null,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof assignmentSchema.deadline>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/assignments/${assignmentId}`, {
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      });
      toast.success("Deadline updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Deadline</h3>
              
            </div>
            <Button
              onClick={toggleEdit}
              variant="ghost"
              className="cursor-pointer"
            >
              {isEditing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Deadline
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {!isEditing && (
            <div className="flex items-center gap-x-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <p
                className={cn(
                  "text-sm",
                  initialData?.deadline
                    ? "text-slate-700"
                    : "text-slate-500 italic"
                )}
              >
                {initialData?.deadline
                  ? new Date(initialData.deadline).toLocaleString()
                  : "No hay deadline"}
              </p>
            </div>
          )}

          {isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          className="bg-white border-slate-200 focus:border-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-x-2">
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Assignment Form Component
export const AssignmentForm = ({
  initialData,
  chapterId,
  defaultIsQuiz = false,
}: AssignmentFormProps) => {
  // Replace the typedInitialData declaration with this:
  const typedInitialData: (Assignment & { questions?: QuestionResponse[] }) | null = initialData ? {
    id: initialData.id,
    title: initialData.title,
    description: initialData.description,
    maxPoints: initialData.maxPoints,
    isQuiz: initialData.isQuiz,
    isOnline: initialData.isOnline,
    timer: initialData.timer,
    deadline: initialData.deadline,
    chapterId: initialData.chapterId,
    createdById: initialData.createdById,
    createdAt: initialData.createdAt,
    updatedAt: initialData.updatedAt,
    questions: ((initialData as any).questions || []).map((q: any) => ({
      id: q.id,
      content: q.content,
      type: q.type,
      points: q.points,
      position: q.position,
      correctOption: q.correctOption,
      options: q.options || [],
      assignmentId: initialData.id,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }))
  } : null;

  return (
    <div className="p-6">
      {/* <Link
        href={`/teacher/assignments`}
        className="flex items-center text-sm hover:opacity-75 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Ir atrás
      </Link> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={ClipboardList} />
              <h2 className="text-xl">Información Básica</h2>
            </div>
            <AssignmentTitleForm
              initialData={typedInitialData}
              assignmentId={initialData?.id as string}
              chapterId={chapterId}
            />
            <AssignmentDescriptionForm
              initialData={typedInitialData}
              assignmentId={initialData?.id as string}
              chapterId={chapterId}
            />
            <AssignmentPointsForm
              initialData={typedInitialData}
              assignmentId={initialData?.id as string}
              chapterId={chapterId}
            />
            {/* <AssignmentDeadlineForm
              initialData={initialData}
              assignmentId={initialData?.id}
              chapterId={chapterId}
            /> */}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-x-2">
            <IconBadge icon={Settings} />
            <h2 className="text-xl">Configuración</h2>
          </div>
            {/* <AssignmentTimerForm
              initialData={typedInitialData}
              assignmentId={initialData?.id as string}
              chapterId={chapterId}
            /> */}
            <AssignmentSubmissionModeForm
              initialData={typedInitialData}
              assignmentId={initialData?.id as string}
              chapterId={chapterId}
            />
        </div>
      </div>

      {typedInitialData && (
        <div className="mt-8">
          <QuestionList
            assignmentId={typedInitialData.id}
            isQuiz={defaultIsQuiz}
            initialQuestions={typedInitialData?.questions || []}
            assignment={typedInitialData}
          />
        </div>
      )}
    </div>
  );
};
