import { prisma } from "@/lib/db";

export async function getAnalytics() {
    try {
        // Get total revenue from payments using Prisma query builder
        const totalRevenue = await prisma.payment.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                status: "COMPLETED",
            },
        });

        // Get monthly change data
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const currentMonthRevenue = await prisma.payment.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                status: "COMPLETED",
                paymentDate: {
                    gte: lastMonth,
                },
            },
        });

        // Get total counts
        const totalSales = await prisma.payment.count({
            where: {
                status: "COMPLETED",
            },
        });

        const totalCourses = await prisma.course.count();

        const totalStudents = await prisma.user.count({
            where: {
                role: "STUDENT",
            },
        });

        const totalTeachers = await prisma.user.count({
            where: {
                role: "TEACHER",
            },
        });

        // Get monthly changes
        const lastMonthSales = await prisma.payment.count({
            where: {
                status: "COMPLETED",
                paymentDate: {
                    gte: lastMonth,
                },
            },
        });

        const lastMonthTeachers = await prisma.user.count({
            where: {
                role: "TEACHER",
                createdAt: {
                    gte: lastMonth,
                },
            },
        });

        const lastMonthCourses = await prisma.course.count({
            where: {
                createdAt: {
                    gte: lastMonth,
                },
            },
        });

        const lastMonthStudents = await prisma.user.count({
            where: {
                role: "STUDENT",
                createdAt: {
                    gte: lastMonth,
                },
            },
        });

        return {
            totalRevenue: totalRevenue._sum.amount ?? 0,
            totalSales,
            totalCourses,
            totalTeachers,
            totalStudents,
            monthlyChange: {
                revenue: currentMonthRevenue._sum.amount ?? 0,
                sales: lastMonthSales,
                courses: lastMonthCourses,
                teachers: lastMonthTeachers,
                students: lastMonthStudents,
            },
        };
    } catch (error) {
        console.error("[GET_ANALYTICS]", error);
        return {
            totalRevenue: 0,
            totalSales: 0,
            totalCourses: 0,
            totalTeachers: 0,
            totalStudents: 0,
            monthlyChange: {
                revenue: 0,
                sales: 0,
                courses: 0,
                teachers: 0,
                students: 0,
            },
        };
    }
}

export type Analytics = {
    totalRevenue: number;
    totalSales: number;
    totalCourses: number;
    totalTeachers: number;
    totalStudents: number;
    monthlyChange: {
        revenue: number;
        sales: number;
        courses: number;
        teachers: number;
        students: number;
    };
};