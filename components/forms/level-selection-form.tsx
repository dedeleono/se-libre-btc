import { useState, useEffect } from "react";
import { useStepper } from "@/components/stepper";
import axios from "axios";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, Users, DollarSign, ArrowLeft } from "lucide-react";
import { Level } from "@prisma/client";
import { LevelSelection } from "@/types/checkout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LevelWithCourses extends Level {
  levelCourses: {
    id: string;
    levelId: string;
    courseId: string;
    course: {
      title: string;
      imageUrl: string | null;
    };
  }[];
  students: {
    id: string;
    name: string | null;
  }[];
  price: number;
  inscriptionPrice: number | null;
  inscriptionPaid: boolean;
}

interface LevelSelectionFormProps {
  initialData: LevelSelection;
  onSubmit: (data: LevelSelection) => void;
  onBack: () => void;
}

export default function LevelSelectionForm({
  initialData,
  onSubmit,
  onBack
}: LevelSelectionFormProps) {
  const [levels, setLevels] = useState<LevelWithCourses[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(initialData.levelId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { nextStep, prevStep } = useStepper();

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/levels");
        setLevels(response.data);
      } catch (error) {
        console.error("Error fetching levels:", error);
        setError("Failed to load levels");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const level = levels.find((l) => l.id === selectedLevel);
    if (level) {
      onSubmit({
        levelId: level.id,
        levelName: level.name,
        price: level.price,
        inscriptionPrice: level.inscriptionPrice,
        inscriptionPaid: level.inscriptionPaid
      });
      nextStep();
    }
  };

  // If we have an initial level ID, we're coming from a pending invitation
  const isFromInvitation = !!initialData.levelId;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white/90">Elige tu grado</h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isFromInvitation 
                ? "Tu grado ha sido pre-seleccionado por el administrador"
                : "Selecciona el grado al que deseas inscribirte"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <RadioGroup
                value={selectedLevel}
                onValueChange={setSelectedLevel}
                className="grid gap-4"
                disabled={isFromInvitation}
              >
                {levels.map((level) => (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={cn(
                        "relative flex items-center p-4 rounded-lg border transition-all duration-200",
                        "hover:shadow-md cursor-pointer",
                        selectedLevel === level.id
                          ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm ring-1 ring-orange-500/20"
                          : "border-gray-200 dark:border-white/10 hover:border-orange-200 dark:hover:border-orange-400/30",
                        isFromInvitation && selectedLevel !== level.id && "opacity-50"
                      )}
                    >
                      <div className="relative flex h-5 w-5 items-center">
                        <input
                          type="radio"
                          value={level.id}
                          checked={selectedLevel === level.id}
                          onChange={() => setSelectedLevel(level.id)}
                          disabled={isFromInvitation}
                          className={cn(
                            "peer h-5 w-5 cursor-pointer rounded-full border",
                            "text-orange-500 focus:ring-orange-500 focus:ring-offset-0",
                            "transition-all duration-200",
                            "before:content-[''] before:block before:h-5 before:w-5",
                            "before:rounded-full before:transition-transform",
                            "checked:border-orange-500 checked:before:bg-orange-500",
                            "relative",
                            selectedLevel === level.id && "border-orange-500",
                            isFromInvitation && "cursor-not-allowed"
                          )}
                        />
                        <div className={cn(
                          "pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5",
                          "rounded-full bg-white -translate-x-1/2 -translate-y-1/2",
                          "transition-opacity duration-200",
                          selectedLevel === level.id ? "opacity-100" : "opacity-0"
                        )} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900 dark:text-white/90">{level.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-white/70">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4" />
                                {level.levelCourses.length} cursos
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {level.students.length} estudiantes
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-primary font-semibold dark:text-secondary">
                            Q.{" "}
                            {level.price.toFixed(2)}
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
              className="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedLevel}
              className="bg-sky-900 hover:bg-primary/90"
            >
              Continuar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
