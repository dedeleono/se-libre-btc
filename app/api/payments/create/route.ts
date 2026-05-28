import { NextResponse } from 'next/server';
import { PaymentProductType, UserRole } from '@prisma/client';

import { prisma } from '@/lib/db';

interface CreatePaymentRequest {
  customerEmail: string;
  baseUrl: string;
  amount: number;
  productType: PaymentProductType;
  courseId?: string;
  learningPathId?: string;
}

export async function POST(req: Request) {
  try {
    const { customerEmail, baseUrl, amount, productType, courseId, learningPathId } = await req.json() as CreatePaymentRequest;

    if (!customerEmail || !baseUrl || amount == null || !productType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
      user = await prisma.user.create({ data: { email: customerEmail, role: UserRole.STUDENT } });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        productType,
        courseId,
        learningPathId,
        status: 'PENDING',
        metadata: { customerEmail },
      },
    });

    const successUrl = new URL('/onboarding', baseUrl).toString();
    const cancelUrl = new URL('/checkout/error', baseUrl).toString();

    if (!process.env.NEXT_PUBLIC_RECURRENTE_API_URL) {
      return NextResponse.json({ paymentId: payment.id, successUrl, cancelUrl });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_RECURRENTE_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'X-PUBLIC-KEY': process.env.RECURRENTE_PUBLIC_KEY!,
        'X-SECRET-KEY': process.env.RECURRENTE_SECRET_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          name: productType.replace('_', ' '),
          description: 'Bitcoin education platform access',
          currency: 'GTQ',
          amount_in_cents: Math.round(amount * 100),
          charge_type: 'one_time',
          metadata: { paymentId: payment.id, courseId, learningPathId },
        }],
        customer: { email: customerEmail },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { paymentId: payment.id, courseId, learningPathId },
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return NextResponse.json({ error: data.error || 'Failed to create checkout session' }, { status: response.ok ? 400 : response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}