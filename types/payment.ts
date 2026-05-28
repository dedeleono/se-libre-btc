// types/payment.ts
import { PaymentProductType } from "@prisma/client";

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed';
    clientSecret?: string;
    checkoutUrl?: string;
}

export interface CreatePaymentIntentRequest {
    customerEmail: string;
    baseUrl: string;
    amount: number;
    productType: PaymentProductType;
    courseId?: string;
    learningPathId?: string;
}

export interface PaymentFormData {
    paymentIntentId: string;
}

export interface FormData {
    personalInfo: {
        name: string;
        email: string;
    };
    productSelection: {
        productId: string;
        productName: string;
        productType: PaymentProductType;
        price: number;
    };
    payment: PaymentFormData;
}