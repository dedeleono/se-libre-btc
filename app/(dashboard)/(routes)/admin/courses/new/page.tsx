import { getServerMessages } from "@/lib/i18n-server";

import CourseFormCreate from "./_components/create-form";

export default async function NewCoursePage() {
  const t = await getServerMessages();

  return (
    <div className=" flex flex-col mx-6 md:justify-center min-h-screen h-full p-6">
      <h1 className="text-2xl text-balance">{t.admin.newCourseTitle}</h1>
      <p className="text-sm text-muted-foreground">{t.admin.newCourseHelp}</p>
      <CourseFormCreate />
    </div>
  );
}
