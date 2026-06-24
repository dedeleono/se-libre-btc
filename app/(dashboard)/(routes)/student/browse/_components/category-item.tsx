"use client";

import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import qs from "query-string";

interface CategoryItemProps {
  label: string;
  icon: IconType;
  value: string;
}

export const CategoryItem = ({
  label,
  icon: Icon,
  value,
}: CategoryItemProps) => {


    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategoryId = searchParams.get("categoryId");
    const currentTitle = searchParams.get("title");

    const isSelected = currentCategoryId === value;

    const onClick = () => {
        const url = qs.stringifyUrl({
            url: pathname,
            query: {
                title: currentTitle,
                categoryId: isSelected ? null : value,
            }
        }, { skipNull: true, skipEmptyString: true });

        router.push(url);
    }

  return (
    <button
      onClick={onClick}
      className={cn(
        "py-[10px] px-3 text-sm border border-border rounded-full flex items-center gap-x-1 hover:border-[var(--naranja-500)] transition-[background-color,color,border-color] active:scale-[0.96]",
        isSelected && "border-[var(--naranja-500)] bg-[hsl(var(--primary)/0.1)] text-[var(--terracota-700)]"
      )}
      type="button"
    >
      {Icon && <Icon size={24} />}
      <div className="truncate">{label}</div>
    </button>
  );
};
