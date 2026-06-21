import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db";

export async function GET(req: Request, props: { params: Promise<{ paymentIntentId: string }> }) {
    const params = await props.params;
    try {
        const storedIntentId = (await cookies()).get('currentPaymentIntent')?.value;
        
        if (!storedIntentId || storedIntentId !== params.paymentIntentId) {
            return NextResponse.json(
                { error: 'Invalid payment intent' },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.findUnique({
            where: {
                id: params.paymentIntentId
            }
        });

        if (!payment) {
            return NextResponse.json({ status: 'pending' });
        }

        // Access card details from metadata
        const metadata = payment.metadata as { last4?: string; expiry?: string } | null;

        // Clear the cookie after successful verification
        (await cookies()).delete('currentPaymentIntent');

        return NextResponse.json({
            status: payment.status === "COMPLETED" ? 'succeeded' : 'pending',
            last4: metadata?.last4 || '****',
            expiry: metadata?.expiry || '**/**'
        });

    } catch (error) {
        console.error('Error fetching payment status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment status' },
            { status: 500 }
        );
    }
}