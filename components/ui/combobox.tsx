"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboBoxProps {
  options: { label: string; value: string }[];
  value?: string | string[]; // Support both single and multiple values
  onChange: (value: string | string[]) => void;
  multiple?: boolean; // Indicate if multiple selections are allowed
}

const Combobox = ({
  options,
  value,
  onChange,
  multiple = false, // Default to single selection
}: ComboBoxProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const selectedValues = Array.isArray(value) ? [...value] : [];
      if (selectedValues.includes(selectedValue)) {
        onChange(selectedValues.filter((v) => v !== selectedValue));
      } else {
        onChange([...selectedValues, selectedValue]);
      }
    } else {
      onChange(selectedValue === value ? "" : selectedValue);
    }
    setOpen(false);
  };

  const getLabel = () => {
    if (multiple && Array.isArray(value)) {
      return (
        value
          .map(
            (v) =>
              options.find((option) => option.value.toString() === v)?.label
          )
          .join(", ") || "Selecciona una opción"
      );
    } else {
      return (
        options.find((option) => option.value.toString() === value)?.label ||
        "Selecciona una opción"
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {getLabel()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search option..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value.toString()}
                  onSelect={() => handleSelect(option.value.toString())}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      Array.isArray(value) &&
                        value.includes(option.value.toString())
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
