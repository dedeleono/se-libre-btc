import { prisma } from "@/lib/db";

export async function getAnalytics(): Promise<Analytics> {
    try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const [totalRevenue, currentMonthRevenue, totalSales, totalCourses, totalLearningPaths, totalStudents, lastMonthSales, lastMonthCourses, lastMonthLearningPaths, lastMonthStudents] = await Promise.all([
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED", paymentDate: { gte: lastMonth } } }),
            prisma.payment.count({ where: { status: "COMPLETED" } }),
            prisma.course.count(),
            prisma.learningPath.count(),
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.payment.count({ where: { status: "COMPLETED", paymentDate: { gte: lastMonth } } }),
            prisma.course.count({ where: { createdAt: { gte: lastMonth } } }),
            prisma.learningPath.count({ where: { createdAt: { gte: lastMonth } } }),
            prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: lastMonth } } }),
        ]);

        return {
            totalRevenue: Number(totalRevenue._sum.amount ?? 0),
            totalSales,
            totalCourses,
            totalLearningPaths,
            totalStudents,
            monthlyChange: {
                revenue: Number(currentMonthRevenue._sum.amount ?? 0),
                sales: lastMonthSales,
                courses: lastMonthCourses,
                learningPaths: lastMonthLearningPaths,
                students: lastMonthStudents,
            },
        };
    } catch (error) {
        console.error("[GET_ANALYTICS]", error);
        return {
            totalRevenue: 0,
            totalSales: 0,
            totalCourses: 0,
            totalLearningPaths: 0,
            totalStudents: 0,
            monthlyChange: {
                revenue: 0,
                sales: 0,
                courses: 0,
                learningPaths: 0,
                students: 0,
            },
        };
    }
}

export type Analytics = {
    totalRevenue: number;
    totalSales: number;
    totalCourses: number;
    totalLearningPaths: number;
    totalStudents: number;
    monthlyChange: {
        revenue: number;
        sales: number;
        courses: number;
        learningPaths: number;
        students: number;
    };
};