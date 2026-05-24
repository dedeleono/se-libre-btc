"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Mail, Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailSelectorProps {
  levels: { 
    id: string; 
    name: string; 
    position: number;
    students: { email: string }[] 
  }[];
  onEmailsChange: (emails: string[]) => void;
}

export function EmailSelector({ levels, onEmailsChange }: EmailSelectorProps) {
  const [selectedEmails, setSelectedEmails] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [openLevels, setOpenLevels] = React.useState(false);

  // Sort levels by position
  const sortedLevels = React.useMemo(() => {
    return [...levels].sort((a, b) => a.position - b.position);
  }, [levels]);

  // Flatten all students from all levels into a single array
  const allStudents = React.useMemo(() => {
    return levels.flatMap(level => 
      level.students.map(student => ({
        email: student.email,
      }))
    );
  }, [levels]);

  // Filter students based on email
  const filteredStudents = React.useMemo(() => {
    const search = inputValue.toLowerCase();
    if (!search) return [];
    return allStudents.filter(student => 
      student.email.toLowerCase().includes(search)
    );
  }, [allStudents, inputValue]);

  const handleSelect = (email: string) => {
    if (!selectedEmails.includes(email)) {
      const newEmails = [...selectedEmails, email];
      setSelectedEmails(newEmails);
      onEmailsChange(newEmails);
    }
    setInputValue("");
  };

  const handleLevelToggle = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    let newSelectedLevels: string[];
    let newEmails: string[];

    if (selectedLevels.includes(levelId)) {
      // Remove level and its students
      newSelectedLevels = selectedLevels.filter(id => id !== levelId);
      const levelEmails = level.students.map(s => s.email);
      newEmails = selectedEmails.filter(email => !levelEmails.includes(email));
    } else {
      // Add level and its students
      newSelectedLevels = [...selectedLevels, levelId];
      const levelEmails = level.students.map(s => s.email);
      newEmails = Array.from(new Set([...selectedEmails, ...levelEmails]));
    }
    
    setSelectedLevels(newSelectedLevels);
    setSelectedEmails(newEmails);
    onEmailsChange(newEmails);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const newEmails = selectedEmails.filter(email => email !== emailToRemove);
    setSelectedEmails(newEmails);
    onEmailsChange(newEmails);
  };

  return (
    <div className="space-y-6">
      {/* Selected Emails Display - Moved to top for better visibility */}
      <div className="relative">
        <div
          className="flex flex-wrap gap-2 min-h-[2.75rem] p-3 rounded-xl border 
          dark:border-white/[0.08] bg-white dark:bg-black/40 shadow-sm 
          dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          {selectedEmails.length === 0 ? (
            <div className="flex items-center text-sm text-muted-foreground/60 dark:text-white/50">
              <Users className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Seleccione los destinatarios del email</span>
            </div>
          ) : (
            selectedEmails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 sm:text-sm text-xs 
                  bg-primary/10 text-primary dark:bg-primary/20 dark:text-white 
                  hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              >
                <span className="max-w-[200px] truncate">{email}</span>
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-primary-foreground 
                    dark:hover:text-white transition-colors"
                  onClick={() => handleRemoveEmail(email)}
                />
              </Badge>
            ))
          )}
        </div>
        {selectedEmails.length > 0 && (
          <div
            className="absolute -top-3 left-3 px-2 bg-background dark:bg-card 
            text-xs font-medium text-muted-foreground dark:text-white/50"
          >
            {selectedEmails.length} destinatario
            {selectedEmails.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
        {/* Level Selection Command */}
        <Command className="rounded-xl border border-primary/20">
          <div className="flex items-center px-3 border-b">
            <Users className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <div className="flex-1 h-10 sm:h-12 px-2 text-xs sm:text-sm flex items-center text-muted-foreground">
              {selectedLevels.length === 0
                ? "Seleccionar grados"
                : `${selectedLevels.length} grado(s) seleccionado(s)`}
            </div>
          </div>
          <CommandList className="h-[150px] sm:h-[200px] scrollbar-custom">
            <CommandGroup>
              <div className="p-1 space-y-1">
                {sortedLevels.map((level) => (
                  <CommandItem
                    key={level.id}
                    onSelect={() => handleLevelToggle(level.id)}
                    className={cn(
                      "flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg cursor-pointer hover:bg-primary/5 transition-all",
                      "data-[selected]:bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                        selectedLevels.includes(level.id)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary/20"
                      )}
                    >
                      {selectedLevels.includes(level.id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span className="flex-1 text-xs sm:text-sm">{level.name}</span>
                    <Badge variant="secondary" className="text-xs">{level.students.length}</Badge>
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>

        {/* Individual Student Selection Command */}
        <Command className="rounded-xl border border-primary/20 overflow-hidden">
          <CommandInput
            placeholder="Buscar estudiante..."
            value={inputValue}
            onValueChange={setInputValue}
            className="flex-1 h-10 sm:h-12 px-2 border-0 focus:ring-0 focus-visible:ring-0 text-xs sm:text-sm w-full"
          />

          <CommandList>
            <CommandEmpty className="py-4 sm:py-6">
              {inputValue.includes("@") ? (
                <CommandItem
                  onSelect={() => handleSelect(inputValue.trim())}
                  className="mx-2 rounded-lg flex items-center gap-2 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-medium text-xs sm:text-sm">Agregar:</span> {inputValue}
                </CommandItem>
              ) : (
                <div className="text-center text-xs sm:text-sm text-muted-foreground mx-2">
                  No se encontraron resultados
                </div>
              )}
            </CommandEmpty>
            {filteredStudents.length > 0 && (
              <CommandGroup
                heading={
                  <div className="text-xs font-medium text-muted-foreground px-2">
                    Estudiantes encontrados
                  </div>
                }
              >
                <ScrollArea className="h-[150px] sm:h-[200px]">
                  {filteredStudents.map((student) => (
                    <CommandItem
                      key={student.email}
                      onSelect={() => handleSelect(student.email)}
                      onClick={() => handleSelect(student.email)}
                      className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 mx-2 my-1 rounded-lg cursor-pointer
                        hover:bg-primary/10 dark:hover:bg-primary/20
                        data-[selected]:bg-primary/15 dark:data-[selected]:bg-primary/25
                        transition-all duration-200"
                    >
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground dark:text-white/50" />
                      <span className="flex-1 text-xs sm:text-sm truncate dark:text-white/70">{student.email}</span>
                      <Check className="h-4 w-4 text-primary dark:text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  );
} 