import { FC } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data import (or fetch in getStaticProps)
import calendarData from "./_data/calendars.json";

interface Entry {
  no: number;
  actividad: string;
  fecha: string;
  hora: string;
  grado: string;
}

interface CalendarData {
  [program: string]: Entry[];
}

const CalendarPage: FC = () => {
  const data: CalendarData = calendarData;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="p-2 md:p-3 rounded-xl bg-primary/10 dark:bg-primary/20 border">
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-balance">
              Calendario de Actividades
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              Gestiona y visualiza todas tus actividades programadas
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <Accordion type="multiple" className="space-y-4">
        {Object.entries(data).map(([program, entries]) => (
          <AccordionItem
            key={program}
            value={program}
            className="border rounded-lg bg-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex justify-between items-center space-x-3 w-full">
                <span className="md:text-lg text-sm font-medium text-start">{program}</span>
                <span className="md:text-sm text-xs text-muted-foreground">
                  {entries.length} Talleres
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto p-4 sm:p-6 bg-secondary dark:bg-foreground rounded-lg">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => (
                    <Card
                      key={`${program}-${entry.no}-${entry.grado}`}
                      className="min-w-0 shadow-sm hover:shadow-md transition-[box-shadow,border-color] duration-200 border-border/40 hover:border-border/60"
                    >
                      <CardHeader className="pb-2 space-y-1">
                        <CardTitle className="flex justify-between items-center text-base">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold tabular-nums">
                              #{entry.no}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{entry.grado}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">{entry.fecha}</span>
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            </div>
                            <p className="text-sm leading-relaxed text-pretty">
                              {entry.actividad}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span className="tabular-nums">{entry.hora}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default CalendarPage;
