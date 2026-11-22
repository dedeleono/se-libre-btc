"use client";

import { addDays, format, type Locale } from "date-fns";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

type CalendarDateRangePickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  formatLabel?: (date: Date) => string;
  triggerClassName?: string;
  triggerId?: string;
  "aria-labelledby"?: string;
  calendarLocale?: Locale;
  numberOfMonths?: number;
};

const defaultFormat = (date: Date) => format(date, "LLL dd, y");

export function CalendarDateRangePicker({
  className,
  value,
  onChange,
  placeholder,
  formatLabel = defaultFormat,
  triggerClassName,
  triggerId = "date",
  "aria-labelledby": ariaLabelledBy,
  calendarLocale,
  numberOfMonths = 2,
}: CalendarDateRangePickerProps) {
  const { t } = useLocale();
  const [internal, setInternal] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -20),
    to: new Date(),
  });
  const date = value !== undefined || onChange ? value : internal;
  const handleSelect = (range: DateRange | undefined) => {
    if (onChange) onChange(range);
    else setInternal(range);
  };
  const emptyLabel = placeholder ?? t.common.pickDate;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant={"outline"}
            aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${triggerId}` : undefined}
            aria-label={!ariaLabelledBy && !date?.from ? emptyLabel : undefined}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal hover:bg-accent/20 dark:hover:bg-accent/10",
              !date && "text-muted-foreground",
              triggerClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatLabel(date.from)} -{" "}
                  {formatLabel(date.to)}
                </>
              ) : (
                formatLabel(date.from)
              )
            ) : (
              <span>{emptyLabel}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            locale={calendarLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
