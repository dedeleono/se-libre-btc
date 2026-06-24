import CourseFormCreate from "./_components/create-form";

export default function NewCoursePage() {
  return (
    <div className=" flex flex-col mx-6 md:justify-center min-h-screen h-full p-6">
      <h1 className="text-2xl text-balance">Nombre del Curso</h1>
      <p className="text-sm text-slate-600">
        Qué nombre te gustaría darle a tu curso?
      </p>
      <CourseFormCreate />
    </div>
  );
}
