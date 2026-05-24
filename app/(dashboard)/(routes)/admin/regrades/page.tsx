import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

export default async function RegradesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return redirect("/");
  }

  // Fetch all submissions with pending regrades
  const pendingRegrades = await prisma.submission.findMany({
    where: {
      regradePending: true
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          chapter: {
            select: {
              module: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      gradeHistory: {
        where: {
          approved: false
        },
        orderBy: {
          gradedAt: 'desc'
        },
        take: 1,
        include: {
          teacher: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Grade Change Approvals</h1>
      <DataTable columns={columns} data={pendingRegrades} />
    </div>
  );
} 