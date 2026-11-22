import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { resolveCheckoutAmount } from '@/lib/checkout-amount';
import { productPagePath } from '@/lib/checkout-return';
import { prisma } from '@/lib/db';

const createPaymentSchema = z.discriminatedUnion('productType', [
  z.object({ productType: z.literal('COURSE'), courseId: z.string().min(1) }),
  z.object({ productType: z.literal('LEARNING_PATH'), learningPathId: z.string().min(1) }),
]);

const productSelect = { isPublished: true, isFree: true, price: true } as const;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = createPaymentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment request' }, { status: 400 });
    }

    const body = parsed.data;
    const { productType } = body;
    const courseId = body.productType === 'COURSE' ? body.courseId : undefined;
    const learningPathId = body.productType === 'LEARNING_PATH' ? body.learningPathId : undefined;

    const course = courseId
      ? await prisma.course.findUnique({ where: { id: courseId }, select: productSelect })
      : null;
    const learningPath = learningPathId
      ? await prisma.learningPath.findUnique({ where: { id: learningPathId }, select: { ...productSelect, slug: true } })
      : null;
    const product = course ?? learningPath;

    const resolved = resolveCheckoutAmount(
      product && { ...product, price: product.price === null ? null : Number(product.price) }
    );
    if (!resolved.ok) {
      return NextResponse.json({ error: 'Product not available' }, { status: resolved.status });
    }

    const { amount } = resolved;
    const customerEmail = session.user.email;

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        productType,
        courseId,
        learningPathId,
        status: 'PENDING',
        metadata: { customerEmail },
      },
    });

    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const successUrl = new URL('/onboarding', baseUrl).toString();
    const cancelUrl = new URL(
      productPagePath({ courseId: courseId ?? null, learningPathSlug: learningPath?.slug ?? null }),
      baseUrl
    ).toString();

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