import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SupabaseNotifications } from '@/lib/supabase/notifications';
import { UserRole } from '@prisma/client';

interface CreatePaymentRequest {
  levelId: string;
  customerEmail: string;
  baseUrl: string;
  isFirstTimeStudent: boolean;
  monthlyAmount: number;
  inscriptionAmount: number | null;
  totalAmount: number;
  academicYearId?: string; // Optional for now, but will be required in the future
}

export async function POST(req: Request) {
    try {
        const { 
            levelId, 
            customerEmail, 
            baseUrl, 
            isFirstTimeStudent,
            monthlyAmount,
            inscriptionAmount,
            totalAmount,
            academicYearId
        } = await req.json() as CreatePaymentRequest;
        
        if (!levelId || !customerEmail || !baseUrl) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the level, student, active academic year and admin users
        const [level, existingStudent, adminUsers, activeAcademicYear] = await Promise.all([
            prisma.level.findUnique({
                where: { id: levelId },
            }),
            prisma.user.findUnique({
                where: { email: customerEmail }
            }),
            prisma.user.findMany({
                where: { role: UserRole.ADMIN }
            }),
            academicYearId ? 
                prisma.academicYear.findUnique({ where: { id: academicYearId } }) :
                prisma.academicYear.findFirst({ where: { isActive: true } })
        ]);

        if (!level) {
            return NextResponse.json(
                { error: 'Level not found' },
                { status: 404 }
            );
        }

        if (!activeAcademicYear) {
            return NextResponse.json(
                { error: 'No active academic year found' },
                { status: 404 }
            );
        }

        // If student doesn't exist, they should be charged inscription
        const shouldChargeInscription = !existingStudent;

        // Override isFirstTimeStudent based on database check
        if (shouldChargeInscription !== isFirstTimeStudent) {
            return NextResponse.json(
                { 
                    error: shouldChargeInscription 
                        ? 'New students must pay inscription fee' 
                        : 'Existing students should not pay inscription fee'
                },
                { status: 400 }
            );
        }

        // Validate the amounts match what's in the database
        if (level.price !== monthlyAmount) {
            return NextResponse.json(
                { error: 'Monthly amount mismatch' },
                { status: 400 }
            );
        }

        if (shouldChargeInscription && level.inscriptionPrice !== inscriptionAmount) {
            return NextResponse.json(
                { error: 'Inscription amount mismatch' },
                { status: 400 }
            );
        }

        const expectedTotal = shouldChargeInscription 
            ? (monthlyAmount + (inscriptionAmount || 0))
            : monthlyAmount;

        if (expectedTotal !== totalAmount) {
            return NextResponse.json(
                { error: 'Total amount mismatch' },
                { status: 400 }
            );
        }

        let student = existingStudent;
        if (!student) {
            student = await prisma.user.create({
                data: {
                    email: customerEmail,
                    role: UserRole.STUDENT,
                    // Add any other required fields as needed (e.g., name)
                }
            });
        }

        // Create a payment record in the database
        const payment = await prisma.payment.create({
            data: {
                userEmail: student.email,
                amount: totalAmount,
                levelId: level.id,
                status: "PENDING",
                paymentType: shouldChargeInscription ? "INSCRIPTION_AND_MONTHLY" : "MONTHLY",
                academicYearId: activeAcademicYear.id,
                metadata: {
                    customerEmail,
                    isInscriptionIncluded: shouldChargeInscription,
                    monthlyAmount,
                    inscriptionAmount: shouldChargeInscription ? inscriptionAmount : null,
                    academicYear: activeAcademicYear.name
                }
            }
        });

        // If this is a new student or there's no existing academic year enrollment,
        // we'll create the academic year enrollment when the payment is completed

        // Create notifications for all admin users
        try {
            const notificationPromises = adminUsers.map(admin => 
                SupabaseNotifications.createPaymentNotification(
                    payment.id,
                    admin.id,
                    totalAmount,
                    false
                ).catch(error => {
                    console.error(`Failed to create notification for admin ${admin.id}:`, error);
                    return null;
                })
            );

            const results = await Promise.all(notificationPromises);
            const successfulNotifications = results.filter(result => result !== null);
            
            if (successfulNotifications.length === 0) {
                // If all notifications failed, we should log this as a critical error
                console.error(`Critical: All notifications failed for payment ${payment.id}`);
                // You might want to implement a retry mechanism or alert system here
            } else if (successfulNotifications.length < adminUsers.length) {
                console.warn(`Warning: Only ${successfulNotifications.length}/${adminUsers.length} notifications were created for payment ${payment.id}`);
            } else {
                console.log(`Successfully created notifications for payment ${payment.id} for all ${adminUsers.length} admin(s)`);
            }
        } catch (error) {
            console.error('Failed to create notifications:', error);
            // Continue with payment process but log this as a critical error
            console.error('Critical: Notification system failure');
            // You might want to implement a retry mechanism or alert system here
        }

        // Format the success URL properly
        const successUrl = new URL('/onboarding', baseUrl).toString();
        const cancelUrl = new URL('/checkout/error', baseUrl).toString();

        const apiUrl = `${process.env.NEXT_PUBLIC_RECURRENTE_API_URL}/checkouts`;
        
        const paymentDescription = shouldChargeInscription
            ? `Inscripción y Mensualidad - ${level.name} - ${activeAcademicYear.name}`
            : `Mensualidad - ${level.name} - ${activeAcademicYear.name}`;
            
        const requestBody = {
            items: [{
                name: paymentDescription,
                description: `${shouldChargeInscription ? 'Inscripción y ' : ''}Mensualidad para el grado ${level.name} - Año académico ${activeAcademicYear.name}`,
                currency: "GTQ",
                amount_in_cents: Math.round(totalAmount * 100),
                charge_type: "one_time",
                image_url: "",
                metadata: {
                    levelId,
                    customerEmail,
                    paymentId: payment.id,
                    academicYearId: activeAcademicYear.id,
                    isInscriptionIncluded: shouldChargeInscription
                }
            }],
            customer: {
                email: customerEmail
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                levelId,
                customerEmail,
                paymentId: payment.id,
                academicYearId: activeAcademicYear.id,
                isInscriptionIncluded: shouldChargeInscription
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'X-PUBLIC-KEY': process.env.RECURRENTE_PUBLIC_KEY!,
                'X-SECRET-KEY': process.env.RECURRENTE_SECRET_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
            console.error('Payment service error:', data);
            return NextResponse.json(
                { error: data.error || 'Failed to create checkout session' },
                { status: response.ok ? 400 : response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
} 