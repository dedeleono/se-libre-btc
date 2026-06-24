"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import qs from "query-string";  
import { useLocale } from "@/lib/i18n";

export const SearchInput = () => {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value);

  const currentCategoryId = searchParams.get("categoryId");

  useEffect(() => {
    const url = qs.stringifyUrl({
        url: pathname,
        query: {
            categoryId: currentCategoryId,
            title: debouncedValue,
        }
    }, { skipNull: true, skipEmptyString: true });

    router.push(url);
    
  }, [debouncedValue, currentCategoryId, pathname, router]);

  return (
    <div className="relative">
      <Search className="absolute h-4 w-4 top-3 left-3 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="text"
        className="w-full md:w-[300px] pl-12 border-border focus:ring-ring"
        placeholder={t.nav.browseCourses}
      />
    </div>
  );
};
