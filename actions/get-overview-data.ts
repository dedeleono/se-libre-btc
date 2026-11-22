import { prisma } from "@/lib/db";
import { bucketByMonth, overviewWindow } from "@/lib/overview-buckets";
import { toOverviewRows, type OverviewRow } from "@/lib/overview-chart";

export async function getOverviewData(): Promise<OverviewRow[]> {
  const now = new Date();
  const { start, end, monthStarts } = overviewWindow(now);

  try {
    const [payments, students, courses] = await Promise.all([
      prisma.payment.findMany({
        where: { status: "COMPLETED", paymentDate: { gte: start, lt: end } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT", createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
      prisma.course.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }),
    ]);

    const revenueCents = bucketByMonth(
      payments.map((payment) => ({
        date: payment.paymentDate,
        value: Math.round(Number(payment.amount) * 100),
      })),
      now,
    );
    const newStudents = bucketByMonth(students.map((user) => ({ date: user.createdAt, value: 1 })), now);
    const newCourses = bucketByMonth(courses.map((course) => ({ date: course.createdAt, value: 1 })), now);

    return toOverviewRows({ monthStarts, revenueCents, students: newStudents, courses: newCourses });
  } catch (error) {
    console.error("[GET_OVERVIEW_DATA]", error);
    return [];
  }
}
