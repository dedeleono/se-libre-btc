import { prisma } from "@/lib/db";
import { createCachedFunction } from "@/lib/cache";

// Helper function to get the last 12 months as strings
function getLast12Months() {
  const months = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    months.push(date.toLocaleString("default", { month: "short" }));
  }

  return months;
}

export type OverviewData = {
  name: string;
  revenue: number;
  students: number;
  courses: number;
};

// Cache the overview data for 5 minutes
export const getOverviewData = createCachedFunction(async () => {
  "use server";
  
  const last12Months = getLast12Months();
  const currentDate = new Date();
  const startDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 11,
    1
  );

  try {
    const monthlyData = await Promise.all(
      last12Months.map(async (month, index) => {
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - (11 - index),
          1
        );
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - (11 - index) + 1,
          0
        );

        // Get revenue for the month
        const revenue = await prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            paymentDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        // Get new students for the month
        const newStudents = await prisma.user.count({
          where: {
            role: "STUDENT",
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        // Get new courses for the month
        const newCourses = await prisma.course.count({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        return {
          name: month,
          revenue: revenue._sum.amount || 0,
          students: newStudents,
          courses: newCourses,
        };
      })
    );

    return monthlyData;
  } catch (error) {
    console.error("[GET_OVERVIEW_DATA]", error);
    return [];
  }
}, { revalidate: 300 }); // Cache for 5 minutes 