import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    
    // Clear all authentication-related cookies with matching options
    cookieStore.delete('dashboard-auth');

    cookieStore.delete('needs-onboarding');

    cookieStore.delete('currentPaymentIntent');

    return new NextResponse(null, { status: 200 });
}

export { GET as POST }; 
