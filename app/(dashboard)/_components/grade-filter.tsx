import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
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
  searchPlaceholder
}: GradeFilterProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder ?? t.dashboard.searchByName}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select onValueChange={onFilterChange} defaultValue="all">
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder={t.common.filterBy} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.common.all}</SelectItem>
          <SelectItem value="students">{t.dashboard.students}</SelectItem>
          <SelectItem value="courses">{t.dashboard.courses}</SelectItem>
          <SelectItem value="learning-paths">{t.dashboard.learningPaths}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
