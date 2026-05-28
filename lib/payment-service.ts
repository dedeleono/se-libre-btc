import { PaymentIntent, CreatePaymentIntentRequest } from "@/types/payment";

export class PaymentService {
    private static readonly API_URL = process.env.NEXT_PUBLIC_RECURRENTE_API_URL;
    private static readonly PUBLIC_KEY = process.env.RECURRENTE_PUBLIC_KEY;
    private static readonly SECRET_KEY = process.env.RECURRENTE_SECRET_KEY;

    static async createPaymentIntent(params: CreatePaymentIntentRequest): Promise<PaymentIntent> {
        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const data = await response.json();
            
            return {
                id: data.id,
                amount: data.amount_in_cents,
                currency: data.currency,
                status: 'pending',
                clientSecret: data.client_secret,
                checkoutUrl: data.checkout_url
            };
        } catch (error) {
            console.error('Checkout session creation failed:', error);
            throw error;
        }
    }

    static async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
        try {
            const response = await fetch(`${this.API_URL}/v2/charges/${paymentIntentId}/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Payment confirmation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Payment confirmation failed:', error);
            throw error;
        }
    }
}