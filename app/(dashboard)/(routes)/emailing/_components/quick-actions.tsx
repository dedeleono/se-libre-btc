"use client";

import { Button } from "@/components/ui/button";
import { getEmailTemplate, TemplateType } from "@/lib/email-templates";

interface QuickActionsProps {
  onTemplateSelect: (subject: string, content: string) => void;
}

export function QuickActions({ onTemplateSelect }: QuickActionsProps) {
  const handleTemplateSelect = async (template: TemplateType) => {
    try {
      const { html, subject } = await getEmailTemplate(template);
      onTemplateSelect(subject, html);
    } catch (error) {
      console.error("Error loading template:", error);
    }
  };

  return (
    <div className="hidden md:flex gap-4">
      <Button 
        variant="outline" 
        className="bg-primary/10 hover:bg-primary/20" 
        onClick={() => handleTemplateSelect("welcome")}
      >
        🎉 Bienvenida
      </Button>
      <Button 
        variant="outline"
        className="bg-primary/10 hover:bg-primary/20"
        onClick={() => handleTemplateSelect("reminder")}
      >
        📚 Recordatorio
      </Button>
      <Button 
        variant="outline"
        className="bg-primary/10 hover:bg-primary/20"
        onClick={() => handleTemplateSelect("followup")}
      >
        🎯 Seguimiento
      </Button>
    </div>
  );
} 