"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Categories } from "./categories";
import { SearchInput } from "@/components/search-input";
import { CoursesList } from "./courses-list";

interface BrowsePageClientProps {
  initialCategories: any[];
  initialCourses: any[];
  initialSearchParams: { title: string; categoryId: string };
}

const BrowsePageClient: React.FC<BrowsePageClientProps> = ({
  initialCategories,
  initialCourses,
  initialSearchParams,
}) => {
  const [categories] = useState(initialCategories);
  const [courses, setCourses] = useState(initialCourses);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Here you can add logic to fetch courses based on searchParams
    // For now, we'll just use the initial courses
  }, [searchParams]);

  return (
    <div className="h-full p-6">
      <div className="pt-3 pb-6 md:hidden md:mb-0 block">
        <SearchInput />
      </div>
      <div className="mb-6">
        <Categories items={categories} />
      </div>
      <CoursesList items={courses} />
    </div>
  );
};

export default BrowsePageClient;
