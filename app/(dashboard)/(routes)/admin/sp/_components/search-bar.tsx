"use client";

import { Input } from "@/components/ui/input";
import { useCallback, useState } from "react";
// import debounce from "lodash/debounce";

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Buscar...",
}: SearchBarProps) {
  const [value, setValue] = useState("");

//   const debouncedSearch = useCallback(
//     debounce((searchValue: string) => {
//       onSearch(searchValue);
//     }, 300),
//     [onSearch]
//   );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // debouncedSearch(newValue);
  };

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={handleSearch}
      className="max-w-sm"
    />
  );
}
