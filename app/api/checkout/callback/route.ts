import { redirect } from 'next/navigation';

import { productPagePath } from '@/lib/checkout-return';
import { prisma } from '@/lib/db';

async function callbackTarget(paymentId: string | null): Promise<string> {
    if (!paymentId) return '/courses';

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            select: { status: true, courseId: true, learningPath: { select: { slug: true } } },
        });

        if (!payment) return '/courses';
        if (payment.status === 'COMPLETED') return '/onboarding';
        return productPagePath({ courseId: payment.courseId, learningPathSlug: payment.learningPath?.slug ?? null });
    } catch (error) {
        console.error('Error processing callback:', error);
        return '/courses';
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    redirect(await callbackTarget(searchParams.get('payment_intent')));
}
