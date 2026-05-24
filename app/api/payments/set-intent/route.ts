import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { paymentIntentId } = await req.json();
    
    // Set the cookie with the payment intent ID
    cookies().set('currentPaymentIntent', paymentIntentId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 // 1 hour
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting payment intent cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set payment intent' },
      { status: 500 }
    );
  }
} 