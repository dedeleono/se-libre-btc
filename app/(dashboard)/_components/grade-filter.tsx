import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface GradeFilterProps {
  onSearchChange: (value: string) => void;
  onFilterChange: (type: string) => void;
  searchPlaceholder?: string;
}

export function GradeFilter({
  onSearchChange,
  onFilterChange,
  searchPlaceholder = "Search by name..."
}: GradeFilterProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select onValueChange={onFilterChange} defaultValue="all">
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="students">Students</SelectItem>
          <SelectItem value="courses">Courses</SelectItem>
          <SelectItem value="levels">Levels</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 