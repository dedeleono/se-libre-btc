"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGE_RANGES } from "@/lib/constants/demographics";

interface AgeRangeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgeRangeSelect({ value, onChange, placeholder }: AgeRangeSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {AGE_RANGES.map((range) => (
          <SelectItem key={range} value={range}>
            {range}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
