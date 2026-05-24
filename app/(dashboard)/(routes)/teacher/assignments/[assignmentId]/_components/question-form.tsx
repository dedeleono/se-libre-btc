"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Question, QuestionType } from "@prisma/client";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Loader2, PlusCircle, X } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@/components/editor";
import { cn } from "@/lib/utils";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { FileText, ListChecks, Upload, Type, AlignJustify, ArrowRightLeft } from "lucide-react";
import { calculateTotalQuizPoints, validateAndAdjustQuestionPoints } from "@/actions/score-calcs";
import { S3FileUpload } from "@/components/file-upload";

// Make sure QuestionResponse is imported or defined the same way
interface QuestionResponse extends Question {
  options: QuestionOption[];
}

interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

interface QuestionOption {
  id: string;
  content: string;
  questionId: string;
  hasBlank?: boolean;
  blankPlaceholder?: string | null;
  correctBlankText?: string | null;
}

interface QuestionFormProps {
  assignmentId: string;
  isQuiz: boolean;
  initialData?: QuestionResponse; // Update this
  onSuccess: (question: QuestionResponse) => void; // Update this
  onClose: () => void;
}

const formSchema = z.object({
  content: z.string().min(1, "Question is required"),
  type: z.nativeEnum(QuestionType),
  points: z.number().min(0, "Points must be positive"),
  options: z.array(z.string()).optional(),
  correctOption: z.string().optional(),
});

export const QuestionForm = forwardRef<
  { open: () => void; close: () => void },
  QuestionFormProps
