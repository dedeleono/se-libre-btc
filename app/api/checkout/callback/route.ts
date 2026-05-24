import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');
    
    if (!paymentIntentId) {
        return redirect('/checkout/error');
    }

    try {
        // Verify payment status with Recurrente
        const payment = await prisma.payment.findUnique({
            where: { id: paymentIntentId }
        });

        if (payment?.status === "COMPLETED") {
            // Payment successful, redirect to success page
            return redirect('/checkout/success');
        } else {
            // Payment pending or failed
            return redirect('/checkout/error');
        }
    } catch (error) {
        console.error('Error processing callback:', error);
        return redirect('/checkout/error');
    }
} 