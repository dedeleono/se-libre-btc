"use client";

import type * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGE_RANGES } from "@/lib/constants/demographics";

type AgeRangeSelectProps = Pick<
  React.ComponentProps<"button">,
  "id" | "aria-describedby" | "aria-invalid" | "onBlur"
> & {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** React 19 ref-as-prop: lands on the focusable trigger so `form.setFocus` can reach it. */
  ref?: React.Ref<HTMLButtonElement>;
};

export function AgeRangeSelect({
  value,
  onChange,
  placeholder,
  disabled,
  ref,
  ...triggerProps
}: AgeRangeSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger ref={ref} className="w-full" {...triggerProps}>
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
