import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import { File, LayoutDashboard, ListChecks } from "lucide-react";
import { Banner } from "@/components/banner";
import { AssignmentForm } from "./_components/assignment-form";
// import { auth } from "@/lib/auth";

interface AssignmentIdPageProps {
  params: {
    assignmentId: string;
  };
}

const AssignmentIdPage = async ({ params }: AssignmentIdPageProps) => {
  // const session = await auth()

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: params.assignmentId,
    },
    include: {
      questions: {
        include: {
          options: true, // Include the options for each question
        },
        orderBy: {
          position: "asc",
        },
      },
      
    },
  });

  if (!assignment) {
    return redirect("/");
  }

  // const options = categories.map((category) => ({
  //   label: category.name,
  //   value: category.id,
  // }));

  // const requiredFields = [
  //   course.title,
  //   course.description,
  //   course.imageUrl,
  //   course.courseCategory,
  //   course.modules,
  // ];

  // const totalFields = requiredFields.length;
  // const completedFields = requiredFields.filter(Boolean).length;

  // const completionText = `${completedFields} / ${totalFields}`;

  // const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!assignment && (
        <Banner
          variant="warning"
          label="Esta tarea no está publicada. No será visible para los estudiantes."
        />
      )}
      <div>
        <AssignmentForm
          initialData={assignment}
          chapterId={assignment.chapterId}
          defaultIsQuiz={assignment.isQuiz}
        />
      </div>
    </>
  );
};

export default AssignmentIdPage;
