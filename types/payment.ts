// types/payment.ts
export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed';
    clientSecret?: string;
    checkoutUrl?: string;
}

export interface CreatePaymentIntentRequest {
    levelId: string;
    customerEmail: string;
    baseUrl: string;
}

export interface PaymentFormData {
    paymentIntentId: string;
}

export interface FormData {
    personalInfo: {
        name: string;
        email: string;
    };
    levelSelection: {
        levelId: string;
        levelName: string;
        price: number;
    };
    payment: PaymentFormData;
}