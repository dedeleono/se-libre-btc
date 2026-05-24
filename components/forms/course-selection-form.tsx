import { useState } from "react";
import { useStepper } from "@/components/stepper";

const courses = [
  { id: 1, name: "Introduction to Programming" },
  { id: 2, name: "Web Development Fundamentals" },
  { id: 3, name: "Data Science Basics" },
];

export default function CourseSelectionForm({ onSubmit }: { onSubmit: (data: { selectedCourse: string }) => void }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const { nextStep, prevStep } = useStepper();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ selectedCourse });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="course" className="block mb-2">
          Select a Course
        </label>
        <select
          id="course"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </form>
  );
}
