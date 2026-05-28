import { LucideIcon } from "lucide-react";

export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    dpi: string;
}

export interface ProductSelection {
    productId: string;
    productName: string;
    productType: "COURSE" | "LEARNING_PATH";
    price: number;
}

export interface PaymentInfo {
    paymentIntentId: string;
}

export interface CheckoutFormData {
    personalInfo: PersonalInfo;
    productSelection: ProductSelection;
    payment: PaymentInfo;
}

export interface CheckoutStep {
    id: string;
    label: string;
    icon: LucideIcon;
    description: string;
}
