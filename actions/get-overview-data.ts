import { prisma } from "@/lib/db";
import { OVERVIEW_TIME_ZONE, bucketByMonth, overviewWindow } from "@/lib/overview-buckets";

export type OverviewData = {
  name: string;
  revenue: number;
  students: number;
  courses: number;
};

export async function getOverviewData(): Promise<OverviewData[]> {
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

    return monthStarts.map((monthStart, i) => ({
      name: monthStart.toLocaleString("default", { month: "short", timeZone: OVERVIEW_TIME_ZONE }),
      revenue: revenueCents[i] / 100,
      students: newStudents[i],
      courses: newCourses[i],
    }));
  } catch (error) {
    console.error("[GET_OVERVIEW_DATA]", error);
    return [];
  }
}
