import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const activeAcademicYear = await prisma.academicYear.findFirst({
            where: {
                isActive: true
            }
        });

        if (!activeAcademicYear) {
            return NextResponse.json(
                { error: 'No active academic year found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ academicYear: activeAcademicYear });
    } catch (error) {
        console.error("Error fetching active academic year:", error);
        return NextResponse.json(
            { error: 'Failed to fetch active academic year' },
            { status: 500 }
        );
    }
} 