import { useState, useEffect } from "react";
import { useStepper } from "@/components/stepper";
import axios from "axios";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, Users, ArrowLeft } from "lucide-react";
import { LearningPath } from "@prisma/client";
import { ProductSelection } from "@/types/checkout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface LearningPathWithCourses extends LearningPath {
  courses: { id: string }[];
  enrollments: { id: string }[];
}

interface LearningPathSelectionFormProps {
  initialData: ProductSelection;
  onSubmit: (data: ProductSelection) => void;
  onBack: () => void;
}

export default function LearningPathSelectionForm({
  initialData,
  onSubmit,
  onBack
}: LearningPathSelectionFormProps) {
  const { t } = useLocale();
  const [learningPaths, setLearningPaths] = useState<LearningPathWithCourses[]>([]);
  const [selectedLearningPath, setSelectedLearningPath] = useState(initialData.productId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { nextStep, prevStep } = useStepper();

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/learning-paths");
        setLearningPaths(response.data);
      } catch (error) {
        console.error("Error fetching learning paths:", error);
        setError(t.forms.loadLearningPathsError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPaths();
  }, [t.forms.loadLearningPathsError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const learningPath = learningPaths.find((path) => path.id === selectedLearningPath);
    if (learningPath) {
      onSubmit({
        productId: learningPath.id,
        productName: learningPath.title,
        productType: "LEARNING_PATH",
        price: Number(learningPath.price ?? 0),
      });
      nextStep();
    }
  };

  const isFromInvitation = !!initialData.productId;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground dark:text-white/90">{t.forms.chooseLearningPath}</h2>
            <p className="text-sm text-muted-foreground dark:text-white/70">
              {isFromInvitation 
                ? t.forms.preselectedLearningPath
                : t.forms.selectLearningPath}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-destructive">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <RadioGroup
                value={selectedLearningPath}
                onValueChange={setSelectedLearningPath}
                className="grid gap-4"
                disabled={isFromInvitation}
              >
                {learningPaths.map((learningPath) => (
                  <motion.div
                    key={learningPath.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={cn(
                        "relative flex items-center p-4 rounded-lg border transition-all duration-200",
                        "hover:shadow-md cursor-pointer",
                        selectedLearningPath === learningPath.id
                          ? "border-primary/50 bg-[hsl(var(--primary)/0.05)] dark:bg-[hsl(var(--primary)/0.1)] shadow-sm ring-1 ring-[hsl(var(--primary)/0.2)]"
                          : "border-border dark:border-white/10 hover:border-[hsl(var(--primary)/0.2)] dark:hover:border-primary/30",
                        isFromInvitation && selectedLearningPath !== learningPath.id && "opacity-50"
                      )}
                    >
                      <div className="relative flex h-5 w-5 items-center">
                        <input
                          type="radio"
                          value={learningPath.id}
                          checked={selectedLearningPath === learningPath.id}
                          onChange={() => setSelectedLearningPath(learningPath.id)}
                          disabled={isFromInvitation}
                          className={cn(
                            "peer h-5 w-5 cursor-pointer rounded-full border",
                            "text-primary focus:ring-ring focus:ring-offset-0",
                            "transition-all duration-200",
                            "before:content-[''] before:block before:h-5 before:w-5",
                            "before:rounded-full before:transition-transform",
                            "checked:border-primary checked:before:bg-primary",
                            "relative",
                            selectedLearningPath === learningPath.id && "border-primary",
                            isFromInvitation && "cursor-not-allowed"
                          )}
                        />
                        <div className={cn(
                          "pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5",
                          "rounded-full bg-white -translate-x-1/2 -translate-y-1/2",
                          "transition-opacity duration-200",
                          selectedLearningPath === learningPath.id ? "opacity-100" : "opacity-0"
                        )} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground dark:text-white/90">{learningPath.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-white/70">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4" />
                                {t.public.coursesCount(learningPath.courses.length)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {t.forms.learners(learningPath.enrollments.length)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-primary font-semibold dark:text-secondary">
                            Q.{" "}
                            {Number(learningPath.price ?? 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </ScrollArea>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.payments.goBack}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedLearningPath}
              className="bg-primary hover:bg-[hsl(var(--primary)/0.9)]"
            >
              {t.common.continue}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