>(({ assignmentId, isQuiz, initialData, onClose, onSuccess }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setIsModalOpen] = useState(initialData ? true : false);
  const [questionType, setQuestionType] = useState<"open" | "multiple" | "open-with-file" | "fill-in-blank" | "matching">(
    initialData?.type === QuestionType.MULTIPLE_CHOICE ? "multiple" :
    initialData?.type === QuestionType.OPEN_ENDED_WITH_FILE ? "open-with-file" :
    initialData?.type === QuestionType.FILL_IN_THE_BLANK ? "fill-in-blank" :
    initialData?.type === QuestionType.MATCHING ? "matching" : "open"
  );
  const [editorContent, setEditorContent] = useState(initialData?.content || "");
  const [options, setOptions] = useState<string[]>(
    initialData?.options?.map((o: QuestionOption) => o.content) || ["", ""]
  );
  const [correctOption, setCorrectOption] = useState(initialData?.correctOption || "");
  const [totalQuizPoints, setTotalQuizPoints] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [blankAnswers, setBlankAnswers] = useState<{id: string, answer: string}[]>(
    initialData?.type === QuestionType.FILL_IN_THE_BLANK && initialData?.correctOption 
      ? JSON.parse(initialData.correctOption) 
      : []
  );
  
  // For matching questions
  const [matchingPrompts, setMatchingPrompts] = useState<{id: string, content: string, position: number}[]>([]);
  const [matchingChoices, setMatchingChoices] = useState<{id: string, content: string, position: number}[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<{promptId: string, choiceId: string}[]>([]);
  const [scoringPolicy, setScoringPolicy] = useState<"ALL_OR_NOTHING" | "PARTIAL_PER_PAIR" | "PARTIAL_WITH_PENALTY">("PARTIAL_PER_PAIR");
  const [allowReuse, setAllowReuse] = useState(false);
  const [shuffleChoices, setShuffleChoices] = useState(true);


  useImperativeHandle(ref, () => ({
    open: () => setIsModalOpen(true),
    close: () => setIsModalOpen(false),
  }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: initialData?.content || "",
      type: initialData?.type || QuestionType.OPEN_ENDED,
      points: initialData?.points || 0,
      options: initialData?.options?.map(o => o.content) || ["", ""],
      correctOption: initialData?.correctOption || "",
    },
  });

  const { isValid } = form.formState;

  useEffect(() => {
    const fetchQuizPoints = async () => {
      try {
        const response = await axios.get(`/api/assignments/${assignmentId}/module-scoring`);
        setTotalQuizPoints(response.data.quizWeight);
      } catch (error) {
        console.error("Failed to fetch quiz points:", error);
      }
    };

    if (isQuiz) {
      fetchQuizPoints();
    }
  }, [assignmentId, isQuiz]);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      
      // For matching questions, we don't need rich text content
      if (questionType !== "matching" && !editorContent.trim()) {
        toast.error("Question content is required");
        return;
      }
      
      // Set a default content for matching questions if empty
      const finalContent = questionType === "matching" ? 
        (editorContent.trim() || "Matching Question") : 
        editorContent;

      // Validate multiple choice specific fields
      if (questionType === "multiple") {
        if (options.some(opt => !opt.trim())) {
          toast.error("All options must be filled out");
          return;
        }
        if (!correctOption) {
          toast.error("Please select a correct answer");
          return;
        }
      }

      // Get all existing questions for this assignment
      const existingQuestions = await axios.get(`/api/assignments/${assignmentId}/questions`);
      const allQuestions = existingQuestions.data;

      // Calculate default points for new question to maintain 100 total
      const currentTotal = calculateTotalQuizPoints(allQuestions);
      const remainingPoints = 100 - currentTotal;
      let questionPoints = form.getValues("points");

      // If it's a new question and no points were set, calculate default
      if (!initialData && questionPoints === 0) {
        questionPoints = Math.round((remainingPoints / (allQuestions.length + 1)) * 10) / 10;
      }

      // Prepare options
      const processedOptions = options.map((option) => ({
        content: option,
      }));

      // For fill-in-the-blank questions, store the answers as JSON in correctOption
      const correctOptionValue = questionType === "fill-in-blank" 
        ? JSON.stringify(blankAnswers) 
        : questionType === "multiple" ? correctOption : null;
        
      // Validate matching question fields
      if (questionType === "matching") {
        if (matchingPrompts.length < 2) {
          toast.error("Debe agregar al menos 2 elementos para relacionar");
          return;
        }
        if (matchingChoices.length < 2) {
          toast.error("Debe agregar al menos 2 opciones para relacionar");
          return;
        }
        if (matchingPairs.length < 1) {
          toast.error("Debe establecer al menos una relación correcta");
          return;
        }
      }

      const payload = {
        content: finalContent,
        type: questionType === "multiple" ? QuestionType.MULTIPLE_CHOICE :
              questionType === "open-with-file" ? QuestionType.OPEN_ENDED_WITH_FILE :
              questionType === "fill-in-blank" ? QuestionType.FILL_IN_THE_BLANK :
              questionType === "matching" ? QuestionType.MATCHING :
              QuestionType.OPEN_ENDED,
        options: questionType === "multiple" ? processedOptions : [],
        correctOption: correctOptionValue,
        points: questionPoints,
        // Include matching data if applicable
        matchingData: questionType === "matching" ? {
          prompts: matchingPrompts,
          choices: matchingChoices,
          pairs: matchingPairs,
          config: {
            scoringPolicy,
            allowReuse,
            shuffleChoices
          }
        } : undefined
      };

      const url = initialData
        ? `/api/assignments/${assignmentId}/questions/${initialData.id}`
        : `/api/assignments/${assignmentId}/questions`;

      const response = await axios[initialData ? "patch" : "post"](url, payload);
      const questionResponse = response.data;
      
      // Log the response for debugging
      console.log("Question response from server:", JSON.stringify({
        id: questionResponse.id,
        type: questionResponse.type,
        matchingConfig: questionResponse.matchingConfig ? true : false,
        matchingPrompts: questionResponse.matchingPrompts ? questionResponse.matchingPrompts.length : 0,
        matchingChoices: questionResponse.matchingChoices ? questionResponse.matchingChoices.length : 0,
        matchingPairs: questionResponse.matchingPairs ? questionResponse.matchingPairs.length : 0
      }, null, 2));

      // After adding/updating a question, rebalance all questions to sum 100
      await axios.post(`/api/assignments/${assignmentId}/questions/rebalance`);

      toast.success(`Question ${initialData ? "updated" : "created"} successfully`);
      onSuccess(questionResponse);
      onClose();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const handleFileUpload = (url: string) => {
    setUploadedFiles((prev) => [...prev, url]);
  };

  const handleFileDelete = (urlToDelete: string) => {
    setUploadedFiles((prev) => prev.filter((url) => url !== urlToDelete));
  };


  
  const addBlankAnswer = () => {
    setBlankAnswers(prev => [...prev, { id: `blank-${Date.now()}`, answer: "" }]);
  };
  
  const removeBlankAnswer = (id: string) => {
    setBlankAnswers(prev => prev.filter(item => item.id !== id));
  };
  
  const updateBlankAnswer = (id: string, answer: string) => {
    setBlankAnswers(prev => prev.map(item => 
      item.id === id ? { ...item, answer } : item
    ));
  };
  
  const processContentWithBlanks = (content: string) => {
    // This function processes the content to identify blanks in the format [blank:answer]
    // and updates the blankAnswers state accordingly
    const blankRegex = /\[blank:(.*?)\]/g;
    const matches = Array.from(content.matchAll(blankRegex));
    
    // Create new blank answers from the matches
    const newBlankAnswers = matches.map((match, index) => {
      const existingBlank = blankAnswers.find(b => b.answer === match[1]);
      return existingBlank || { 
        id: `blank-${Date.now()}-${index}`, 
        answer: match[1] 
      };
    });
    
    if (newBlankAnswers.length > 0) {
      setBlankAnswers(newBlankAnswers);
    }
    
    return content;
  };

  // Matching question functions
  const addMatchingPrompt = () => {
    const newPrompt = {
      id: `prompt-${Date.now()}`,
      content: "",
      position: matchingPrompts.length
    };
    setMatchingPrompts(prev => [...prev, newPrompt]);
  };

  const updateMatchingPrompt = (id: string, content: string) => {
    setMatchingPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, content } : p
    ));
  };

  const removeMatchingPrompt = (id: string) => {
    setMatchingPrompts(prev => prev.filter(p => p.id !== id));
    // Also remove any pairs that use this prompt
    setMatchingPairs(prev => prev.filter(pair => pair.promptId !== id));
  };

  const addMatchingChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      content: "",
      position: matchingChoices.length
    };
    setMatchingChoices(prev => [...prev, newChoice]);
  };

  const updateMatchingChoice = (id: string, content: string) => {
    setMatchingChoices(prev => prev.map(c => 
      c.id === id ? { ...c, content } : c
    ));
  };

  const removeMatchingChoice = (id: string) => {
    setMatchingChoices(prev => prev.filter(c => c.id !== id));
    // Also remove any pairs that use this choice
    setMatchingPairs(prev => prev.filter(pair => pair.choiceId !== id));
  };

  const updateMatchingPair = (promptId: string, choiceId: string) => {
    // If not allowing reuse, remove any existing pairs with this choice
    if (!allowReuse) {
      setMatchingPairs(prev => prev.filter(pair => pair.choiceId !== choiceId));
    }
    
    // Remove any existing pair with this prompt
    setMatchingPairs(prev => {
      const filtered = prev.filter(pair => pair.promptId !== promptId);
      return [...filtered, { promptId, choiceId }];
    });
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold">
            {initialData ? "Editar Pregunta" : "Agregar Nueva Pregunta"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crea preguntas con contenido enriquecido y opciones múltiples
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8">
            {/* Question Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Tipo de Pregunta</Label>
              <RadioGroup
                defaultValue={questionType}
                onValueChange={(value) => setQuestionType(value as "open" | "multiple" | "open-with-file" | "fill-in-blank" | "matching")}
                className="grid grid-cols-2 gap-4"
              >
                <div
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all hover:border-indigo-300",
                    questionType === "open"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="open" id="open" />
                  <Label htmlFor="open" className="flex items-center cursor-pointer">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    
                      <p className="font-medium">Abierta</p>
                      
                    
                  </Label>
                </div>
                <div
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all hover:border-indigo-300",
                    questionType === "multiple"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple" className="flex items-center cursor-pointer">
                    <ListChecks className="h-5 w-5 mr-2 text-indigo-600" />

                        <p className="font-medium">Opción Múltiple</p>


                  </Label>
                </div>
                <div
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all hover:border-indigo-300",
                    questionType === "open-with-file"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="open-with-file" id="open-with-file" />
                  <Label htmlFor="open-with-file" className="flex items-center cursor-pointer">
                    <Upload className="h-5 w-5 mr-2 text-indigo-600" />

                        <p className="font-medium">Abierta con Archivo</p>


                  </Label>
                </div>

                <div
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all hover:border-indigo-300",
                    questionType === "fill-in-blank"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="fill-in-blank" id="fill-in-blank" />
                  <Label htmlFor="fill-in-blank" className="flex items-center cursor-pointer">
                    <AlignJustify className="h-5 w-5 mr-2 text-indigo-600" />
                    <p className="font-medium">Completar Espacios</p>
                  </Label>
                </div>
                
                <div
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all hover:border-indigo-300",
                    questionType === "matching"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200"
                  )}
                >
                  <RadioGroupItem value="matching" id="matching" />
                  <Label htmlFor="matching" className="flex items-center cursor-pointer">
                    <ArrowRightLeft className="h-5 w-5 mr-2 text-indigo-600" />
                    <p className="font-medium">Relacionar</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Rich Text Editor - hide for matching questions */}
            {questionType !== "matching" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Contenido</Label>
                <div className="border rounded-lg p-4 bg-white">
                  <Editor
                    value={editorContent}
                    onChange={(value) => {
                      setEditorContent(value);
                      if (questionType === "fill-in-blank") {
                        processContentWithBlanks(value);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Points Input */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Puntos</FormLabel>
                  <FormDescription>
                    Asigna puntos a esta pregunta (el total se normalizará a {totalQuizPoints} puntos)
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="max-w-[200px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Multiple Choice Options */}
            <AnimatePresence>
              {questionType === "multiple" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base font-semibold">Opciones</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Agregar Opción
                      </Button>
                    </div>

                    {/* Options List */}
                    <div className="space-y-4">
                      {options.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-x-2">
                            <div className="flex-grow">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`Opción ${index + 1}`}
                                className="border-slate-200"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>


                        </motion.div>
                      ))}
                    </div>

                    {/* Correct Answer Selection */}
                    <FormField
                      control={form.control}
                      name="correctOption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Respuesta Correcta
                          </FormLabel>
                          <Select
                            disabled={isLoading || options.length === 0}
                            onValueChange={(value) => setCorrectOption(value)}
                            value={correctOption}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select the correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {options.map((option, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {option || `Option ${index + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fill-in-the-blank Section */}
            <AnimatePresence>
              {questionType === "fill-in-blank" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base font-semibold">Espacios en Blanco</FormLabel>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">Instrucciones:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Escribe tu texto e incluye espacios en blanco usando el formato: <code className="bg-slate-100 px-1 py-0.5 rounded">[blank:respuesta]</code></li>
                          <li>Ejemplo: &ldquo;La capital de Francia es [blank:París]&rdquo;</li>
                          <li><strong>Importante:</strong> Asegúrate de que el texto [blank:respuesta] aparezca exactamente así, sin formatear.</li>
                          <li>Los estudiantes verán un campo de entrada donde está el espacio en blanco</li>
                          <li>La respuesta correcta es lo que escribas después de los dos puntos</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Espacios detectados:</p>
                        {blankAnswers.length === 0 ? (
                          <div className="text-sm text-muted-foreground italic">
                            No se han detectado espacios en blanco. Usa el formato [blank:respuesta] en tu contenido.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {blankAnswers.map((blank) => (
                              <div key={blank.id} className="flex items-center gap-2">
                                <Input
                                  value={blank.answer}
                                  onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                                  placeholder="Respuesta correcta"
                                  className="flex-grow"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBlankAnswer(blank.id)}
                                  className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload Section for Open-ended with File */}
            <AnimatePresence>
              {questionType === "open-with-file" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <FormLabel className="text-base font-semibold">Archivos de Ejemplo (Opcional)</FormLabel>
                    <FormDescription>
                      Sube archivos de ejemplo para mostrar a los estudiantes qué tipo de archivos se esperan
                    </FormDescription>
                    <S3FileUpload
                      type="mixed"
                      onUploadComplete={handleFileUpload}
                      onUploadError={(error) => console.error("Upload error:", error)}
                      acceptedFileTypes={[
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                        "video/mp4",
                        "video/webm",
                        "video/quicktime",
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      ]}
                      maxFileSize={50 * 1024 * 1024} // 50MB for examples
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Archivos subidos:</p>
                        <div className="grid gap-2">
                          {uploadedFiles.map((url, index) => (
                            <div
                              key={url}
                              className="flex items-center justify-between gap-2 p-2 rounded border bg-muted/50"
                            >
                              <span className="text-sm truncate">
                                {url.split("/").pop()}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileDelete(url)}
                                className="h-6 w-6 p-0 hover:bg-destructive/10"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Matching Question Section */}
            <AnimatePresence>
              {questionType === "matching" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">Instrucciones:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Cree elementos para relacionar en la columna izquierda</li>
                          <li>Cree opciones en la columna derecha</li>
                          <li>Seleccione la opción correcta para cada elemento usando los menús desplegables</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Scoring Policy */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Política de Puntuación</Label>
                      <Select
                        value={scoringPolicy}
                        onValueChange={(value) => setScoringPolicy(value as "ALL_OR_NOTHING" | "PARTIAL_PER_PAIR" | "PARTIAL_WITH_PENALTY")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione política de puntuación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL_OR_NOTHING">Todo o Nada (Todas correctas o 0 puntos)</SelectItem>
                          <SelectItem value="PARTIAL_PER_PAIR">Parcial por Par (Puntos por cada par correcto)</SelectItem>
                          <SelectItem value="PARTIAL_WITH_PENALTY">Parcial con Penalización (Resta por errores)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Configuration Options */}
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="allowReuse" 
                          checked={allowReuse}
                          onCheckedChange={(checked) => setAllowReuse(!!checked)}
                        />
                        <Label htmlFor="allowReuse">
                          Permitir reutilizar opciones (una opción puede corresponder a múltiples elementos)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="shuffleChoices" 
                          checked={shuffleChoices}
                          onCheckedChange={(checked) => setShuffleChoices(!!checked)}
                        />
                        <Label htmlFor="shuffleChoices">
                          Mezclar opciones al mostrar al estudiante
                        </Label>
                      </div>
                    </div>
                    
                    {/* Matching Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Prompts */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Elementos</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMatchingPrompt}
                            className="gap-2"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Agregar Elemento
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {matchingPrompts.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-md text-center">
                              Agregue elementos para relacionar
                            </div>
                          ) : (
                            matchingPrompts.map((prompt, index) => (
                              <motion.div
                                key={prompt.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-start gap-2"
                              >
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium w-6 text-center">{index + 1}.</span>
                                    <Input
                                      value={prompt.content}
                                      onChange={(e) => updateMatchingPrompt(prompt.id, e.target.value)}
                                      placeholder={`Elemento ${index + 1}`}
                                      className="flex-grow"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMatchingPrompt(prompt.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column - Choices */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Opciones</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMatchingChoice}
                            className="gap-2"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Agregar Opción
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {matchingChoices.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-md text-center">
                              Agregue opciones para relacionar
                            </div>
                          ) : (
                            matchingChoices.map((choice, index) => (
                              <motion.div
                                key={choice.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-start gap-2"
                              >
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium w-6 text-center">{String.fromCharCode(65 + index)}</span>
                                    <Input
                                      value={choice.content}
                                      onChange={(e) => updateMatchingChoice(choice.id, e.target.value)}
                                      placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                                      className="flex-grow"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMatchingChoice(choice.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Matching Pairs */}
                    {matchingPrompts.length > 0 && matchingChoices.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Relaciones Correctas</Label>
                        <div className="space-y-3">
                          {matchingPrompts.map((prompt, index) => (
                            <div key={prompt.id} className="flex items-center gap-3">
                              <div className="w-1/2 flex items-center gap-2">
                                <span className="text-sm font-medium w-6 text-center">{index + 1}.</span>
                                <div className="flex-grow p-2 bg-slate-50 rounded border text-sm">
                                  {prompt.content || `Elemento ${index + 1}`}
                                </div>
                              </div>
                              <div className="flex-shrink-0">→</div>
                              <div className="flex-grow">
                                <Select
                                  value={matchingPairs.find(p => p.promptId === prompt.id)?.choiceId || ""}
                                  onValueChange={(choiceId) => updateMatchingPair(prompt.id, choiceId)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione opción correcta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {matchingChoices.map((choice, choiceIndex) => (
                                      <SelectItem key={choice.id} value={choice.id}>
                                        {String.fromCharCode(65 + choiceIndex)} - {choice.content || `Opción ${String.fromCharCode(65 + choiceIndex)}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Buttons */}
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={onSubmit} 
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Guardando..." : "Guardar Pregunta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

QuestionForm.displayName = "QuestionForm";
