"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Student {
  id: string;
  name?: string | null;
  email: string;
}

export function StudentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value);
  const [suggestions, setSuggestions] = useState<Student[]>([]);

  useEffect(() => {
    if (!debouncedValue) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/search/students?query=${debouncedValue}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([name, value]) => {
        newParams.set(name, value);
      });
      return newParams.toString();
    },
    [searchParams]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              router.push(`${pathname}?${createQueryString({
                search: e.target.value,
              })}`);
            }}
            className="pl-9"
          />
        </div>
      </PopoverTrigger>
      {suggestions.length > 0 && (
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {suggestions.map((student) => (
                  <CommandItem
                    key={student.id}
                    onSelect={() => {
                      setValue(student.name || student.email);
                      router.push(
                        `${pathname}?${createQueryString({
                          search: student.name || student.email,
                          studentId: student.id,
                        })}`
                      );
                      setOpen(false);
                    }}
                  >
                    <span>{student.name || student.email}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
} 